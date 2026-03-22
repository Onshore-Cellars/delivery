// CRM Contact Seed Script
// Run with: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-crm.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ContactSeed {
  name: string
  cat: string
  country?: string
  loc?: string
  web?: string
  email?: string
  email2?: string
  phone?: string
  phone2?: string
  ig?: string
  notes?: string
  priority?: string
}

const DB: ContactSeed[] = [
  // ═══════════════════ PR & MARKETING ═══════════════════
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

  // ═══════════════════ PROVISIONING ═══════════════════
  { name: "Luxury Yacht Provisions", cat: "Provisioning", country: "France", loc: "Antibes", web: "luxury-yacht-provisions.com", email: "orders@luxury-yacht-provisions.com", phone: "+33 4 93 34 XX XX", notes: "Fresh provisions & gourmet, Antibes-based", priority: "high" },
  { name: "YachtProv", cat: "Provisioning", country: "Spain", loc: "Palma de Mallorca", web: "yachtprov.com", email: "info@yachtprov.com", phone: "+34 971 XX XX XX", notes: "Full yacht provisioning service, Balearics", priority: "high" },
  { name: "Burgess & Finch Provisions", cat: "Provisioning", country: "South Africa", loc: "Cape Town", web: "burgessfinch.co.za", email: "provisions@burgessfinch.co.za", notes: "SA-based yacht provisions & fresh produce", priority: "medium" },
  { name: "Peter Pan Provisioning", cat: "Provisioning", country: "France", loc: "Antibes", web: "peterpan-yachtprovisions.com", email: "info@peterpan-yachtprovisions.com", phone: "+33 4 92 91 XX XX", notes: "Well-known Antibes provisioner", priority: "high" },
  { name: "Fresh Deliver (Mallorca)", cat: "Provisioning", country: "Spain", loc: "Palma de Mallorca", web: "freshdeliver.es", email: "orders@freshdeliver.es", notes: "Organic produce for yachts", priority: "medium" },
  { name: "Gourmet Deliveries", cat: "Provisioning", country: "France", loc: "Nice", web: "gourmetdeliveries.fr", email: "hello@gourmetdeliveries.fr", notes: "Gourmet provisions French Riviera", priority: "medium" },
  { name: "Yacht Supply Company", cat: "Provisioning", country: "Greece", loc: "Athens", web: "yachtsupply.gr", email: "orders@yachtsupply.gr", notes: "Greek islands provisioning", priority: "medium" },
  { name: "Island Provisions", cat: "Provisioning", country: "Caribbean", loc: "St Maarten", web: "islandprovisions.com", email: "info@islandprovisions.com", notes: "Caribbean yacht provisions", priority: "high" },
  { name: "The Provision Store", cat: "Provisioning", country: "Italy", loc: "Genoa", web: "provisionstore.it", email: "orders@provisionstore.it", notes: "Italian gourmet provisions", priority: "medium" },
  { name: "Superyacht Provisions Monaco", cat: "Provisioning", country: "Monaco", loc: "Monaco", web: "sypmonaco.com", email: "info@sypmonaco.com", notes: "Premium provisions Monaco", priority: "high" },

  // ═══════════════════ CHANDLERY ═══════════════════
  { name: "Accastillage Diffusion", cat: "Chandlery", country: "France", loc: "Antibes", web: "accastillage-diffusion.com", email: "pro@ad-network.fr", phone: "+33 4 93 34 XX XX", notes: "Marine hardware & fittings, large EU chain", priority: "high" },
  { name: "Uship (France)", cat: "Chandlery", country: "France", loc: "Multiple", web: "uship.fr", email: "contact@uship.fr", notes: "Chandlery chain across France", priority: "medium" },
  { name: "Bricomar Marine (SA)", cat: "Chandlery", country: "South Africa", loc: "Cape Town", web: "bricomar.co.za", email: "sales@bricomar.co.za", notes: "SA marine chandlery", priority: "medium" },
  { name: "AllStar Marine (SA)", cat: "Chandlery", country: "South Africa", loc: "Cape Town", web: "allstarmarine.co.za", email: "sales@allstarmarine.co.za", notes: "Yacht chandlery & equipment SA", priority: "medium" },
  { name: "Budget Marine (Caribbean)", cat: "Chandlery", country: "Caribbean", loc: "Multiple", web: "budgetmarine.com", email: "info@budgetmarine.com", notes: "Largest chandlery chain in Caribbean", priority: "high" },
  { name: "Force 4 Chandlery (UK)", cat: "Chandlery", country: "UK", loc: "Multiple", web: "force4.co.uk", email: "enquiries@force4.co.uk", notes: "UK chandlery chain", priority: "medium" },
  { name: "SW Marine Group", cat: "Chandlery", country: "France", loc: "Antibes", web: "swmarinegroup.com", email: "sales@swmarinegroup.com", notes: "Superyacht chandlery, Antibes", priority: "high" },
  { name: "MMK Bookshop & Charts (Marine)", cat: "Chandlery", country: "UK", loc: "Southampton", web: "bookharbour.com", email: "sales@bookharbour.com", notes: "Maritime charts & publications", priority: "low" },
  { name: "NauticExpo (B2B)", cat: "Chandlery", country: "Global", web: "nauticexpo.com", email: "info@nauticexpo.com", notes: "Online B2B marine marketplace", priority: "medium" },
  { name: "Marine Store (Greece)", cat: "Chandlery", country: "Greece", loc: "Piraeus", web: "marinestore.gr", email: "info@marinestore.gr", notes: "Greek marine supplies", priority: "medium" },
  { name: "Mediterranean Yacht Chandlers", cat: "Chandlery", country: "Spain", loc: "Barcelona", web: "medyachtchandlers.com", email: "info@medyachtchandlers.com", notes: "Barcelona yacht chandlery", priority: "medium" },

  // ═══════════════════ YACHT AGENTS ═══════════════════
  { name: "Fraser Yachts", cat: "Yacht Agents", country: "Monaco", web: "fraseryachts.com", email: "info@fraseryachts.com", ig: "@fraseryachts", notes: "Charter, Sales, Management", priority: "high" },
  { name: "Burgess Yachts", cat: "Yacht Agents", country: "Monaco", web: "burgessyachts.com", email: "info@burgessyachts.com", ig: "@burgessyachts", notes: "Full-service yacht brokerage", priority: "high" },
  { name: "Camper & Nicholsons", cat: "Yacht Agents", country: "Monaco", web: "camperandnicholsons.com", email: "info@camperandnicholsons.com", ig: "@camperandnicholsons", notes: "Oldest yacht brokerage, est. 1782", priority: "high" },
  { name: "Northrop & Johnson (N&J)", cat: "Yacht Agents", country: "USA", loc: "Fort Lauderdale", web: "northropandjohnson.com", email: "info@njcharters.com", ig: "@northropandjohnson", notes: "Major US broker, now part of MarineMax", priority: "high" },
  { name: "Y.CO", cat: "Yacht Agents", country: "Monaco", web: "y.co", email: "info@y.co", ig: "@abordy.co", notes: "Brokerage & management", priority: "high" },
  { name: "Cecil Wright & Partners", cat: "Yacht Agents", country: "France", loc: "Antibes", web: "cecilwright.com", email: "charter@cecilwright.com", notes: "Charter & brokerage", priority: "medium" },
  { name: "Edmiston & Company", cat: "Yacht Agents", country: "Monaco", web: "edmiston.com", email: "info@edmiston.com", ig: "@edmiston_company", notes: "Ultra-luxury yacht broker", priority: "high" },
  { name: "IYC (International Yacht Company)", cat: "Yacht Agents", country: "USA", loc: "Fort Lauderdale", web: "iyc.com", email: "info@iyc.com", ig: "@iyc_yachts", notes: "Sales, charter, management", priority: "high" },
  { name: "Merle Wood & Associates", cat: "Yacht Agents", country: "USA", loc: "Fort Lauderdale", web: "merlewoodandassociates.com", email: "info@merlewoodandassociates.com", notes: "Premier U.S. brokerage", priority: "medium" },
  { name: "Ocean Independence", cat: "Yacht Agents", country: "Switzerland", web: "oceanindependence.com", email: "info@oceanindependence.com", ig: "@oceanindependence", notes: "Charter, Sales, New Build", priority: "medium" },
  { name: "TWW Yachts (The Whitehaven)", cat: "Yacht Agents", country: "Australia", loc: "Sydney", web: "twwyachts.com.au", email: "info@twwyachts.com.au", notes: "Aus/NZ yacht brokerage", priority: "low" },
  { name: "Bluewater Yachting", cat: "Yacht Agents", country: "France", loc: "Antibes", web: "bluewateryachting.com", email: "info@bluewateryachting.com", ig: "@bluewateryachts", notes: "Charter & crew agency", priority: "medium" },
  { name: "Hill Robinson (Mgmt)", cat: "Yacht Agents", country: "UK", web: "hillrobinson.com", email: "info@hillrobinson.com", notes: "Yacht management specialists", priority: "medium" },
  { name: "West Nautical", cat: "Yacht Agents", country: "UK", loc: "Newcastle", web: "westnautical.com", email: "info@westnautical.com", ig: "@westnautical", notes: "Brokerage, charter, management", priority: "medium" },
  { name: "Yachtzoo", cat: "Yacht Agents", country: "Monaco", web: "yachtzoo.com", email: "info@yachtzoo.com", ig: "@yachtzoo", notes: "Charter, Sales, Management", priority: "medium" },

  // ═══════════════════ CREW AGENCIES ═══════════════════
  { name: "Wilsonhalligan", cat: "Crew Agencies", country: "France", loc: "Antibes", web: "wilsonhalligan.com", email: "crew@wilsonhalligan.com", ig: "@wilsonhalligan", notes: "Top superyacht crew agency", priority: "high" },
  { name: "Crew4Yachts", cat: "Crew Agencies", country: "UK", web: "crew4yachts.com", email: "info@crew4yachts.com", ig: "@crew4yachts", notes: "Yacht crew recruitment platform", priority: "high" },
  { name: "YachtCrewLink", cat: "Crew Agencies", country: "France", loc: "Antibes", web: "yachtcrewlink.com", email: "info@yachtcrewlink.com", notes: "Crew placement, Antibes", priority: "medium" },
  { name: "DYT (Dockwise Yacht Transport)", cat: "Crew Agencies", country: "USA", loc: "Fort Lauderdale", web: "yacht-transport.com", email: "dyt@yacht-transport.com", notes: "Yacht transport (ship-lift)", priority: "high" },
  { name: "The Crew Academy (SA)", cat: "Crew Agencies", country: "South Africa", loc: "Cape Town", web: "thecrewacademy.com", email: "info@thecrewacademy.com", notes: "Crew training & placement SA", priority: "medium" },
  { name: "Luxury Yacht Group", cat: "Crew Agencies", country: "USA", loc: "Fort Lauderdale", web: "luxyachts.com", email: "crew@luxyachts.com", notes: "Crew placement + charter", priority: "medium" },
  { name: "Quay Crew", cat: "Crew Agencies", country: "UK", loc: "Antibes", web: "quaycrew.com", email: "info@quaycrew.com", notes: "Crew recruitment, offices in Antibes & UK", priority: "high" },
  { name: "Viking Crew (SA)", cat: "Crew Agencies", country: "South Africa", loc: "Cape Town", web: "vikingcrew.com", email: "info@vikingcrew.com", ig: "@vikingcrew_sa", notes: "SA crew recruitment", priority: "medium" },
  { name: "Faststream Recruitment (Marine)", cat: "Crew Agencies", country: "UK", web: "faststream.com", email: "info@faststream.com", notes: "Maritime & shipping recruitment", priority: "low" },
  { name: "Crew & Concierge", cat: "Crew Agencies", country: "France", loc: "Cannes", web: "crewandconcierge.com", email: "contact@crewandconcierge.com", notes: "Crew placement + concierge", priority: "medium" },
  { name: "YachtNeeds", cat: "Crew Agencies", country: "Global", web: "yachtneeds.com", email: "info@yachtneeds.com", ig: "@yachtneeds", notes: "Yacht services marketplace & crew", priority: "high" },

  // ═══════════════════ MARINE INSURANCE ═══════════════════
  { name: "Pantaenius", cat: "Marine Insurance", country: "Germany", web: "pantaenius.com", email: "info@pantaenius.com", notes: "Major yacht insurance provider", priority: "high" },
  { name: "West of England P&I Club", cat: "Marine Insurance", country: "UK", web: "westpandi.com", email: "info@westpandi.com", notes: "P&I Club, commercial & yacht", priority: "medium" },
  { name: "MS Amlin (Lloyd's)", cat: "Marine Insurance", country: "UK", web: "msamlin.com", email: "marine@msamlin.com", notes: "Lloyd's marine specialist", priority: "medium" },
  { name: "Oyster Marine Insurance", cat: "Marine Insurance", country: "Spain", loc: "Palma de Mallorca", web: "oysteryachtinsurance.com", email: "info@oysteryachtinsurance.com", notes: "Specialist yacht insurance", priority: "medium" },
  { name: "Willis Towers Watson (Marine)", cat: "Marine Insurance", country: "UK", web: "wtwco.com", email: "marine@willistowerswatson.com", notes: "Global insurance broker, marine arm", priority: "medium" },
  { name: "Aon (Yacht Division)", cat: "Marine Insurance", country: "UK", web: "aon.com", email: "marine@aon.com", notes: "Global broker, yacht insurance div", priority: "medium" },
  { name: "Integral Marine Insurance", cat: "Marine Insurance", country: "UK", web: "integralmarineinsurance.com", email: "info@integralmarineinsurance.com", notes: "Boutique yacht insurer", priority: "medium" },
  { name: "International Yacht Insurance", cat: "Marine Insurance", country: "USA", web: "internationalyachtinsurance.com", email: "info@internationalyachtinsurance.com", notes: "US yacht insurance specialist", priority: "medium" },

  // ═══════════════════ PAINT & COATINGS ═══════════════════
  { name: "International Paint / AkzoNobel", cat: "Paint & Coatings", country: "Global", web: "international-marine.com", email: "yachtsupport@akzonobel.com", notes: "Leading antifoul & yacht paint brand", priority: "high" },
  { name: "Jotun (Marine Coatings)", cat: "Paint & Coatings", country: "Norway", web: "jotun.com", email: "marine@jotun.com", notes: "Antifoul, topside, hull coatings", priority: "high" },
  { name: "Awlgrip / AkzoNobel", cat: "Paint & Coatings", country: "Global", web: "awlgrip.com", email: "info@awlgrip.com", notes: "Premium topside yacht finishes", priority: "high" },
  { name: "Hempel (Marine)", cat: "Paint & Coatings", country: "Denmark", web: "hempel.com", email: "marine@hempel.com", notes: "Marine coatings & antifouling", priority: "medium" },
  { name: "Sea Hawk Paints", cat: "Paint & Coatings", country: "USA", web: "seahawkpaints.com", email: "info@seahawkpaints.com", notes: "US-based marine paint", priority: "low" },
  { name: "Boero Yacht Coatings", cat: "Paint & Coatings", country: "Italy", web: "boeroyachtcoatings.com", email: "info@boeroyachtcoatings.com", notes: "Italian yacht coatings", priority: "medium" },

  // ═══════════════════ ELECTRONICS & NAVIGATION ═══════════════════
  { name: "Raymarine (FLIR)", cat: "Electronics & Navigation", country: "UK", web: "raymarine.com", email: "info@raymarine.com", notes: "Radar, chartplotters, autopilots", priority: "high" },
  { name: "Garmin Marine", cat: "Electronics & Navigation", country: "USA", web: "garmin.com/marine", email: "marine@garmin.com", notes: "Chartplotters, fishfinders, radar", priority: "high" },
  { name: "Furuno", cat: "Electronics & Navigation", country: "Japan", web: "furuno.com", email: "info@furuno.com", notes: "Radar, sonar, GMDSS", priority: "high" },
  { name: "Simrad (Navico)", cat: "Electronics & Navigation", country: "Norway", web: "simrad-yachting.com", email: "info@simrad-yachting.com", notes: "Autopilots, multifunction displays", priority: "high" },
  { name: "B&G (Navico)", cat: "Electronics & Navigation", country: "UK", web: "bandg.com", email: "info@bandg.com", notes: "Sailing instruments & navigation", priority: "medium" },
  { name: "KVH Industries", cat: "Electronics & Navigation", country: "USA", web: "kvh.com", email: "info@kvh.com", notes: "VSAT, satellite TV, compass", priority: "medium" },
  { name: "Intellian Technologies", cat: "Electronics & Navigation", country: "South Korea", web: "intelliantech.com", email: "info@intelliantech.com", notes: "VSAT, satellite antennas", priority: "medium" },
  { name: "Glomex Marine Antennas", cat: "Electronics & Navigation", country: "Italy", web: "glomex.it", email: "info@glomex.it", notes: "TV, radio, satellite antennas", priority: "low" },
  { name: "AIS (Vesper Marine)", cat: "Electronics & Navigation", country: "New Zealand", web: "vespermarine.com", email: "info@vespermarine.com", notes: "AIS transponders & smartAIS", priority: "medium" },

  // ═══════════════════ PROPULSION & ENGINES ═══════════════════
  { name: "Caterpillar Marine (CAT)", cat: "Propulsion & Engines", country: "USA", web: "caterpillar.com/marine", email: "marine@cat.com", notes: "Marine diesel engines", priority: "high" },
  { name: "MTU (Rolls-Royce PS)", cat: "Propulsion & Engines", country: "Germany", web: "mtu-solutions.com", email: "info@mtu-online.com", notes: "Premium yacht diesel engines", priority: "high" },
  { name: "MAN Engines (Marine)", cat: "Propulsion & Engines", country: "Germany", web: "man-es.com", email: "info@man-es.com", notes: "High-speed marine diesel", priority: "high" },
  { name: "Volvo Penta", cat: "Propulsion & Engines", country: "Sweden", web: "volvopenta.com", email: "info@volvopenta.com", notes: "IPS drives, marine diesel", priority: "high" },
  { name: "Cummins Marine", cat: "Propulsion & Engines", country: "USA", web: "cummins.com/marine", email: "marine@cummins.com", notes: "Marine engines & generators", priority: "high" },
  { name: "Yanmar Marine", cat: "Propulsion & Engines", country: "Japan", web: "yanmar.com/marine", email: "marine@yanmar.com", notes: "Sailing & motor yacht engines", priority: "medium" },
  { name: "ZF Marine", cat: "Propulsion & Engines", country: "Germany", web: "zf.com/marine", email: "info@zf.com", notes: "Marine gearboxes & transmissions", priority: "medium" },
  { name: "Twin Disc (Marine)", cat: "Propulsion & Engines", country: "USA", web: "twindisc.com", email: "info@twindisc.com", notes: "Marine transmissions", priority: "low" },
  { name: "Torqeedo (Electric)", cat: "Propulsion & Engines", country: "Germany", web: "torqeedo.com", email: "info@torqeedo.com", notes: "Electric marine propulsion", priority: "medium" },

  // ═══════════════════ DECK EQUIPMENT ═══════════════════
  { name: "Lewmar", cat: "Deck Equipment", country: "UK", web: "lewmar.com", email: "info@lewmar.com", notes: "Winches, hatches, hardware", priority: "high" },
  { name: "Harken", cat: "Deck Equipment", country: "USA", web: "harken.com", email: "info@harken.com", notes: "Sailing hardware, winches, blocks", priority: "high" },
  { name: "Antal", cat: "Deck Equipment", country: "Italy", web: "antal.it", email: "info@antal.it", notes: "Blocks, clutches, tracks", priority: "medium" },
  { name: "Maxwell Marine", cat: "Deck Equipment", country: "New Zealand", web: "maxwellmarine.com", email: "info@maxwellmarine.com", notes: "Windlasses, capstans", priority: "medium" },
  { name: "Muir Windlasses", cat: "Deck Equipment", country: "Australia", web: "muir.com.au", email: "info@muir.com.au", notes: "Anchor windlasses", priority: "medium" },
  { name: "Ronstan", cat: "Deck Equipment", country: "Australia", web: "ronstan.com", email: "info@ronstan.com", notes: "Sailing & rigging hardware", priority: "medium" },
  { name: "Seldén Mast", cat: "Deck Equipment", country: "Sweden", web: "sfrn.se", email: "info@sfrn.se", notes: "Masts, booms, rigging", priority: "medium" },
  { name: "Karver Systems", cat: "Deck Equipment", country: "France", web: "karfrn-systems.com", email: "info@karfrn-systems.com", notes: "Furling systems for superyachts", priority: "medium" },

  // ═══════════════════ YACHT MARINAS ═══════════════════
  { name: "Port Vauban (Antibes)", cat: "Yacht Marinas", country: "France", loc: "Antibes", web: "port-vauban.net", email: "info@port-vauban.net", notes: "Largest marina in Europe", priority: "high" },
  { name: "Marina Port La Royale (St Martin)", cat: "Yacht Marinas", country: "Caribbean", loc: "St Martin", web: "portlaroyale.com", email: "info@portlaroyale.com", notes: "Popular Caribbean megayacht marina", priority: "high" },
  { name: "Yacht Haven Grande (St Thomas)", cat: "Yacht Marinas", country: "USVI", loc: "St Thomas", web: "yachthavengranvi.com", email: "info@yachthavengranvi.com", notes: "Premier USVI superyacht marina", priority: "high" },
  { name: "Christophe Harbour (St Kitts)", cat: "Yacht Marinas", country: "St Kitts", loc: "St Kitts", web: "christopheharbour.com", email: "marina@christopheharbour.com", notes: "Luxury marina & resort", priority: "medium" },
  { name: "Marina di Portofino", cat: "Yacht Marinas", country: "Italy", loc: "Portofino", web: "marinadiportofino.it", email: "info@marinadiportofino.it", notes: "Famous Italian yacht marina", priority: "medium" },
  { name: "Port Hercules (Monaco)", cat: "Yacht Marinas", country: "Monaco", loc: "Monaco", web: "ports-monaco.com", email: "info@ports-monaco.com", notes: "Monaco's main harbour", priority: "high" },
  { name: "Island Water World Marina (SXM)", cat: "Yacht Marinas", country: "St Maarten", loc: "St Maarten", web: "islandwaterworld.com", email: "info@islandwaterworld.com", notes: "Simpson Bay marina & chandlery", priority: "medium" },
  { name: "Falmouth Harbour (Antigua)", cat: "Yacht Marinas", country: "Antigua", loc: "English Harbour", web: "falmouthharbourmarina.com", email: "info@falmouthharbourmarina.com", notes: "Historic superyacht marina", priority: "high" },
  { name: "Marina Ibiza", cat: "Yacht Marinas", country: "Spain", loc: "Ibiza", web: "marinaibiza.com", email: "info@marinaibiza.com", notes: "Superyacht marina in Ibiza", priority: "medium" },
  { name: "Porto Montenegro", cat: "Yacht Marinas", country: "Montenegro", loc: "Tivat", web: "portomontenegro.com", email: "info@portomontenegro.com", ig: "@portomontenegro", notes: "Superyacht homeport, marina village", priority: "high" },
  { name: "V&A Waterfront Marina (CT)", cat: "Yacht Marinas", country: "South Africa", loc: "Cape Town", web: "waterfront.co.za", email: "marina@waterfront.co.za", notes: "Cape Town's premier yacht marina", priority: "high" },
  { name: "Royal Cape Yacht Club", cat: "Yacht Marinas", country: "South Africa", loc: "Cape Town", web: "rcyc.co.za", email: "info@rcyc.co.za", notes: "Oldest yacht club in SA", priority: "medium" },
  { name: "Lürssen Refit (Barcelona)", cat: "Yacht Marinas", country: "Spain", loc: "Barcelona", web: "lurssen.com", email: "info@lurssen.com", notes: "Refit yard + marina berths", priority: "medium" },
  { name: "One Ocean Port Vell (BCN)", cat: "Yacht Marinas", country: "Spain", loc: "Barcelona", web: "oneoceanportvell.com", email: "info@oneoceanportvell.com", notes: "Barcelona superyacht marina", priority: "high" },
  { name: "IGYY (Island Global Yachting)", cat: "Yacht Marinas", country: "Global", web: "igy-marinas.com", email: "info@igymm.com", notes: "Network of luxury marinas", priority: "high" },

  // ═══════════════════ SHIPYARDS & REFIT ═══════════════════
  { name: "Lürssen Werft", cat: "Shipyards & Refit", country: "Germany", loc: "Bremen", web: "lurssen.com", email: "info@lurssen.com", notes: "Largest superyacht builder", priority: "high" },
  { name: "Benetti (Azimut-Benetti)", cat: "Shipyards & Refit", country: "Italy", loc: "Viareggio", web: "benettiyachts.it", email: "info@benettiyachts.it", ig: "@benettiyachts", notes: "Italian superyacht builder", priority: "high" },
  { name: "Feadship (Royal Van Lent)", cat: "Shipyards & Refit", country: "Netherlands", loc: "Aalsmeer", web: "feadship.nl", email: "info@feadship.nl", ig: "@feaboredship", notes: "Dutch custom superyacht builder", priority: "high" },
  { name: "Oceanco", cat: "Shipyards & Refit", country: "Netherlands", loc: "Alblasserdam", web: "oceanco.nl", email: "info@oceanco.nl", ig: "@oceancoyachts", notes: "Large custom superyachts", priority: "high" },
  { name: "Amels (Damen Yachting)", cat: "Shipyards & Refit", country: "Netherlands", loc: "Vlissingen", web: "amfrn.nl", email: "info@amfrn.nl", notes: "Limited editions superyachts", priority: "high" },
  { name: "Heesen Yachts", cat: "Shipyards & Refit", country: "Netherlands", loc: "Oss", web: "hefrenyachts.com", email: "info@hefrenyachts.com", ig: "@hefrenyachts", notes: "Fast displacement & steel/aluminium", priority: "high" },
  { name: "Sanlorenzo", cat: "Shipyards & Refit", country: "Italy", loc: "La Spezia", web: "sanlorenzoyacht.com", email: "info@sanlorenzoyacht.com", ig: "@sanlorenzoyacht", notes: "Italian semi-custom yachts", priority: "high" },
  { name: "Sunseeker (UK)", cat: "Shipyards & Refit", country: "UK", loc: "Poole", web: "sunseeker.com", email: "info@sunseeker.com", ig: "@sunseeker_int", notes: "British motor yacht builder", priority: "high" },
  { name: "Princess Yachts (UK)", cat: "Shipyards & Refit", country: "UK", loc: "Plymouth", web: "princessyachts.com", email: "info@princessyachts.com", ig: "@princessyachts", notes: "British luxury motor yachts", priority: "high" },
  { name: "Baglietto", cat: "Shipyards & Refit", country: "Italy", loc: "La Spezia", web: "baglietto.com", email: "info@baglietto.com", notes: "Italian yacht builder since 1854", priority: "medium" },
  { name: "CRN (Ferretti Group)", cat: "Shipyards & Refit", country: "Italy", loc: "Ancona", web: "crfrn.it", email: "info@crfrn.it", notes: "Custom superyachts, Ferretti Group", priority: "medium" },
  { name: "Pendennis Shipyard", cat: "Shipyards & Refit", country: "UK", loc: "Falmouth", web: "pendennis.com", email: "info@pendennis.com", notes: "Custom build & refit, UK", priority: "medium" },
  { name: "MB92 (Barcelona Refit)", cat: "Shipyards & Refit", country: "Spain", loc: "Barcelona", web: "mb92.com", email: "info@mb92.com", notes: "Largest superyacht refit yard in EU", priority: "high" },
  { name: "Compositeworks (Antibes)", cat: "Shipyards & Refit", country: "France", loc: "Antibes", web: "compositeworks.com", email: "info@compositeworks.com", notes: "Superyacht refit & repair", priority: "high" },
  { name: "STP Shipyard (Palma)", cat: "Shipyards & Refit", country: "Spain", loc: "Palma de Mallorca", web: "stfrn-palma.com", email: "info@stfrn-palma.com", notes: "Major superyacht refit in Mallorca", priority: "high" },
  { name: "Astilleros de Mallorca", cat: "Shipyards & Refit", country: "Spain", loc: "Palma de Mallorca", web: "astillerosdemallorca.com", email: "info@astillerosdemallorca.com", notes: "Historic Mallorcan shipyard", priority: "medium" },
  { name: "Southern Wind Shipyard (SA)", cat: "Shipyards & Refit", country: "South Africa", loc: "Cape Town", web: "southernwindshipyard.com", email: "info@southernwindshipyard.com", notes: "SA sailing superyacht builder", priority: "medium" },

  // ═══════════════════ LUXURY WINE & SPIRITS ═══════════════════
  { name: "Wally's Wine & Spirits", cat: "Luxury Wine & Spirits", country: "USA", loc: "Los Angeles", web: "wallywine.com", email: "orders@wallywine.com", notes: "Elite wines & spirits, US market", priority: "high" },
  { name: "Berry Bros. & Rudd", cat: "Luxury Wine & Spirits", country: "UK", loc: "London", web: "bbr.com", email: "orders@bbr.com", notes: "Oldest wine & spirits merchant, est. 1698", priority: "high" },
  { name: "Caves Augé (Paris)", cat: "Luxury Wine & Spirits", country: "France", loc: "Paris", web: "cavesauge.com", email: "info@cavesauge.com", notes: "Oldest wine shop in Paris", priority: "medium" },
  { name: "La Part des Anges (Nice)", cat: "Luxury Wine & Spirits", country: "France", loc: "Nice", web: "lapartdesanges.com", email: "info@lapartdesanges.com", notes: "Fine wines, French Riviera", priority: "medium" },
  { name: "Justerini & Brooks (J&B)", cat: "Luxury Wine & Spirits", country: "UK", loc: "London", web: "justerinis.com", email: "orders@justerinis.com", notes: "Fine wine & spirits merchant", priority: "medium" },
  { name: "Hedonism Wines", cat: "Luxury Wine & Spirits", country: "UK", loc: "London", web: "hedonism.co.uk", email: "info@hedonism.co.uk", notes: "Luxury wine & spirits boutique", priority: "medium" },
  { name: "Onshore Cellars", cat: "Luxury Wine & Spirits", country: "South Africa", loc: "Cape Town", web: "onshorecellars.com", email: "hello@onshorecellars.com", notes: "SA fine wine & yacht provisioning", priority: "high" },
  { name: "Wine Warehouse (SA)", cat: "Luxury Wine & Spirits", country: "South Africa", loc: "Cape Town", web: "winewarehouse.co.za", email: "sales@winewarehouse.co.za", notes: "Bulk SA wine wholesaler", priority: "medium" },

  // ═══════════════════ LAUNDRY & LINEN ═══════════════════
  { name: "Superyacht Laundry (Antibes)", cat: "Laundry & Linen", country: "France", loc: "Antibes", web: "superyachtlaundry.com", email: "info@superyachtlaundry.com", notes: "Specialist yacht laundry", priority: "high" },
  { name: "Yachting Linen (Palma)", cat: "Laundry & Linen", country: "Spain", loc: "Palma de Mallorca", web: "yachtinglinen.com", email: "info@yachtinglinen.com", notes: "Custom yacht linens & towels", priority: "medium" },
  { name: "Riviera Yacht Laundry", cat: "Laundry & Linen", country: "France", loc: "Nice", web: "rivierayachtlaundry.com", email: "info@rivierayachtlaundry.com", notes: "Crew uniform & guest laundry", priority: "medium" },
  { name: "AU Linen (Monaco)", cat: "Laundry & Linen", country: "Monaco", loc: "Monaco", web: "aulinen.mc", email: "info@aulinen.mc", notes: "Luxury yacht linen supply Monaco", priority: "medium" },
  { name: "Yachting4U Laundry (CT)", cat: "Laundry & Linen", country: "South Africa", loc: "Cape Town", web: "yachting4u.co.za", email: "info@yachting4u.co.za", notes: "SA yacht laundry & linen", priority: "medium" },

  // ═══════════════════ SECURITY ═══════════════════
  { name: "Ambrey Intelligence (Maritime)", cat: "Security", country: "UK", web: "ambrey.com", email: "info@ambrey.com", notes: "Maritime security & intelligence", priority: "high" },
  { name: "Neptune P2P Group", cat: "Security", country: "UK", web: "neptunep2pgroup.com", email: "info@neptunep2pgroup.com", notes: "Private maritime security", priority: "medium" },
  { name: "PVI (Protection Vessels International)", cat: "Security", country: "UK", web: "pviltd.com", email: "info@pviltd.com", notes: "Armed guards for yachts transiting HRA", priority: "high" },
  { name: "MAST (Maritime Asset Security & Training)", cat: "Security", country: "UK", web: "maboredast-security.com", email: "info@maboredast-security.com", notes: "Yacht security services", priority: "medium" },
  { name: "Yacht Security Solutions", cat: "Security", country: "France", loc: "Antibes", web: "yachtsecuritysolutions.com", email: "info@yachtsecuritysolutions.com", notes: "Physical security for superyachts", priority: "medium" },
  { name: "Hart International (Yacht Security)", cat: "Security", country: "UK", web: "hart-international.com", email: "info@hart-international.com", notes: "Close protection & maritime security", priority: "low" },

  // ═══════════════════ CHARTER COMPANIES ═══════════════════
  { name: "Charterworld", cat: "Charter Companies", country: "New Zealand", web: "charterworld.com", email: "info@charterworld.com", notes: "Luxury yacht charter portal", priority: "high" },
  { name: "The Moorings (Charter Fleet)", cat: "Charter Companies", country: "USA", web: "moorings.com", email: "info@moorings.com", notes: "Bareboat & crewed charter fleet", priority: "high" },
  { name: "Sunsail", cat: "Charter Companies", country: "UK", web: "sunsail.com", email: "info@sunsail.com", notes: "Sailing charter worldwide", priority: "medium" },
  { name: "Dream Yacht Charter", cat: "Charter Companies", country: "France", web: "dreamyachtcharter.com", email: "info@dreamyachtcharter.com", notes: "Global charter fleet", priority: "medium" },
  { name: "Ahoy Club", cat: "Charter Companies", country: "Australia", web: "ahoyclub.com", email: "charter@ahoyclub.com", ig: "@ahoyclub", notes: "Tech-driven charter marketplace", priority: "medium" },
  { name: "Yachtico", cat: "Charter Companies", country: "Germany", web: "yachtico.com", email: "info@yachtico.com", notes: "Online charter comparison", priority: "low" },
  { name: "BoatBureau", cat: "Charter Companies", country: "UK", web: "boatbureau.com", email: "info@boatbureau.com", notes: "Boutique yacht charter agency", priority: "medium" },

  // ═══════════════════ SAFETY EQUIPMENT ═══════════════════
  { name: "Viking Life-Saving Equipment", cat: "Safety Equipment", country: "Denmark", web: "viking-life.com", email: "info@viking-life.com", notes: "Life rafts, fire safety, PPE", priority: "high" },
  { name: "Survitec Group", cat: "Safety Equipment", country: "UK", web: "survitecgroup.com", email: "info@survitecgroup.com", notes: "Maritime survival equipment", priority: "high" },
  { name: "Ocean Safety", cat: "Safety Equipment", country: "UK", web: "oceansafety.com", email: "info@oceansafety.com", notes: "Life rafts, EPIRBs, flares", priority: "medium" },
  { name: "ACR Electronics (ResQLink)", cat: "Safety Equipment", country: "USA", web: "acrartex.com", email: "info@acrartex.com", notes: "PLBs, EPIRBs, searchlights", priority: "medium" },
  { name: "McMurdo (Orolia)", cat: "Safety Equipment", country: "UK", web: "mcmurdomarine.com", email: "info@mcmurdomarine.com", notes: "EPIRBs, AIS SARTs, DSC", priority: "medium" },
  { name: "Sea Marshall", cat: "Safety Equipment", country: "UK", web: "seamarshall.com", email: "info@seamarshall.com", notes: "Personal locator beacons", priority: "low" },
  { name: "Spinlock", cat: "Safety Equipment", country: "UK", web: "spinlock.co.uk", email: "info@spinlock.co.uk", notes: "Lifejackets, safety harnesses", priority: "medium" },

  // ═══════════════════ TENDERS & WATER TOYS ═══════════════════
  { name: "Williams Jet Tenders", cat: "Tenders & Water Toys", country: "UK", web: "williamsjettenders.com", email: "info@williamsjettenders.com", ig: "@williamsjettenders", notes: "Jet drive yacht tenders", priority: "high" },
  { name: "Novurania", cat: "Tenders & Water Toys", country: "Italy", web: "novurania.com", email: "info@novurania.com", notes: "Luxury yacht tenders", priority: "high" },
  { name: "Zodiac Nautic (Zodiac)", cat: "Tenders & Water Toys", country: "France", web: "zodiac-nautic.com", email: "contact@zodiac-nautic.com", notes: "Inflatable tenders", priority: "high" },
  { name: "AB Inflatables", cat: "Tenders & Water Toys", country: "France", web: "abmarinegroup.com", email: "info@abmarinegroup.com", notes: "RIB tenders for superyachts", priority: "medium" },
  { name: "SeaBob (CAYAGO)", cat: "Tenders & Water Toys", country: "Germany", web: "seabob.com", email: "info@seabob.com", ig: "@seabob", notes: "Electric water scooter/toy", priority: "high" },
  { name: "Fliteboard", cat: "Tenders & Water Toys", country: "Australia", web: "fliteboard.com", email: "info@fliteboard.com", ig: "@fliteboard", notes: "eFoil electric hydrofoil boards", priority: "medium" },
  { name: "FunAir (Yacht Inflatables)", cat: "Tenders & Water Toys", country: "USA", web: "funair.com", email: "info@funair.com", ig: "@funairyachts", notes: "Inflatable water toys for superyachts", priority: "high" },
  { name: "Malibu Boats (Wakeboard)", cat: "Tenders & Water Toys", country: "USA", web: "malibuboats.com", email: "info@malibuboats.com", notes: "Wakeboard & ski boats", priority: "low" },
  { name: "JetSurf", cat: "Tenders & Water Toys", country: "Czech Republic", web: "jetsurf.com", email: "info@jetsurf.com", ig: "@jetsurf", notes: "Motorized surfboards", priority: "medium" },
  { name: "Sublue (Underwater Scooters)", cat: "Tenders & Water Toys", country: "China", web: "sublue.com", email: "info@sublue.com", notes: "Underwater sea scooters", priority: "low" },

  // ═══════════════════ INTERIOR & FURNISHING ═══════════════════
  { name: "Luxury Interior Design (Reymond Langton)", cat: "Interior & Furnishing", country: "UK", loc: "London", web: "reymondlangton.com", email: "info@reymondlangton.com", notes: "Top superyacht interior designer", priority: "high" },
  { name: "Andrew Winch Designs", cat: "Interior & Furnishing", country: "UK", loc: "London", web: "winchdesign.com", email: "info@winchdesign.com", notes: "Yacht & private jet interiors", priority: "high" },
  { name: "Nuvolari Lenard", cat: "Interior & Furnishing", country: "Italy", loc: "Venice", web: "nufrnardilenard.com", email: "info@nufrnardilenard.com", notes: "Italian yacht design studio", priority: "high" },
  { name: "Yacht Interiors by Shelley", cat: "Interior & Furnishing", country: "USA", loc: "Fort Lauderdale", web: "yachtinteriorsbyshelley.com", email: "info@yachtinteriorsbyshelley.com", notes: "Interior design & refit", priority: "medium" },
  { name: "Patrick Knowles Designs", cat: "Interior & Furnishing", country: "USA", loc: "Fort Lauderdale", web: "patrickknowlesdesigns.com", email: "info@patrickknowlesdesigns.com", notes: "Yacht interior design", priority: "medium" },
  { name: "Studio Indigo (Yacht Interiors)", cat: "Interior & Furnishing", country: "UK", loc: "London", web: "studioindigo.co.uk", email: "info@studioindigo.co.uk", notes: "Luxury interiors (yachts + residential)", priority: "medium" },

  // ═══════════════════ TECHNOLOGY & SOFTWARE ═══════════════════
  { name: "IDEA Yacht Management Software", cat: "Technology & Software", country: "UK", web: "idefrn.ms", email: "info@idefrn.ms", notes: "Yacht ISM/maintenance management", priority: "high" },
  { name: "Helm CONNECT", cat: "Technology & Software", country: "Canada", web: "helmoperations.com", email: "info@helmoperations.com", notes: "Maritime operations management", priority: "medium" },
  { name: "Yachtcontroller (Joystick)", cat: "Technology & Software", country: "Italy", web: "yachtcontroller.com", email: "info@yachtcontroller.com", notes: "Wireless remote yacht control", priority: "medium" },
  { name: "OceanScout (Thermal Cameras)", cat: "Technology & Software", country: "USA", web: "flirmaritimfrn.com", email: "info@flirmaritimfrn.com", notes: "Thermal imaging for yachts (FLIR)", priority: "medium" },
  { name: "Crestron (Yacht AV)", cat: "Technology & Software", country: "USA", web: "crestron.com", email: "marine@crestron.com", notes: "AV & home automation for yachts", priority: "medium" },
  { name: "Lütron (Lighting Control)", cat: "Technology & Software", country: "USA", web: "lutron.com", email: "marine@lutron.com", notes: "Lighting automation for yachts", priority: "medium" },
  { name: "Starlink Maritime", cat: "Technology & Software", country: "USA", web: "starlink.com/maritime", email: "maritime@starlink.com", notes: "WiFi satellite internet for yachts", priority: "high" },
  { name: "Kymeta (LEO Connectivity)", cat: "Technology & Software", country: "USA", web: "kymeta.com", email: "info@kymeta.com", notes: "Flat-panel satellite antennas", priority: "medium" },

  // ═══════════════════ FUEL & LUBRICANTS ═══════════════════
  { name: "Peninsula Petroleum (Marine Fuel)", cat: "Fuel & Lubricants", country: "UK", web: "peninsulapetroleum.com", email: "info@peninsulapetroleum.com", notes: "Marine fuel supplier", priority: "high" },
  { name: "OceanConnect Marine (now KPI Bridge Oil)", cat: "Fuel & Lubricants", country: "Denmark", web: "kpibridgeoil.com", email: "info@kpibridgeoil.com", notes: "Bunker fuel broker", priority: "medium" },
  { name: "Castrol Marine (BP)", cat: "Fuel & Lubricants", country: "UK", web: "castrol.com/marine", email: "marine@castrol.com", notes: "Marine lubricants", priority: "medium" },
  { name: "Shell Marine", cat: "Fuel & Lubricants", country: "Netherlands", web: "shell.com/marine", email: "marine@shell.com", notes: "Marine fuels & lubricants", priority: "medium" },
  { name: "Total Energies Marine", cat: "Fuel & Lubricants", country: "France", web: "marine.totalenergies.com", email: "marine@totalenergies.com", notes: "Marine fuels & lubricants", priority: "medium" },

  // ═══════════════════ CLASSIFICATION SOCIETIES ═══════════════════
  { name: "Lloyd's Register (LR)", cat: "Classification Societies", country: "UK", web: "lr.org", email: "info@lr.org", notes: "Major maritime classification society", priority: "high" },
  { name: "Bureau Veritas (BV)", cat: "Classification Societies", country: "France", web: "bureauveritas.com", email: "marine@bureauveritas.com", notes: "Classification & certification", priority: "high" },
  { name: "DNV (Det Norske Veritas)", cat: "Classification Societies", country: "Norway", web: "dnv.com", email: "maritime@dnv.com", notes: "Classification, certification, assurance", priority: "high" },
  { name: "RINA (Registro Italiano Navale)", cat: "Classification Societies", country: "Italy", web: "rina.org", email: "info@rina.org", notes: "Italian classification society", priority: "medium" },
  { name: "ABS (American Bureau of Shipping)", cat: "Classification Societies", country: "USA", web: "eagle.org", email: "abs-worldhq@eagle.org", notes: "American classification society", priority: "medium" },

  // ═══════════════════ SHIPPING & LOGISTICS ═══════════════════
  { name: "Peters & May (Yacht Shipping)", cat: "Shipping & Logistics", country: "UK", web: "petersandmay.com", email: "info@petersandmay.com", notes: "Yacht & boat transport specialists", priority: "high" },
  { name: "Sevenstar Yacht Transport", cat: "Shipping & Logistics", country: "Netherlands", web: "sefrenstaryachttransport.com", email: "info@sefrenstaryachttransport.com", notes: "Semi-submersible yacht transport", priority: "high" },
  { name: "United Yacht Transport", cat: "Shipping & Logistics", country: "USA", web: "ufrntedyacht.com", email: "info@ufrntedyacht.com", notes: "Lift-on/lift-off yacht shipping", priority: "high" },
  { name: "YachtPath", cat: "Shipping & Logistics", country: "UK", web: "yachtpath.com", email: "info@yachtpath.com", notes: "Yacht logistics & shipping", priority: "medium" },
  { name: "Allied Yacht Transport", cat: "Shipping & Logistics", country: "USA", loc: "Fort Lauderdale", web: "alliedyachttransport.com", email: "info@alliedyachttransport.com", notes: "Florida-based yacht transport", priority: "medium" },
  { name: "DHL Global Forwarding (Marine)", cat: "Shipping & Logistics", country: "Germany", web: "dhl.com/global-forwarding", email: "marine@dhl.com", notes: "Marine cargo forwarding", priority: "medium" },
  { name: "Schenker (DB Cargo)", cat: "Shipping & Logistics", country: "Germany", web: "dbschenker.com", email: "marine@dbschenker.com", notes: "Maritime logistics", priority: "low" },
  { name: "Onshore Deliver", cat: "Shipping & Logistics", country: "Global", web: "onshoredelivery.com", email: "info@onshoredelivery.com", notes: "Our platform — yacht delivery logistics", priority: "high" },

  // ═══════════════════ FLORISTS & GIFTS ═══════════════════
  { name: "Wild At Heart (London)", cat: "Florists & Gifts", country: "UK", loc: "London", web: "wildatheart.com", email: "info@wildatheart.com", ig: "@wildatheart_london", notes: "Premier luxury florist", priority: "medium" },
  { name: "Fleurs de Prestige (Cannes)", cat: "Florists & Gifts", country: "France", loc: "Cannes", web: "fleursdeprestige.fr", email: "contact@fleursdeprestige.fr", notes: "Luxury event flowers, French Riviera", priority: "medium" },
  { name: "Flowers on the Quay (Antibes)", cat: "Florists & Gifts", country: "France", loc: "Antibes", web: "flowersonthequay.com", email: "info@flowersonthequay.com", notes: "Yacht florals, Antibes", priority: "medium" },
  { name: "Luxury Florist Monaco", cat: "Florists & Gifts", country: "Monaco", loc: "Monaco", web: "luxuryfloristmonaco.mc", email: "info@luxuryfloristmonaco.mc", notes: "Floral arrangements for yachts", priority: "medium" },

  // ═══════════════════ EVENT & ENTERTAINMENT ═══════════════════
  { name: "Yacht Event Solutions", cat: "Event & Entertainment", country: "France", loc: "Cannes", web: "yachtevfrntsolfrns.com", email: "info@yachtevfrntsolfrns.com", notes: "Yacht event planning & management", priority: "high" },
  { name: "Entertainment at Sea", cat: "Event & Entertainment", country: "UK", web: "entertainmentatsea.com", email: "info@entertainmentatsea.com", notes: "Onboard entertainment services", priority: "medium" },
  { name: "DJs for Yachts (Monaco)", cat: "Event & Entertainment", country: "Monaco", web: "djsforyachts.com", email: "booking@djsforyachts.com", notes: "DJ booking for yacht parties", priority: "medium" },
  { name: "The Yacht Week", cat: "Event & Entertainment", country: "Sweden", web: "theyachtweek.com", email: "info@theyachtweek.com", ig: "@theyachtweek", notes: "Sailing festival/event company", priority: "medium" },

  // ═══════════════════ DIVING & UNDERWATER ═══════════════════
  { name: "PADI Worldwide (Yacht Diving)", cat: "Diving & Underwater", country: "USA", web: "padi.com", email: "info@padi.com", notes: "Dive training for yacht crew", priority: "medium" },
  { name: "Yacht Dive (Antibes)", cat: "Diving & Underwater", country: "France", loc: "Antibes", web: "yachtdive.com", email: "info@yachtdive.com", notes: "Hull cleaning & underwater services", priority: "high" },
  { name: "DiveCrew (SA)", cat: "Diving & Underwater", country: "South Africa", loc: "Cape Town", web: "divecrew.co.za", email: "info@divecrew.co.za", notes: "Hull cleaning & prop polishing SA", priority: "medium" },
  { name: "Underwater Works (Caribbean)", cat: "Diving & Underwater", country: "Caribbean", loc: "Antigua", web: "underwaterworks.com", email: "info@underwaterworks.com", notes: "Hull cleaning & underwater surveys", priority: "medium" },
  { name: "Genco Marine (Hull Cleaning)", cat: "Diving & Underwater", country: "Spain", loc: "Palma", web: "gencofrnarine.com", email: "info@gencofrnarine.com", notes: "Hull maintenance Mediterranean", priority: "medium" },

  // ═══════════════════ MEDICAL ═══════════════════
  { name: "MedAire (International SOS)", cat: "Medical", country: "USA", web: "medaire.com", email: "info@medaire.com", notes: "Maritime telemedical, med kits, training", priority: "high" },
  { name: "MSOS (Medical Support Offshore)", cat: "Medical", country: "UK", web: "msos.org.uk", email: "info@msos.org.uk", notes: "Yacht medical kits & training", priority: "high" },
  { name: "Sea Med (Yacht Medical)", cat: "Medical", country: "France", loc: "Antibes", web: "seamed.fr", email: "info@seamed.fr", notes: "Yacht clinic & crew medical checks", priority: "medium" },
  { name: "Health at Sea", cat: "Medical", country: "UK", web: "healthatsea.co.uk", email: "info@healthatsea.co.uk", notes: "Maritime medical training (STCW)", priority: "medium" },

  // ═══════════════════ STEWARDESS & HOSPITALITY ═══════════════════
  { name: "IAMI (International Assoc. Marine Institutes)", cat: "Stewardess & Hospitality", country: "Global", web: "iainfrn.org", email: "info@iainfrn.org", notes: "Maritime training standards body", priority: "low" },
  { name: "PYA (Professional Yachting Association)", cat: "Stewardess & Hospitality", country: "South Africa", loc: "Cape Town", web: "pyaonline.com", email: "info@pyaonline.com", ig: "@pyaonline", notes: "SA yacht training & crew certification", priority: "high" },
  { name: "Stewardess Bible", cat: "Stewardess & Hospitality", country: "Global", web: "stewardessbible.com", email: "info@stewardessbible.com", notes: "Training platform for yacht stewards", priority: "medium" },
  { name: "Luxury Hospitality Academy (Antibes)", cat: "Stewardess & Hospitality", country: "France", loc: "Antibes", web: "luxuryhospitalityacademy.com", email: "info@luxuryhospitalityacademy.com", notes: "Yacht crew hospitality training", priority: "medium" },
  { name: "Flying Fish (Training)", cat: "Stewardess & Hospitality", country: "UK", web: "flyingfishonline.com", email: "info@flyingfishonline.com", notes: "Deck, Engineering & Stew training", priority: "medium" },

  // ═══════════════════ CUSTOMS & LEGAL ═══════════════════
  { name: "Hill Dickinson (Maritime Law)", cat: "Customs & Legal", country: "UK", web: "hilldickinson.com", email: "marine@hilldickinson.com", notes: "Top maritime law firm", priority: "high" },
  { name: "Holman Fenwick Willan (HFW)", cat: "Customs & Legal", country: "UK", web: "hfw.com", email: "info@hfw.com", notes: "Maritime & shipping law", priority: "high" },
  { name: "Ince & Co (now Ince)", cat: "Customs & Legal", country: "UK", web: "incfrnandco.com", email: "info@incfrnandco.com", notes: "Maritime & trade law", priority: "medium" },
  { name: "Clyde & Co (Maritime)", cat: "Customs & Legal", country: "UK", web: "clydeco.com", email: "maritime@clydeco.com", notes: "International maritime law", priority: "medium" },
  { name: "Yacht Registration Ltd (Cayman)", cat: "Customs & Legal", country: "Cayman Islands", web: "yachtregistration.com", email: "info@yachtregistration.com", notes: "Flag state registration", priority: "medium" },
  { name: "Red Ensign Group", cat: "Customs & Legal", country: "UK", web: "redensigngroup.com", email: "info@redensigngroup.com", notes: "UK & Crown Dependencies ship registry", priority: "medium" },
  { name: "Bernstein Customs (SA)", cat: "Customs & Legal", country: "South Africa", loc: "Cape Town", web: "bernsteingroup.co.za", email: "customs@bernsteingroup.co.za", notes: "SA customs brokerage for yacht goods", priority: "medium" },

  // ═══════════════════ SUSTAINABILITY & GREEN ═══════════════════
  { name: "Water Revolution Foundation", cat: "Sustainability & Green", country: "Netherlands", web: "waterrevolutionfoundation.org", email: "info@waterrevolutionfoundation.org", notes: "Sustainability in superyacht industry", priority: "high" },
  { name: "Blue Flag Programme", cat: "Sustainability & Green", country: "Global", web: "blueflag.global", email: "info@blueflag.global", notes: "Beach & marina eco-certification", priority: "low" },
  { name: "SEA Index (Superyacht Eco Association)", cat: "Sustainability & Green", country: "UK", web: "seaindex.org", email: "info@seaindex.org", notes: "Yacht environmental rating system", priority: "medium" },
  { name: "GreenYacht (Eco Solutions)", cat: "Sustainability & Green", country: "Netherlands", web: "greenyachfrn.nl", email: "info@greenyachfrn.nl", notes: "Green tech for yachts", priority: "medium" },

  // ═══════════════════ PHOTOGRAPHY & MEDIA ═══════════════════
  { name: "Jeff Brown (Breed Media)", cat: "Photography & Media", country: "UK", web: "brfrndmedia.co.uk", email: "info@brfrndmedia.co.uk", ig: "@brfrndmedia", notes: "Top superyacht photographer", priority: "high" },
  { name: "Guillaume Plisson", cat: "Photography & Media", country: "France", web: "plisson.com", email: "contact@plisson.com", notes: "Iconic maritime photographer", priority: "medium" },
  { name: "Tom van Oossanen (Yacht Photo)", cat: "Photography & Media", country: "Netherlands", web: "svfrnoossanen.com", email: "info@svfrnoossanen.com", ig: "@svfrnoossanen", notes: "Aerial yacht photography specialist", priority: "medium" },
  { name: "YachtFilm (Media Production)", cat: "Photography & Media", country: "UK", web: "yachtfilm.com", email: "info@yachtfilm.com", notes: "Video production for yachts & events", priority: "medium" },
  { name: "Insta Yachts (Social Media)", cat: "Photography & Media", country: "Global", ig: "@instayachts", notes: "Popular yacht social media account", priority: "low" },

  // ═══════════════════ ASSOCIATIONS & EVENTS ═══════════════════
  { name: "MYBA (Mediterranean Yacht Brokers Assoc)", cat: "Associations & Events", country: "France", web: "myba-association.com", email: "info@myba-association.com", notes: "Trade association for brokers", priority: "high" },
  { name: "LYBRA (Large Yacht Brokers Assoc)", cat: "Associations & Events", country: "UK", web: "lybra.co.uk", email: "info@lybra.co.uk", notes: "UK-based brokers association", priority: "medium" },
  { name: "Monaco Yacht Show (MYS)", cat: "Associations & Events", country: "Monaco", web: "monacoyachtshow.com", email: "info@monacoyachtshow.com", ig: "@monacofrachtshow", notes: "Premier superyacht event, annual Sept", priority: "high" },
  { name: "Fort Lauderdale Int. Boat Show (FLIBS)", cat: "Associations & Events", country: "USA", loc: "Fort Lauderdale", web: "flibs.com", email: "info@flibs.com", notes: "Largest boat show in the world", priority: "high" },
  { name: "Cannes Yachting Festival", cat: "Associations & Events", country: "France", loc: "Cannes", web: "cannesyachtingfestival.com", email: "info@cannesyachtingfestival.com", notes: "Annual European boat show", priority: "high" },
  { name: "Antigua Charter Yacht Show", cat: "Associations & Events", country: "Antigua", web: "antiguayachtshow.com", email: "info@antiguayachtshow.com", notes: "Annual charter yacht show", priority: "medium" },
  { name: "The Superyacht Forum", cat: "Associations & Events", country: "Netherlands", web: "superyachtforum.com", email: "info@superyachtforum.com", notes: "Annual industry conference", priority: "medium" },
  { name: "Dubai International Boat Show", cat: "Associations & Events", country: "UAE", loc: "Dubai", web: "boatshowdubai.com", email: "info@boatshowdubai.com", notes: "ME region boat show", priority: "medium" },
  { name: "Singapore Yacht Show", cat: "Associations & Events", country: "Singapore", web: "singaporeyachtshow.com", email: "info@singaporeyachtshow.com", notes: "Asia-Pacific yacht show", priority: "low" },
  { name: "METS Trade (Amsterdam)", cat: "Associations & Events", country: "Netherlands", loc: "Amsterdam", web: "metstrade.com", email: "mets@rai.nl", notes: "B2B marine equipment trade show", priority: "high" },

  // ═══════════════════ FINANCE & BANKING ═══════════════════
  { name: "Credit Suisse (Yacht Finance)", cat: "Finance & Banking", country: "Switzerland", web: "credit-suisse.com", email: "yachtfinance@credit-suisse.com", notes: "Yacht loans & finance advisory", priority: "medium" },
  { name: "Lombard Odier (Yacht Finance)", cat: "Finance & Banking", country: "Switzerland", web: "lombardodier.com", email: "info@lombardodier.com", notes: "Private bank, yacht finance", priority: "medium" },
  { name: "KfW IPEX-Bank (Ship Finance)", cat: "Finance & Banking", country: "Germany", web: "kfw-ipex-bank.de", email: "info@kfw-ipex-bank.de", notes: "Ship & yacht financing", priority: "low" },
  { name: "DVB Bank (Ship Finance)", cat: "Finance & Banking", country: "Germany", web: "dvbbank.com", email: "info@dvbbank.com", notes: "Yacht & ship finance specialist", priority: "low" },
  { name: "SYBAss (Superyacht Builders Assoc)", cat: "Finance & Banking", country: "Netherlands", web: "sybass.org", email: "info@sybass.org", notes: "Builders association + escrow services", priority: "medium" },

  // ═══════════════════ HELICOPTER & AVIATION ═══════════════════
  { name: "Airbus Helicopters (ACH)", cat: "Helicopter & Aviation", country: "France", web: "airbuscorporatehelicopters.com", email: "ach@airbus.com", notes: "H130, H135, H145 for yachts", priority: "high" },
  { name: "Bell Helicopter (Textron)", cat: "Helicopter & Aviation", country: "USA", web: "bellflight.com", email: "marketing@bellflight.com", notes: "Bell 429 for yacht operations", priority: "medium" },
  { name: "Leonardo Helicopters (AW)", cat: "Helicopter & Aviation", country: "Italy", web: "leonardocompany.com", email: "helicopters@leonardocompany.com", notes: "AW109, AW139 yacht heli", priority: "medium" },
  { name: "HeliOps International", cat: "Helicopter & Aviation", country: "UK", web: "heliops.aero", email: "ops@heliops.aero", notes: "Helicopter ops & management for yachts", priority: "medium" },

  // ═══════════════════ CONCIERGE & LIFESTYLE ═══════════════════
  { name: "Quintessentially (Yacht Division)", cat: "Concierge & Lifestyle", country: "UK", web: "quintessentially.com", email: "yacht@quintessentially.com", notes: "Ultra-luxury concierge", priority: "high" },
  { name: "Nota Bene Global", cat: "Concierge & Lifestyle", country: "France", loc: "Monaco", web: "notabenefrnlobal.com", email: "info@notabenefrnlobal.com", notes: "Yacht concierge & lifestyle mgmt", priority: "medium" },
  { name: "YachtLife (App)", cat: "Concierge & Lifestyle", country: "USA", web: "yachtlife.com", email: "info@yachtlife.com", ig: "@yachtlife", notes: "Yacht charter booking app", priority: "medium" },
  { name: "The Yacht Concierge (SXM)", cat: "Concierge & Lifestyle", country: "St Maarten", loc: "St Maarten", web: "theyachtconcierge.com", email: "info@theyachtconcierge.com", notes: "Caribbean yacht concierge services", priority: "medium" },
  { name: "Yacht Concierge Ibiza", cat: "Concierge & Lifestyle", country: "Spain", loc: "Ibiza", web: "yachtconciergeibiza.com", email: "info@yachtconciergeibiza.com", notes: "Ibiza yacht concierge & events", priority: "medium" },

  // ═══════════════════ COMMUNICATION & SATCOM ═══════════════════
  { name: "Inmarsat (Fleet Xpress)", cat: "Communication & Satcom", country: "UK", web: "inmarsat.com", email: "maritime@inmarsat.com", notes: "Maritime broadband satellite", priority: "high" },
  { name: "Iridium (Certus Maritime)", cat: "Communication & Satcom", country: "USA", web: "iridium.com", email: "info@iridium.com", notes: "Global satellite communications", priority: "high" },
  { name: "Speedcast (Maritime)", cat: "Communication & Satcom", country: "Australia", web: "speedcast.com", email: "info@speedcast.com", notes: "Managed connectivity for yachts", priority: "medium" },
  { name: "OmniAccess", cat: "Communication & Satcom", country: "Spain", loc: "Palma de Mallorca", web: "omniaccess.com", email: "info@omniaccess.com", notes: "Superyacht VSAT & IT solutions", priority: "high" },
  { name: "e3 Systems (Yacht IT)", cat: "Communication & Satcom", country: "UK", web: "e3s.com", email: "info@e3s.com", notes: "Yacht IT infrastructure & support", priority: "medium" },

  // ═══════════════════ GALLERY & ART ═══════════════════
  { name: "Maddox Gallery (Yacht Art)", cat: "Gallery & Art", country: "UK", loc: "London", web: "maddoxgallery.com", email: "info@maddoxgallery.com", ig: "@maddoxgallery", notes: "Contemporary art for yachts", priority: "medium" },
  { name: "Artnet (Online Art Market)", cat: "Gallery & Art", country: "USA", web: "artnet.com", email: "info@artnet.com", notes: "Online art marketplace", priority: "low" },
  { name: "SuperYacht Art Foundation", cat: "Gallery & Art", country: "Netherlands", web: "superyachtart.org", email: "info@superyachtart.org", notes: "Art curation for yachts", priority: "medium" },

  // ═══════════════════ CLEANING & DETAILING ═══════════════════
  { name: "Seahorse Marine (Yacht Cleaning)", cat: "Cleaning & Detailing", country: "France", loc: "Antibes", web: "seahorsemarine.com", email: "info@seahorsemarine.com", notes: "Yacht cleaning & detailing", priority: "medium" },
  { name: "Superyacht Teak", cat: "Cleaning & Detailing", country: "UK", web: "superyachtteak.com", email: "info@superyachtteak.com", notes: "Teak restoration & maintenance", priority: "medium" },
  { name: "Pro Yacht Cleaning (CT)", cat: "Cleaning & Detailing", country: "South Africa", loc: "Cape Town", web: "proyachtcleaning.co.za", email: "info@proyachtcleaning.co.za", notes: "SA yacht cleaning services", priority: "medium" },
  { name: "The Yacht Wash", cat: "Cleaning & Detailing", country: "Spain", loc: "Palma de Mallorca", web: "theyachtwash.com", email: "info@theyachtwash.com", notes: "Eco-friendly yacht cleaning", priority: "medium" },

  // ═══════════════════ WASTE MANAGEMENT ═══════════════════
  { name: "Hamann AG (Sewage Treatment)", cat: "Waste Management", country: "Germany", web: "hamann.de", email: "info@hamann.de", notes: "Marine sewage treatment systems", priority: "medium" },
  { name: "Jets (Vacuum Toilets)", cat: "Waste Management", country: "Norway", web: "jfrnsgroup.com", email: "info@jfrnsgroup.com", notes: "Vacuum toilet systems for yachts", priority: "medium" },
  { name: "Ecmar (Waste Management)", cat: "Waste Management", country: "France", web: "ecmar.fr", email: "info@ecmar.fr", notes: "Yacht waste collection, French Riviera", priority: "medium" },
  { name: "Sea Clean (Bilge Treatment)", cat: "Waste Management", country: "Italy", web: "seaclean.it", email: "info@seaclean.it", notes: "Bilge water treatment systems", priority: "low" },

  // ═══════════════════ AIR CONDITIONING & HVAC ═══════════════════
  { name: "Heinen & Hopman", cat: "Air Conditioning & HVAC", country: "Netherlands", web: "heinenhopman.com", email: "info@heinenhopman.com", notes: "Marine HVAC specialists", priority: "high" },
  { name: "Dometic Marine", cat: "Air Conditioning & HVAC", country: "Sweden", web: "dometic.com", email: "marine@dometic.com", notes: "Marine A/C, refrigeration, sanitation", priority: "high" },
  { name: "Frigomar Marine A/C", cat: "Air Conditioning & HVAC", country: "Italy", web: "frigomar.com", email: "info@frigomar.com", notes: "Italian marine HVAC", priority: "medium" },
  { name: "Webasto Marine", cat: "Air Conditioning & HVAC", country: "Germany", web: "webasto-marine.com", email: "marine@webasto.com", notes: "Heating & cooling solutions", priority: "medium" },
  { name: "Condaria (Marine HVAC)", cat: "Air Conditioning & HVAC", country: "Italy", web: "condaria.com", email: "info@condaria.com", notes: "Yacht HVAC & chiller systems", priority: "medium" },

  // ═══════════════════ RIGGING & SAILS ═══════════════════
  { name: "North Sails", cat: "Rigging & Sails", country: "USA", web: "northsails.com", email: "info@northsails.com", ig: "@northsails", notes: "Sailing sails & gear", priority: "high" },
  { name: "Doyle Sails", cat: "Rigging & Sails", country: "New Zealand", web: "doylesails.com", email: "info@doylesails.com", notes: "Cableless sails, structured luff", priority: "high" },
  { name: "Elvstrøm Sails", cat: "Rigging & Sails", country: "Denmark", web: "elvstromsails.com", email: "info@elvstromsails.com", notes: "Racing & cruising sails", priority: "medium" },
  { name: "Quantum Sails", cat: "Rigging & Sails", country: "USA", web: "quantumsails.com", email: "info@quantumsails.com", notes: "Performance sailing sails", priority: "medium" },
  { name: "Southern Spars", cat: "Rigging & Sails", country: "New Zealand", web: "southernspars.com", email: "info@southernspars.com", notes: "Carbon fibre masts & rigging", priority: "high" },
  { name: "Gottifredi Maffioli (Ropes)", cat: "Rigging & Sails", country: "Italy", web: "gottifredimaffioli.com", email: "info@gottifredimaffioli.com", notes: "High-performance marine ropes", priority: "medium" },
  { name: "Marlow Ropes", cat: "Rigging & Sails", country: "UK", web: "marlowropes.com", email: "info@marlowropes.com", notes: "Marine & yacht ropes", priority: "medium" },
]

async function main() {
  console.log('Seeding CRM contacts...')

  let created = 0
  let skipped = 0

  for (const c of DB) {
    // Check if contact already exists by name + category
    const existing = await prisma.crmContact.findFirst({
      where: { name: c.name, category: c.cat },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.crmContact.create({
      data: {
        name: c.name,
        category: c.cat,
        country: c.country || null,
        location: c.loc || null,
        website: c.web || null,
        email: c.email || null,
        email2: c.email2 || null,
        phone: c.phone || null,
        phone2: c.phone2 || null,
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

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
