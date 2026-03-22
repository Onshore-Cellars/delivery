// Deep analysis of excluded contacts to find yacht-related ones
const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('app/community/Contacts/Contacts.xlsx');
const ws = wb.Sheets['Contacts'];
const data = XLSX.utils.sheet_to_json(ws);

// Patterns for yacht-related emails
const yachtEmailDomains = /(@.*yacht|@.*marine|@.*sailing|@.*charter|@.*crew|@.*boat|@.*nautical|@.*captain|@my-|@sy-|@mv-|camperandnicholsons|burgessyachts|fraseryachts|edmiston|hillrobinson|lurssen|benetti|feadship|heesen|sanlorenzo|sunseeker|princess|y\.co|iyc\.com|cecilwright|oceanindependence|northrop|yachtzoo|wilsonhalligan|bluewateryacht|cornerstoneyacht|insignia|quarterdeck|quaycrew)/i;

// Patterns for yacht-related names (beyond M/Y, S/Y)
const yachtNamePat = /project\s+\w+|^(captain|capt\.?)\s|chief\s*(stew|engineer|officer|mate)|purser|bosun|deckhand|steward|^engineer\s|^chef\s/i;

// Check if a name references a yacht (project names, M/Y mentions in notes, etc.)
const yachtRefPat = /M\/Y|S\/Y|motor.?yacht|sailing.?yacht|super.?yacht|mega.?yacht|the.?yacht|onboard|on.?board|vessel/i;

const excluded = [];
const found = [];

data.forEach(r => {
  const name = (r['Display Name'] || r['Company Name'] || '').toString();
  const industry = (r['CF.Industry'] || '').toString();
  const notes = (r['Notes'] || '').toString();
  const compName = (r['Company Name'] || '').toString();
  const email = (r['EmailID'] || '').toString();
  const designation = (r['Designation'] || '').toString();
  const department = (r['Department'] || '').toString();
  const website = (r['Website'] || '').toString();
  const firstName = (r['First Name'] || '').toString();
  const lastName = (r['Last Name'] || '').toString();

  // Already included by basic filter
  const yachtIndustries = new Set([
    'Yacht', 'Charter Broker', 'Management Company', 'Agent',
    'Provisioning Company', 'Ship Yard', 'Services provider', 'Yachtneeds'
  ]);
  const basicMarinePat = /yacht|marine|maritime|boat|sail|charter|marina|shipyard|crew|nautical|captain|naval|anchor|port|harbour|harbor|deck|hull|refit|superyacht|mega.?yacht|provisioning|chandler/i;
  
  const isYacht = /^(M\/Y|S\/Y|MY |SY )/i.test(name);
  const isYachtIndustry = yachtIndustries.has(industry);
  const isMarineCompany = basicMarinePat.test(name + ' ' + notes + ' ' + compName);
  
  if (isYacht || isYachtIndustry || isMarineCompany) return; // already included

  // Now check deeper for missed contacts
  const allText = [name, compName, notes, email, designation, department, website].join(' ');
  
  let reason = null;
  
  // 1. Email domain is yacht-related
  if (yachtEmailDomains.test(email)) {
    reason = 'yacht_email_domain';
  }
  // 2. Name looks like yacht crew designation
  else if (yachtNamePat.test(name) || yachtNamePat.test(designation)) {
    reason = 'crew_designation';
  }
  // 3. Notes/company reference yacht
  else if (yachtRefPat.test(notes) || yachtRefPat.test(compName) || yachtRefPat.test(designation)) {
    reason = 'yacht_reference';
  }
  // 4. Website is yacht-related
  else if (/yacht|marine|sail|charter|boat|nautical/i.test(website)) {
    reason = 'yacht_website';
  }
  // 5. Industry is Owner or Charterer (yacht owners/charterers)
  else if (industry === 'Owner' || industry === 'Charterer') {
    reason = 'owner_charterer';
  }
  // 6. Department is yacht-related (Interior, Deck, Engineering, etc.)
  else if (/^(Interior|Deck|Engineering|Galley|Bridge)$/i.test(department)) {
    reason = 'yacht_department';
  }
  // 7. Company name contains M/Y or S/Y reference
  else if (/M\/Y|S\/Y/i.test(compName) || /M\/Y|S\/Y/i.test(name)) {
    reason = 'my_sy_in_company';
  }
  // 8. Wine suppliers (relevant for yacht provisioning)
  else if (industry === 'Wine Supplier') {
    reason = 'wine_supplier';
  }
  // 9. Check for specific yacht companies in Shopify clients  
  else if (/provisioning|wine.*yacht|stew.*yacht|galley/i.test(allText)) {
    reason = 'provisioning';
  }

  if (reason) {
    found.push({ ...r, _reason: reason });
  }
});

