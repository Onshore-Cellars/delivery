import { NextRequest, NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

// ── Auth ─────────────────────────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) return true
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (token) {
    const decoded = verifyToken(token)
    if (decoded?.role === 'ADMIN') return true
  }
  return false
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ScrapedCompany {
  name: string
  description: string
  website: string
  email: string
  email2: string
  phone: string
  phone2: string
  fax: string
  address: string
  country: string
  location: string
  region: string
  services: string
  profileUrl: string
  category: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const WAYBACK_BASE = 'https://web.archive.org/web/2026'
const YP_BASE = 'https://www.yachting-pages.com'

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function ogMeta(card: Element, property: string): string {
  const el = card.querySelector(`meta[property="${property}"]`)
  return el?.getAttribute('content')?.trim() ?? ''
}

function nameMeta(card: Element, name: string): string {
  const el = card.querySelector(`meta[name="${name}"]`)
  return el?.getAttribute('content')?.trim() ?? ''
}

function stripWayback(url: string): string {
  return url.replace(/.*\/https:\/\/www\.yachting-pages\.com/, YP_BASE)
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// ── All known category slugs on yachting-pages.com ──────────────────────────
const CATEGORY_SLUGS = [
  'accommodation-crew-houses',
  'art-management-logistics',
  'associations-organisations',
  'aviation',
  'awnings-canopies-covers',
  'bathrooms-spas',
  'beds-linen-suppliers',
  'berths-sales-rental-mgmt',
  'carpenters-joiners',
  'carpets-flooring',
  'chandlers',
  'cleaning-services',
  'composite-services',
  'concierge-services',
  'crew-agents',
  'crew-products-services',
  'crew-training',
  'davits-hydraulics',
  'deck-exterior-equipment',
  'doors-hatches',
  'electrical-engineers',
  'eng1-medical-certificate',
  'engine-services',
  'engineering-equipment-services',
  'engineering-supplies-services',
  'entertainment-av-systems',
  'entertainment-luxury-events',
  'fabrication-materials',
  'fenders-fender-covers',
  'fire-protection',
  'fitness',
  'florists',
  'fuel-bunkering-additives',
  'furniture-furnishings',
  'galley-catering-equipment',
  'galley-chef',
  'generators-power-management',
  'glass-suppliers-services',
  'hair-beauty',
  'health-fitness',
  'hvac-refrigeration',
  'insurance',
  'interior-design',
  'interior-equipment-services',
  'laundry-equipment',
  'lawyers',
  'legal-financial-professional-services',
  'lifts-elevators',
  'lights-lighting-consultants',
  'limousines-car-hire',
  'luxury-goods',
  'maintenance-services',
  'marine-communications-connectivity',
  'marine-electronics',
  'marine-finance',
  'marine-marketing-services',
  'maritime-security',
  'massage-therapy',
  'medical-supplies-services',
  'metal-works-fabrication-supply',
  'model-makers',
  'naval-architects',
  'navigation-charts-equipment',
  'painting-coating-wrapping',
  'passerelles-boarding-systems',
  'pet-services',
  'photographers',
  'port-marina-dock-equipment',
  'ports-and-marinas',
  'project-management-owners-reps',
  'propellers-propulsion',
  'provisioning',
  'refit-repair',
  'registration-classification-ism',
  'sailing-rigging',
  'security-safety',
  'shipping-logistics-storage',
  'shipyards-marina-equipment',
  'shipyards-new-construction',
  'shipyards-refit-repair',
  'shore-support-services',
  'sign-makers-name-plates',
  'stabilisers',
  'surveyors',
  'tableware',
  'technology',
  'tenders-toys',
  'toiletries',
  'transport-travel-leisure',
  'travel-agents',
  'uniforms-clothing',
  'upholstery-fabrics',
  'water-treatment',
  'wine-spirits-soft-drinks',
  'yacht-agents',
  'yacht-boat-transport',
  'yacht-charter-brokerage',
  'yacht-designers',
  'yacht-management-ism',
]

// ── Extract companies from a listing page using summary-item cards ──────────
function extractCompaniesFromPage(doc: Document, categorySlug: string): ScrapedCompany[] {
  const companies: ScrapedCompany[] = []
  const summaryItems = doc.querySelectorAll('.summary-item')
  const categoryName = slugToTitle(categorySlug)

  for (const card of summaryItems) {
    const titleEl = card.querySelector('title')
    const name = titleEl?.textContent?.trim() || ogMeta(card, 'og:title')
    if (!name) continue

    const description = nameMeta(card, 'description') || ogMeta(card, 'og:description')
    const services = nameMeta(card, 'keywords')

    const street = ogMeta(card, 'business:contact_data:street_address')
    const locality = ogMeta(card, 'business:contact_data:locality')
    const region = ogMeta(card, 'business:contact_data:region')
    const postal = ogMeta(card, 'business:contact_data:postal_code')
    const country = ogMeta(card, 'business:contact_data:country_name')
    const email = ogMeta(card, 'business:contact_data:email')
    const phone = ogMeta(card, 'business:contact_data:phone_number')
    const website = ogMeta(card, 'business:contact_data:website')
    const fax = ogMeta(card, 'business:contact_data:fax_number')

    const profileUrl = stripWayback(ogMeta(card, 'og:url'))
    const address = [street, locality, region, postal, country].filter(Boolean).join(', ')

    // Additional emails/phones from links in the card
    const emails = [email]
    for (const a of card.querySelectorAll('a[href^="mailto:"]')) {
      const em = (a.getAttribute('href') || '').replace('mailto:', '').split('?')[0].trim().toLowerCase()
      if (em && em.includes('@') && !emails.includes(em)) emails.push(em)
    }

    const phones = [phone]
    for (const a of card.querySelectorAll('a[href^="tel:"]')) {
      const ph = (a.getAttribute('href') || '').replace('tel:', '').trim()
      if (ph && !phones.includes(ph)) phones.push(ph)
    }

    companies.push({
      name,
      description: description.substring(0, 2000),
      website: website || '',
      email: emails[0] || '',
      email2: emails[1] || '',
      phone: phones[0] || '',
      phone2: phones[1] || '',
      fax: fax || '',
      address,
      country: country || '',
      location: locality || '',
      region: region || '',
      services: services.substring(0, 2000),
      profileUrl,
      category: categoryName,
    })
  }

  return companies
}

// ── Detect max page number from pagination links ─────────────────────────────
function getMaxPage(doc: Document): number {
  let maxPage = 1
  for (const a of doc.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') || ''
    const match = href.match(/\/p:(\d+)/)
    if (match) {
      const num = parseInt(match[1])
      if (num > maxPage) maxPage = num
    }
  }
  return maxPage
}

// ── Scrape a single category across all its pages ────────────────────────────
async function scrapeCategory(
  slug: string,
  seenNames: Set<string>,
  log: (msg: string) => void
): Promise<ScrapedCompany[]> {
  const companies: ScrapedCompany[] = []

  // Fetch page 1
  const page1Url = `${WAYBACK_BASE}/${YP_BASE}/listing/${slug}`
  log(`  Fetching ${slug} page 1...`)
  const html1 = await fetchPage(page1Url)

  if (!html1 || html1.length < 10000 || html1.includes('<title>Wayback Machine</title>')) {
    log(`  No cached data for ${slug}, skipping`)
    return companies
  }

  const dom1 = new JSDOM(html1)
  const doc1 = dom1.window.document
  const page1Companies = extractCompaniesFromPage(doc1, slug)

  for (const c of page1Companies) {
    if (!seenNames.has(c.name)) {
      seenNames.add(c.name)
      companies.push(c)
    }
  }

  // Detect total pages
  const maxPage = getMaxPage(doc1)
  log(`  ${slug}: page 1 = ${page1Companies.length} companies, ${maxPage} pages total`)

  // Fetch remaining pages
  for (let p = 2; p <= maxPage; p++) {
    await sleep(1500)
    const pageUrl = `${WAYBACK_BASE}/${YP_BASE}/listing/${slug}/p:${p}`
    log(`  Fetching ${slug} page ${p}/${maxPage}...`)

    const html = await fetchPage(pageUrl)
    if (!html || html.length < 10000) {
      log(`  No data for ${slug} page ${p}, stopping`)
      break
    }

    const dom = new JSDOM(html)
    const doc = dom.window.document
    const pageCompanies = extractCompaniesFromPage(doc, slug)

    if (pageCompanies.length === 0) break

    for (const c of pageCompanies) {
      if (!seenNames.has(c.name)) {
        seenNames.add(c.name)
        companies.push(c)
      }
    }
  }

  return companies
}

// ── Main scraping flow ───────────────────────────────────────────────────────
async function scrapeAllCategories(
  log: (msg: string) => void
): Promise<ScrapedCompany[]> {
  const allCompanies: ScrapedCompany[] = []
  const seenNames = new Set<string>()

  log(`Starting scrape of ${CATEGORY_SLUGS.length} categories...`)

  for (let i = 0; i < CATEGORY_SLUGS.length; i++) {
    const slug = CATEGORY_SLUGS[i]
    log(`[${i + 1}/${CATEGORY_SLUGS.length}] Category: ${slug}`)

    try {
      const companies = await scrapeCategory(slug, seenNames, log)
      allCompanies.push(...companies)
      log(`  => ${companies.length} new companies (total: ${allCompanies.length})`)
    } catch (err) {
      log(`  Error on ${slug}: ${err instanceof Error ? err.message : 'Unknown'}`)
    }

    // Rate limit between categories
    await sleep(2000)
  }

  return allCompanies
}

// ── Upsert scraped companies into CrmContact ────────────────────────────────
async function upsertCompanies(companies: ScrapedCompany[]) {
  let created = 0
  let updated = 0
  let skipped = 0

  for (const company of companies) {
    if (!company.name) { skipped++; continue }

    try {
      const existing = await prisma.crmContact.findFirst({
        where: { name: company.name },
      })

      const data = {
        name: company.name,
        category: company.category,
        country: company.country || null,
        location: company.location || null,
        website: company.website || null,
        email: company.email || null,
        email2: company.email2 || null,
        phone: company.phone || null,
        phone2: company.phone2 || null,
        notes: [
          company.description,
          company.address ? `Address: ${company.address}` : '',
          company.region ? `Region: ${company.region}` : '',
          company.fax ? `Fax: ${company.fax}` : '',
          company.services ? `Services: ${company.services.substring(0, 500)}` : '',
          company.profileUrl ? `YP Profile: ${company.profileUrl}` : '',
        ].filter(Boolean).join('\n'),
        source: 'scraped',
        tags: ['yachting-pages', company.category.toLowerCase().replace(/\s+/g, '-')].join(','),
        lastScraped: new Date(),
      }

      if (existing) {
        await prisma.crmContact.update({
          where: { id: existing.id },
          data,
        })
        updated++
      } else {
        await prisma.crmContact.create({
          data: { ...data, priority: 'medium' },
        })
        created++
      }
    } catch (err) {
      console.error(`[scrape-yp] Error upserting ${company.name}:`, err)
      skipped++
    }
  }

  return { created, updated, skipped }
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const logs: string[] = []
  const log = (msg: string) => {
    console.log(`[scrape-yp] ${msg}`)
    logs.push(msg)
  }

  try {
    log('Starting full Yachting Pages directory scrape...')

    const companies = await scrapeAllCategories(log)
    log(`Scraped ${companies.length} unique companies across ${CATEGORY_SLUGS.length} categories`)

    const results = await upsertCompanies(companies)
    log(`Upsert complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`)

    return NextResponse.json({
      success: true,
      scraped: companies.length,
      categories: CATEGORY_SLUGS.length,
      ...results,
      logs,
      companies: companies.map(c => ({
        name: c.name,
        email: c.email,
        email2: c.email2,
        phone: c.phone,
        phone2: c.phone2,
        website: c.website,
        country: c.country,
        location: c.location,
        category: c.category,
        profileUrl: c.profileUrl,
      })),
    })
  } catch (error) {
    console.error('[scrape-yp] Fatal error:', error)
    return NextResponse.json(
      { error: 'Scraping failed', details: error instanceof Error ? error.message : 'Unknown error', logs },
      { status: 500 },
    )
  }
}
