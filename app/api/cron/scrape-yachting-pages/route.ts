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
  address: string
  country: string
  location: string
  services: string
  profileUrl: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const BASE = 'https://www.yachting-pages.com'

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.text()
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function text(el: Element | null): string {
  return el?.textContent?.trim().replace(/\s+/g, ' ') ?? ''
}

// ── Extract listing links from a category page ──────────────────────────────
function extractListingLinks(doc: Document): string[] {
  const links: string[] = []
  // Yachting Pages listing links are typically in search result cards
  const anchors = doc.querySelectorAll('a[href]')
  for (const a of anchors) {
    const href = a.getAttribute('href') || ''
    // Company profile links typically follow pattern /company/company-name or /superyacht-services/company-name
    if (
      (href.includes('/superyacht-services/') || href.includes('/company/') || href.includes('/listing/')) &&
      !href.includes('/provisioning') &&
      !href.includes('/category/') &&
      !href.includes('javascript:')
    ) {
      const fullUrl = href.startsWith('http') ? href : `${BASE}${href.startsWith('/') ? '' : '/'}${href}`
      if (!links.includes(fullUrl)) links.push(fullUrl)
    }
  }
  return links
}

// ── Extract pagination links ─────────────────────────────────────────────────
function extractPaginationLinks(doc: Document): string[] {
  const links: string[] = []
  const pageAnchors = doc.querySelectorAll('a[href*="page="], a[href*="/page/"], .pagination a, .pager a, nav a[href]')
  for (const a of pageAnchors) {
    const href = a.getAttribute('href') || ''
    if (href && !href.includes('javascript:')) {
      const fullUrl = href.startsWith('http') ? href : `${BASE}${href.startsWith('/') ? '' : '/'}${href}`
      if (!links.includes(fullUrl) && fullUrl.includes('yachting-pages.com')) {
        links.push(fullUrl)
      }
    }
  }
  return links
}

// ── Extract all emails from a page ───────────────────────────────────────────
function extractEmails(doc: Document, html: string): string[] {
  const emails: string[] = []

  // From mailto: links
  const mailtoLinks = doc.querySelectorAll('a[href^="mailto:"]')
  for (const a of mailtoLinks) {
    const href = a.getAttribute('href') || ''
    const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase()
    if (email && email.includes('@') && !emails.includes(email)) emails.push(email)
  }

  // Regex scan the HTML for email patterns
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const matches = html.match(emailRegex) || []
  for (const m of matches) {
    const email = m.toLowerCase()
    if (
      !emails.includes(email) &&
      !email.endsWith('.png') &&
      !email.endsWith('.jpg') &&
      !email.endsWith('.gif') &&
      !email.includes('example.com') &&
      !email.includes('yachting-pages.com')
    ) {
      emails.push(email)
    }
  }

  return emails
}

// ── Extract all phone numbers from a page ────────────────────────────────────
function extractPhones(doc: Document, html: string): string[] {
  const phones: string[] = []

  // From tel: links
  const telLinks = doc.querySelectorAll('a[href^="tel:"]')
  for (const a of telLinks) {
    const href = a.getAttribute('href') || ''
    const phone = href.replace('tel:', '').trim()
    if (phone && !phones.includes(phone)) phones.push(phone)
  }

  // Look for phone numbers near phone icons / labels
  const phoneRegex = /(?:Tel|Phone|Mob|Fax|Call)[:\s]*([+\d\s().\-]{7,20})/gi
  const phoneMatches = html.match(phoneRegex) || []
  for (const m of phoneMatches) {
    const cleaned = m.replace(/^(?:Tel|Phone|Mob|Fax|Call)[:\s]*/i, '').trim()
    if (cleaned && !phones.includes(cleaned)) phones.push(cleaned)
  }

  return phones
}