console.log('Additional yacht-related contacts found:', found.length);

// Group by reason
const byReason = {};
found.forEach(r => {
  const reason = r._reason;
  if (!byReason[reason]) byReason[reason] = [];
  byReason[reason].push(r);
});

Object.entries(byReason).sort((a,b) => b[1].length - a[1].length).forEach(([reason, arr]) => {
  console.log(`\n=== ${reason} (${arr.length}) ===`);
  arr.slice(0, 10).forEach(r => {
    const name = r['Display Name'] || r['Company Name'] || '';
    const email = r['EmailID'] || '';
    const phone = r['Phone'] || r['MobilePhone'] || '';
    const compName = r['Company Name'] || '';
    const industry = r['CF.Industry'] || '';
    const dept = r['Department'] || '';
    const desig = r['Designation'] || '';
    console.log(`  ${name} | ${compName} | ${email} | ${phone} | ${industry} | ${dept}/${desig}`);
  });
  if (arr.length > 10) console.log(`  ... and ${arr.length - 10} more`);
});

// Now write these additional contacts
const additionalContacts = found.map(r => {
  const name = (r['Display Name'] || r['Company Name'] || '').toString();
  const reason = r._reason;
  
  let category;
  if (reason === 'owner_charterer' && r['CF.Industry'] === 'Owner') category = 'Yacht Owner';
  else if (reason === 'owner_charterer' && r['CF.Industry'] === 'Charterer') category = 'Charterer';
  else if (reason === 'wine_supplier') category = 'Wine & Spirits';
  else if (reason === 'crew_designation' || reason === 'yacht_department') category = 'Yacht Crew';
  else if (reason === 'yacht_email_domain') {
    const email = (r['EmailID'] || '').toLowerCase();
    if (/camperandnicholsons|burgessyachts|fraseryachts|edmiston|hillrobinson|y\.co|iyc\.com|cecilwright|oceanindependence|northrop|yachtzoo|bluewateryacht|cornerstoneyacht/i.test(email)) {
      category = 'Charter Broker';
    } else category = 'Yacht Services';
  }
  else if (reason === 'yacht_reference' || reason === 'my_sy_in_company') {
    if (/M\/Y/i.test(name)) category = 'Motor Yacht';
    else if (/S\/Y/i.test(name)) category = 'Sailing Yacht';
    else category = 'Yacht Services';
  }
  else if (reason === 'yacht_website') category = 'Yacht Services';
  else if (reason === 'provisioning') category = 'Provisioning';
  else category = 'Yacht Services';

  return {
    name: name,
    category: category,
    country: r['Billing Country'] || r['Shipping Country'] || '',
    location: [r['Billing City'], r['Billing State']].filter(Boolean).join(', ') ||
              [r['Shipping City'], r['Shipping State']].filter(Boolean).join(', ') || '',
    website: (r['Website'] || '').toString().replace(/^https?:\/\//, '').replace(/\/$/, ''),
    email: r['EmailID'] || '',
    phone: r['Phone'] || '',
    phone2: r['MobilePhone'] || '',
    notes: r['Notes'] || '',
    yachtLength: r['CF.Yacht Length'] || '',
    mmsi: r['CF.MMSI'] || '',
    imo: r['CF.IMO Number'] || '',
    industry: r['CF.Industry'] || '',
    contactName: [r['First Name'], r['Last Name']].filter(Boolean).join(' '),
    designation: r['Designation'] || '',
    department: r['Department'] || '',
    accountType: r['CF.Account Type'] || '',
    _reason: reason,
  };
});

// Category distribution of new contacts
const catDist = {};
additionalContacts.forEach(c => {
  catDist[c.category] = (catDist[c.category] || 0) + 1;
});
console.log('\n=== New Category Distribution ===');
Object.entries(catDist).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${v} ${k}`));

// Merge with existing
const existing = JSON.parse(fs.readFileSync('./prisma/xlsx-contacts.json', 'utf8'));
const merged = [...existing, ...additionalContacts];
fs.writeFileSync('./prisma/xlsx-contacts.json', JSON.stringify(merged, null, 2));
console.log(`\nMerged: ${existing.length} existing + ${additionalContacts.length} new = ${merged.length} total`);
