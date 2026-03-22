// CRM Contact Seed Script (JS version)
// Run with: node prisma/seed-crm.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const DB = [
  // PR & Marketing
  { name: "YachtCharterFleet", cat: "PR & Marketing", country: "Global", web: "yachtcharterfleet.com", email: "info@yachtcharterfleet.com", notes: "Charter listing platform", priority: "high" },
  { name: "SuperYacht Times", cat: "PR & Marketing", country: "Netherlands", web: "superyachttimes.com", email: "info@superyachttimes.com", ig: "@superyachttimes", notes: "Industry news & events", priority: "high" },
  { name: "Boat International", cat: "PR & Marketing", country: "UK", web: "boatinternational.com", email: "info@boatinternational.com", ig: "@boatinternational", notes: "World's leading superyacht media", priority: "high" },
  { name: "The Superyacht Report", cat: "PR & Marketing", country: "UK", web: "superyachtreport.com", email: "editorial@superyachtreport.com", notes: "Industry analysis", priority: "medium" },
  { name: "Dockwalk", cat: "PR & Marketing", country: "USA", web: "dockwalk.com", email: "info@dockwalk.com", ig: "@dockwalk", notes: "Crew magazine & job board", priority: "medium" },
  { name: "Yachting Pages", cat: "PR & Marketing", country: "UK", web: "yachtingpages.com", email: "info@yachtingpages.com", ig: "@yachtingpages", notes: "Supplier directory", priority: "high" },
  { name: "YACHT Magazine (DE)", cat: "PR & Marketing", country: "Germany", web: "yacht.de", email: "redaktion@yacht.de", notes: "German sailing magazine", priority: "low" },
  { name: "Asia Pacific Boating", cat: "PR & Marketing", country: "Hong Kong", web: "asiapacificboating.com", email: "info@asiapacificboating.com", notes: "Asia/Pacific yachting", priority: "low" },
  { name: "Yachts & Yachting", cat: "PR & Marketing", country: "UK", web: "yachtsandyachting.com", email: "info@yachtsandyachting.com", notes: "Sailing news & racing", priority: "low" },
  { name: "Superyacht Digest", cat: "PR & Marketing", country: "Global", web: "superyachtdigest.com", email: "editor@superyachtdigest.com", notes: "Online superyacht news", priority: "medium" },
  // Provisioning
  { name: "Luxury Yacht Provisions", cat: "Provisioning", country: "France", loc: "Antibes", web: "luxury-yacht-provisions.com", email: "orders@luxury-yacht-provisions.com", phone: "+33 4 93 34 XX XX", notes: "Fresh provisions & gourmet, Antibes-based", priority: "high" },
  { name: "YachtProv", cat: "Provisioning", country: "Spain", loc: "Palma de Mallorca", web: "yachtprov.com", email: "info@yachtprov.com", phone: "+34 971 XX XX XX", notes: "Full yacht provisioning service, Balearics", priority: "high" },
  { name: "Peter Pan Provisioning", cat: "Provisioning", country: "France", loc: "Antibes", web: "peterpan-yachtprovisions.com", email: "info@peterpan-yachtprovisions.com", notes: "Well-known Antibes provisioner", priority: "high" },
  { name: "Island Provisions", cat: "Provisioning", country: "Caribbean", loc: "St Maarten", web: "islandprovisions.com", email: "info@islandprovisions.com", notes: "Caribbean yacht provisions", priority: "high" },
  { name: "Superyacht Provisions Monaco", cat: "Provisioning", country: "Monaco", loc: "Monaco", web: "sypmonaco.com", email: "info@sypmonaco.com", notes: "Premium provisions Monaco", priority: "high" },
  // Chandlery
  { name: "Accastillage Diffusion", cat: "Chandlery", country: "France", loc: "Antibes", web: "accastillage-diffusion.com", email: "pro@ad-network.fr", notes: "Marine hardware & fittings, large EU chain", priority: "high" },
  { name: "Budget Marine (Caribbean)", cat: "Chandlery", country: "Caribbean", loc: "Multiple", web: "budgetmarine.com", email: "info@budgetmarine.com", notes: "Largest chandlery chain in Caribbean", priority: "high" },
  { name: "SW Marine Group", cat: "Chandlery", country: "France", loc: "Antibes", web: "swmarinegroup.com", email: "sales@swmarinegroup.com", notes: "Superyacht chandlery, Antibes", priority: "high" },
  // Yacht Agents
  { name: "Fraser Yachts", cat: "Yacht Agents", country: "Monaco", web: "fraseryachts.com", email: "info@fraseryachts.com", ig: "@fraseryachts", notes: "Charter, Sales, Management", priority: "high" },
  { name: "Burgess Yachts", cat: "Yacht Agents", country: "Monaco", web: "burgessyachts.com", email: "info@burgessyachts.com", ig: "@burgessyachts", notes: "Full-service yacht brokerage", priority: "high" },
  { name: "Camper & Nicholsons", cat: "Yacht Agents", country: "Monaco", web: "camperandnicholsons.com", email: "info@camperandnicholsons.com", ig: "@camperandnicholsons", notes: "Oldest yacht brokerage, est. 1782", priority: "high" },
  { name: "Northrop & Johnson", cat: "Yacht Agents", country: "USA", loc: "Fort Lauderdale", web: "northropandjohnson.com", email: "info@njcharters.com", ig: "@northropandjohnson", notes: "Major US broker", priority: "high" },
  { name: "Y.CO", cat: "Yacht Agents", country: "Monaco", web: "y.co", email: "info@y.co", ig: "@abordy.co", notes: "Brokerage & management", priority: "high" },
  { name: "Edmiston & Company", cat: "Yacht Agents", country: "Monaco", web: "edmiston.com", email: "info@edmiston.com", ig: "@edmiston_company", notes: "Ultra-luxury yacht broker", priority: "high" },
  { name: "IYC", cat: "Yacht Agents", country: "USA", loc: "Fort Lauderdale", web: "iyc.com", email: "info@iyc.com", ig: "@iyc_yachts", notes: "Sales, charter, management", priority: "high" },
  { name: "Ocean Independence", cat: "Yacht Agents", country: "Switzerland", web: "oceanindependence.com", email: "info@oceanindependence.com", ig: "@oceanindependence", notes: "Charter, Sales, New Build", priority: "medium" },
  { name: "Bluewater Yachting", cat: "Yacht Agents", country: "France", loc: "Antibes", web: "bluewateryachting.com", email: "info@bluewateryachting.com", ig: "@bluewateryachts", notes: "Charter & crew agency", priority: "medium" },
  { name: "Hill Robinson", cat: "Yacht Agents", country: "UK", web: "hillrobinson.com", email: "info@hillrobinson.com", notes: "Yacht management specialists", priority: "medium" },
  // Crew Agencies
  { name: "Wilsonhalligan", cat: "Crew Agencies", country: "France", loc: "Antibes", web: "wilsonhalligan.com", email: "crew@wilsonhalligan.com", ig: "@wilsonhalligan", notes: "Top superyacht crew agency", priority: "high" },
  { name: "Crew4Yachts", cat: "Crew Agencies", country: "UK", web: "crew4yachts.com", email: "info@crew4yachts.com", ig: "@crew4yachts", notes: "Yacht crew recruitment platform", priority: "high" },
  { name: "Quay Crew", cat: "Crew Agencies", country: "UK", loc: "Antibes", web: "quaycrew.com", email: "info@quaycrew.com", notes: "Crew recruitment", priority: "high" },
  { name: "YachtNeeds", cat: "Crew Agencies", country: "Global", web: "yachtneeds.com", email: "info@yachtneeds.com", ig: "@yachtneeds", notes: "Yacht services marketplace & crew", priority: "high" },
  // Marine Insurance
  { name: "Pantaenius", cat: "Marine Insurance", country: "Germany", web: "pantaenius.com", email: "info@pantaenius.com", notes: "Major yacht insurance provider", priority: "high" },
  // Electronics & Navigation
  { name: "Raymarine", cat: "Electronics & Navigation", country: "UK", web: "raymarine.com", email: "info@raymarine.com", notes: "Radar, chartplotters, autopilots", priority: "high" },
  { name: "Garmin Marine", cat: "Electronics & Navigation", country: "USA", web: "garmin.com/marine", email: "marine@garmin.com", notes: "Chartplotters, fishfinders, radar", priority: "high" },
  { name: "Furuno", cat: "Electronics & Navigation", country: "Japan", web: "furuno.com", email: "info@furuno.com", notes: "Radar, sonar, GMDSS", priority: "high" },
  // Propulsion & Engines
  { name: "Caterpillar Marine", cat: "Propulsion & Engines", country: "USA", web: "caterpillar.com/marine", email: "marine@cat.com", notes: "Marine diesel engines", priority: "high" },
  { name: "MTU (Rolls-Royce)", cat: "Propulsion & Engines", country: "Germany", web: "mtu-solutions.com", email: "info@mtu-online.com", notes: "Premium yacht diesel engines", priority: "high" },
  { name: "Volvo Penta", cat: "Propulsion & Engines", country: "Sweden", web: "volvopenta.com", email: "info@volvopenta.com", notes: "IPS drives, marine diesel", priority: "high" },
  // Yacht Marinas
  { name: "Port Vauban (Antibes)", cat: "Yacht Marinas", country: "France", loc: "Antibes", web: "port-vauban.net", email: "info@port-vauban.net", notes: "Largest marina in Europe", priority: "high" },
  { name: "Port Hercules (Monaco)", cat: "Yacht Marinas", country: "Monaco", loc: "Monaco", web: "ports-monaco.com", email: "info@ports-monaco.com", notes: "Monaco's main harbour", priority: "high" },
  { name: "Porto Montenegro", cat: "Yacht Marinas", country: "Montenegro", loc: "Tivat", web: "portomontenegro.com", email: "info@portomontenegro.com", notes: "Superyacht homeport", priority: "high" },
  { name: "One Ocean Port Vell (BCN)", cat: "Yacht Marinas", country: "Spain", loc: "Barcelona", web: "oneoceanportvell.com", email: "info@oneoceanportvell.com", notes: "Barcelona superyacht marina", priority: "high" },
  { name: "Falmouth Harbour (Antigua)", cat: "Yacht Marinas", country: "Antigua", loc: "English Harbour", web: "falmouthharbourmarina.com", email: "info@falmouthharbourmarina.com", notes: "Historic superyacht marina", priority: "high" },
  // Shipyards & Refit
  { name: "Lürssen Werft", cat: "Shipyards & Refit", country: "Germany", loc: "Bremen", web: "lurssen.com", email: "info@lurssen.com", notes: "Largest superyacht builder", priority: "high" },
  { name: "Benetti", cat: "Shipyards & Refit", country: "Italy", loc: "Viareggio", web: "benettiyachts.it", email: "info@benettiyachts.it", notes: "Italian superyacht builder", priority: "high" },
  { name: "Feadship", cat: "Shipyards & Refit", country: "Netherlands", loc: "Aalsmeer", web: "feadship.nl", email: "info@feadship.nl", notes: "Dutch custom superyacht builder", priority: "high" },
  { name: "Heesen Yachts", cat: "Shipyards & Refit", country: "Netherlands", loc: "Oss", web: "heesenyachts.com", email: "info@heesenyachts.com", notes: "Fast displacement yachts", priority: "high" },
  { name: "Sanlorenzo", cat: "Shipyards & Refit", country: "Italy", loc: "La Spezia", web: "sanlorenzoyacht.com", email: "info@sanlorenzoyacht.com", notes: "Italian semi-custom yachts", priority: "high" },
  { name: "Sunseeker", cat: "Shipyards & Refit", country: "UK", loc: "Poole", web: "sunseeker.com", email: "info@sunseeker.com", notes: "British motor yacht builder", priority: "high" },
  { name: "MB92 (Barcelona Refit)", cat: "Shipyards & Refit", country: "Spain", loc: "Barcelona", web: "mb92.com", email: "info@mb92.com", notes: "Largest superyacht refit yard in EU", priority: "high" },
  { name: "Compositeworks (Antibes)", cat: "Shipyards & Refit", country: "France", loc: "Antibes", web: "compositeworks.com", email: "info@compositeworks.com", notes: "Superyacht refit & repair", priority: "high" },
  // Wine & Spirits
  { name: "Berry Bros. & Rudd", cat: "Wine & Spirits", country: "UK", loc: "London", web: "bbr.com", email: "orders@bbr.com", notes: "Oldest wine merchant, est. 1698", priority: "high" },
  { name: "Onshore Cellars", cat: "Wine & Spirits", country: "South Africa", loc: "Cape Town", web: "onshorecellars.com", email: "hello@onshorecellars.com", notes: "SA fine wine & yacht provisioning", priority: "high" },
  { name: "Hedonism Wines", cat: "Wine & Spirits", country: "UK", loc: "London", web: "hedonism.co.uk", email: "info@hedonism.co.uk", notes: "Luxury wine & spirits boutique", priority: "medium" },
  // Tenders & Water Toys
  { name: "Williams Jet Tenders", cat: "Tenders & Water Toys", country: "UK", web: "williamsjettenders.com", email: "info@williamsjettenders.com", notes: "Jet drive yacht tenders", priority: "high" },
  { name: "SeaBob", cat: "Tenders & Water Toys", country: "Germany", web: "seabob.com", email: "info@seabob.com", notes: "Electric water scooter", priority: "high" },
  { name: "FunAir", cat: "Tenders & Water Toys", country: "USA", web: "funair.com", email: "info@funair.com", notes: "Inflatable water toys for superyachts", priority: "high" },
  // Shipping & Logistics
  { name: "Peters & May", cat: "Shipping & Logistics", country: "UK", web: "petersandmay.com", email: "info@petersandmay.com", notes: "Yacht transport specialists", priority: "high" },
  { name: "Sevenstar Yacht Transport", cat: "Shipping & Logistics", country: "Netherlands", web: "sevenstaryachttransport.com", email: "info@sevenstaryachttransport.com", notes: "Semi-submersible yacht transport", priority: "high" },
  { name: "Onshore Deliver", cat: "Shipping & Logistics", country: "Global", web: "onshoredelivery.com", email: "info@onshoredelivery.com", notes: "Our platform - yacht delivery logistics", priority: "high" },
  // Communication & Satcom
  { name: "Starlink Maritime", cat: "Communication & Satcom", country: "USA", web: "starlink.com/maritime", email: "maritime@starlink.com", notes: "WiFi satellite internet for yachts", priority: "high" },
  { name: "Inmarsat", cat: "Communication & Satcom", country: "UK", web: "inmarsat.com", email: "maritime@inmarsat.com", notes: "Maritime broadband satellite", priority: "high" },
  { name: "OmniAccess", cat: "Communication & Satcom", country: "Spain", loc: "Palma de Mallorca", web: "omniaccess.com", email: "info@omniaccess.com", notes: "Superyacht VSAT & IT solutions", priority: "high" },
  // Associations & Events
  { name: "Monaco Yacht Show", cat: "Associations & Events", country: "Monaco", web: "monacoyachtshow.com", email: "info@monacoyachtshow.com", notes: "Premier superyacht event", priority: "high" },
  { name: "Fort Lauderdale Boat Show", cat: "Associations & Events", country: "USA", loc: "Fort Lauderdale", web: "flibs.com", email: "info@flibs.com", notes: "Largest boat show in the world", priority: "high" },
  { name: "Cannes Yachting Festival", cat: "Associations & Events", country: "France", loc: "Cannes", web: "cannesyachtingfestival.com", email: "info@cannesyachtingfestival.com", notes: "Annual European boat show", priority: "high" },
  { name: "METS Trade (Amsterdam)", cat: "Associations & Events", country: "Netherlands", loc: "Amsterdam", web: "metstrade.com", email: "mets@rai.nl", notes: "B2B marine equipment trade show", priority: "high" },
  // Classification 
  { name: "Lloyd's Register", cat: "Classification Societies", country: "UK", web: "lr.org", email: "info@lr.org", notes: "Major maritime classification society", priority: "high" },
  { name: "Bureau Veritas", cat: "Classification Societies", country: "France", web: "bureauveritas.com", email: "marine@bureauveritas.com", notes: "Classification & certification", priority: "high" },
  // Safety
  { name: "Viking Life-Saving Equipment", cat: "Safety Equipment", country: "Denmark", web: "viking-life.com", email: "info@viking-life.com", notes: "Life rafts, fire safety, PPE", priority: "high" },
  // Deck Equipment
  { name: "Lewmar", cat: "Deck Equipment", country: "UK", web: "lewmar.com", email: "info@lewmar.com", notes: "Winches, hatches, hardware", priority: "high" },
  { name: "Harken", cat: "Deck Equipment", country: "USA", web: "harken.com", email: "info@harken.com", notes: "Sailing hardware, winches, blocks", priority: "high" },
  // Paint
  { name: "International Paint / AkzoNobel", cat: "Paint & Coatings", country: "Global", web: "international-marine.com", email: "yachtsupport@akzonobel.com", notes: "Leading antifoul & yacht paint brand", priority: "high" },
  { name: "Awlgrip", cat: "Paint & Coatings", country: "Global", web: "awlgrip.com", email: "info@awlgrip.com", notes: "Premium topside yacht finishes", priority: "high" },
  // Sails & Rigging
  { name: "North Sails", cat: "Rigging & Sails", country: "USA", web: "northsails.com", email: "info@northsails.com", notes: "Sailing sails & gear", priority: "high" },
  { name: "Southern Spars", cat: "Rigging & Sails", country: "New Zealand", web: "southernspars.com", email: "info@southernspars.com", notes: "Carbon fibre masts & rigging", priority: "high" },
  // HVAC
  { name: "Heinen & Hopman", cat: "Air Conditioning & HVAC", country: "Netherlands", web: "heinenhopman.com", email: "info@heinenhopman.com", notes: "Marine HVAC specialists", priority: "high" },
  { name: "Dometic Marine", cat: "Air Conditioning & HVAC", country: "Sweden", web: "dometic.com", email: "marine@dometic.com", notes: "Marine A/C, refrigeration", priority: "high" },
  // Interior
  { name: "Andrew Winch Designs", cat: "Interior & Furnishing", country: "UK", loc: "London", web: "winchdesign.com", email: "info@winchdesign.com", notes: "Yacht & private jet interiors", priority: "high" },
  // Medical
  { name: "MedAire", cat: "Medical", country: "USA", web: "medaire.com", email: "info@medaire.com", notes: "Maritime telemedical, med kits", priority: "high" },
  // Security
  { name: "Ambrey Intelligence", cat: "Security", country: "UK", web: "ambrey.com", email: "info@ambrey.com", notes: "Maritime security & intelligence", priority: "high" },
  // Concierge
  { name: "Quintessentially", cat: "Concierge & Lifestyle", country: "UK", web: "quintessentially.com", email: "yacht@quintessentially.com", notes: "Ultra-luxury concierge", priority: "high" },
  // Sustainability
  { name: "Water Revolution Foundation", cat: "Sustainability & Green", country: "Netherlands", web: "waterrevolutionfoundation.org", email: "info@waterrevolutionfoundation.org", notes: "Sustainability in superyacht industry", priority: "high" },
  // Customs & Legal
  { name: "Hill Dickinson", cat: "Customs & Legal", country: "UK", web: "hilldickinson.com", email: "marine@hilldickinson.com", notes: "Top maritime law firm", priority: "high" },
  { name: "Holman Fenwick Willan", cat: "Customs & Legal", country: "UK", web: "hfw.com", email: "info@hfw.com", notes: "Maritime & shipping law", priority: "high" },
  // Photography
  { name: "Jeff Brown (Breed Media)", cat: "Photography & Media", country: "UK", web: "breedmedia.co.uk", email: "info@breedmedia.co.uk", notes: "Top superyacht photographer", priority: "high" },
  // Helicopter
  { name: "Airbus Helicopters (ACH)", cat: "Helicopter & Aviation", country: "France", web: "airbuscorporatehelicopters.com", email: "ach@airbus.com", notes: "H130, H135 for yachts", priority: "high" },
]

async function main() {
  console.log('Seeding CRM contacts (curated suppliers)...')
  let created = 0, skipped = 0
  for (const c of DB) {
    const existing = await prisma.crmContact.findFirst({
      where: { name: c.name, category: c.cat },
    })
    if (existing) { skipped++; continue }
    await prisma.crmContact.create({
      data: {
        name: c.name,
        category: c.cat,
        country: c.country || null,
        location: c.loc || null,
        website: c.web || null,
        email: c.email || null,
        phone: c.phone || null,
        instagram: c.ig || null,
        notes: c.notes || null,
        priority: c.priority || 'medium',
        source: 'import',
      },
    })
    created++
  }
  console.log(`Done! Created: ${created}, Skipped (already exist): ${skipped}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
