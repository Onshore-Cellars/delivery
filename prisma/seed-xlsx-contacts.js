// Import yacht contacts from parsed Contacts.xlsx into CRM
// Run with: node prisma/seed-xlsx-contacts.js

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

function buildNotes(c) {
  const parts = []
  if (c.notes) parts.push(c.notes)
  if (c.contactName) parts.push('Contact: ' + c.contactName)
  if (c.designation) parts.push('Role: ' + c.designation)
  if (c.department) parts.push('Dept: ' + c.department)
  if (c.yachtLength) parts.push('Length: ' + c.yachtLength + 'm')
  if (c.mmsi) parts.push('MMSI: ' + c.mmsi)
  if (c.imo) parts.push('IMO: ' + c.imo)
  return parts.join(' | ')
}

function cleanWebsite(url) {
  if (!url) return ''
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function determinePriority(c) {
  if (c.accountType === 'Customer' && c.email) return 'high'
  if (c.email && c.phone) return 'high'
  if (c.email || c.phone) return 'medium'
  return 'low'
}

async function main() {
  const jsonPath = path.join(__dirname, 'xlsx-contacts.json')
  if (!fs.existsSync(jsonPath)) {
    console.error('xlsx-contacts.json not found. Run: node scripts/parse-contacts.js first')
    process.exit(1)
  }

  const contacts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  console.log('Loaded ' + contacts.length + ' yacht contacts from xlsx')

  let created = 0, skipped = 0, errors = 0

  for (const c of contacts) {
    if (!c.name || c.name.trim().length === 0) { skipped++; continue }
    try {
      const existing = await prisma.crmContact.findFirst({
        where: { name: c.name.trim(), category: c.category },
      })
      if (existing) { skipped++; continue }

      await prisma.crmContact.create({
        data: {
          name: c.name.trim(),
          category: c.category,
          country: c.country || null,
          location: c.location || null,
          website: cleanWebsite(c.website) || null,
          email: c.email || null,
          phone: c.phone || null,
          phone2: c.phone2 || null,
          notes: buildNotes(c) || null,
          priority: determinePriority(c),
          source: 'xlsx_import',
          tags: [c.industry, c.accountType, c.yachtLength ? c.yachtLength + 'm' : ''].filter(Boolean).join(',') || null,
        },
      })
      created++
    } catch (err) {
      errors++
      if (errors <= 5) console.error('Error creating ' + c.name + ':', err.message)
    }
  }

  console.log('\nDone! Created: ' + created + ', Skipped: ' + skipped + ', Errors: ' + errors)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