// ── Extract website URLs from a page ─────────────────────────────────────────
function extractWebsite(doc: Document): string {
  // Look for external website links
  const anchors = doc.querySelectorAll('a[href]')
  for (const a of anchors) {
    const href = a.getAttribute('href') || ''
    const linkText = text(a).toLowerCase()
    if (
      (linkText.includes('visit website') || linkText.includes('website') || linkText.includes('www')) &&
      href.startsWith('http') &&
      !href.includes('yachting-pages.com') &&
      !href.includes('facebook.com') &&
      !href.includes('twitter.com') &&
      !href.includes('instagram.com') &&
      !href.includes('linkedin.com')
    ) {
      return href
    }
  }

  // Fallback: find any external link that isn't social media
  for (const a of anchors) {
    const href = a.getAttribute('href') || ''
    if (
      href.startsWith('http') &&
      !href.includes('yachting-pages.com') &&
      !href.includes('google.com') &&
      !href.includes('facebook.com') &&
      !href.includes('twitter.com') &&
      !href.includes('instagram.com') &&
      !href.includes('linkedin.com') &&
      !href.includes('youtube.com')
    ) {
      return href
    }
  }

  return ''
}

// ── Scrape a single company profile page ─────────────────────────────────────
async function scrapeCompanyPage(url: string): Promise<ScrapedCompany | null> {
  try {
    const html = await fetchPage(url)
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // Company name — try various selectors
    const nameEl =
      doc.querySelector('h1') ||
      doc.querySelector('.company-name') ||
      doc.querySelector('.listing-title') ||
      doc.querySelector('[itemprop="name"]')
    const name = text(nameEl)
    if (!name) return null

    // Description
    const descEl =
      doc.querySelector('.company-description') ||
      doc.querySelector('.listing-description') ||
      doc.querySelector('[itemprop="description"]') ||
      doc.querySelector('.about-text') ||
      doc.querySelector('.description') ||
      doc.querySelector('article p') ||
      doc.querySelector('.content p')
    const description = text(descEl)

    // Emails & phones
    const emails = extractEmails(doc, html)
    const phones = extractPhones(doc, html)

    // Website
    const website = extractWebsite(doc)

    // Address / location
    const addressEl =
      doc.querySelector('[itemprop="address"]') ||
      doc.querySelector('.address') ||
      doc.querySelector('.company-address') ||
      doc.querySelector('.location')
    const address = text(addressEl)

    // Country — often in structured data or address
    let country = ''
    const countryEl = doc.querySelector('[itemprop="addressCountry"]')
    if (countryEl) {
      country = text(countryEl)
    } else if (address) {
      // Try to extract country from the end of the address
      const parts = address.split(',').map(p => p.trim())
      if (parts.length >= 2) country = parts[parts.length - 1]
    }

    // Location / city
    let location = ''
    const localityEl = doc.querySelector('[itemprop="addressLocality"]')
    if (localityEl) {
      location = text(localityEl)
    } else if (address) {
      const parts = address.split(',').map(p => p.trim())
      if (parts.length >= 2) location = parts[0]
    }

    // Services / tags
    const tagEls = doc.querySelectorAll('.tag, .category-tag, .service-tag, .badge, [itemprop="category"]')
    const services = Array.from(tagEls).map(e => text(e)).filter(Boolean).join(', ')

    return {
      name,
      description,
      website,
      email: emails[0] || '',
      email2: emails[1] || '',
      phone: phones[0] || '',
      phone2: phones[1] || '',
      address,
      country,
      location,
      services,
      profileUrl: url,
    }
  } catch (err) {
    console.error(`[scrape-yp] Error scraping ${url}:`, err)
    return null
  }
}

// ── Main scraping flow ───────────────────────────────────────────────────────
async function scrapeProvisioningDirectory(): Promise<ScrapedCompany[]> {
  const allCompanies: ScrapedCompany[] = []
  const visitedPages = new Set<string>()
  const visitedProfiles = new Set<string>()

  // Start with the provisioning category page
  const startUrl = `${BASE}/provisioning`
  const pagesToVisit = [startUrl]

  // Also try common sub-category URLs for provisioning
  const subCategories = [
    '/superyacht-services/provisioning',
    '/category/provisioning',
    '/categories/provisioning',
    '/search?category=provisioning',
    '/search?q=provisioning',
  ]
  for (const sub of subCategories) {
    pagesToVisit.push(`${BASE}${sub}`)
  }

  // Crawl category / listing pages
  while (pagesToVisit.length > 0) {
    const pageUrl = pagesToVisit.shift()!
    if (visitedPages.has(pageUrl)) continue
    visitedPages.add(pageUrl)

    console.log(`[scrape-yp] Crawling listing page: ${pageUrl}`)

    try {
      const html = await fetchPage(pageUrl)
      const dom = new JSDOM(html)
      const doc = dom.window.document

      // Extract company profile links
      const profileLinks = extractListingLinks(doc)
      for (const link of profileLinks) {
        if (!visitedProfiles.has(link)) {
          visitedProfiles.add(link)
        }
      }

      // Extract pagination links (only follow pages under yachting-pages.com)
      if (visitedPages.size < 30) {
        const paginationLinks = extractPaginationLinks(doc)
        for (const link of paginationLinks) {
          if (!visitedPages.has(link) && link.includes('provisioning')) {
            pagesToVisit.push(link)
          }
        }
      }

      // Also try to extract inline company data from the listing page itself
      // Many directory sites show summary cards with contact info
      const cards = doc.querySelectorAll('.listing-item, .search-result, .company-card, .result-item, .listing, article.listing')
      for (const card of cards) {
        const cardName = text(card.querySelector('h2, h3, h4, .company-name, .title'))
        if (cardName && !allCompanies.some(c => c.name === cardName)) {
          const cardEmails = extractEmails(card as unknown as Document, card.innerHTML)
          const cardPhones = extractPhones(card as unknown as Document, card.innerHTML)
          const cardDesc = text(card.querySelector('p, .description, .summary'))
          const cardLink = card.querySelector('a[href]')
          const cardWebsite = cardLink?.getAttribute('href') || ''

          if (cardName && (cardEmails.length > 0 || cardPhones.length > 0 || cardDesc)) {
            allCompanies.push({
              name: cardName,
              description: cardDesc,
              website: cardWebsite.startsWith('http') && !cardWebsite.includes('yachting-pages.com') ? cardWebsite : '',
              email: cardEmails[0] || '',
              email2: cardEmails[1] || '',
              phone: cardPhones[0] || '',
              phone2: cardPhones[1] || '',
              address: '',
              country: '',
              location: '',
              services: 'Provisioning',
              profileUrl: '',
            })
          }
        }
      }

      // Be respectful — wait between requests
      await sleep(1500)
    } catch (err) {
      console.error(`[scrape-yp] Error on listing page ${pageUrl}:`, err)
    }
  }

  // Now scrape individual company profile pages
  const profileUrls = Array.from(visitedProfiles)
  console.log(`[scrape-yp] Found ${profileUrls.length} company profiles to scrape`)

  for (let i = 0; i < profileUrls.length; i++) {
    const url = profileUrls[i]
    console.log(`[scrape-yp] Scraping profile ${i + 1}/${profileUrls.length}: ${url}`)

    const company = await scrapeCompanyPage(url)
    if (company && !allCompanies.some(c => c.name === company.name)) {
      allCompanies.push(company)
    }

    // Rate limit — 2 seconds between profile page requests
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
      // Check if contact already exists by name + category
      const existing = await prisma.crmContact.findFirst({
        where: {
          name: company.name,
          category: 'Provisioning',
        },
      })

      const data = {
        name: company.name,
        category: 'Provisioning',
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
          company.services ? `Services: ${company.services}` : '',
          company.profileUrl ? `YP Profile: ${company.profileUrl}` : '',
        ].filter(Boolean).join('\n'),
        source: 'scraped',
        tags: [
          'provisioning',
          'yachting-pages',
          company.services ? company.services.toLowerCase() : '',
        ].filter(Boolean).join(','),
        lastScraped: new Date(),
      }

      if (existing) {
        // Update if we have new info
        await prisma.crmContact.update({
          where: { id: existing.id },
          data,
        })
        updated++
      } else {
        await prisma.crmContact.create({
          data: {
            ...data,
            priority: 'medium',
          },
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

  try {
    console.log('[scrape-yp] Starting Yachting Pages provisioning scrape...')

    const companies = await scrapeProvisioningDirectory()
    console.log(`[scrape-yp] Scraped ${companies.length} companies total`)

    const results = await upsertCompanies(companies)
    console.log(`[scrape-yp] Upsert complete:`, results)

    return NextResponse.json({
      success: true,
      scraped: companies.length,
      ...results,
      companies: companies.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        website: c.website,
        country: c.country,
        location: c.location,
      })),
    })
  } catch (error) {
    console.error('[scrape-yp] Fatal error:', error)
    return NextResponse.json(
      { error: 'Scraping failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
