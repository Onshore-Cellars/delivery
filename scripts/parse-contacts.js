// Parse Contacts.xlsx and extract yacht-related contacts
const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('app/community/Contacts/Contacts.xlsx');
const ws = wb.Sheets['Contacts'];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Total contacts:', data.length);

// Industries that are yacht-related
const yachtIndustries = new Set([
  'Yacht', 'Charter Broker', 'Management Company', 'Agent',
  'Provisioning Company', 'Ship Yard', 'Services provider', 'Yachtneeds'
]);

const yachtContacts = data.filter(r => {
  const name = (r['Display Name'] || r['Company Name'] || '').toString();
  const industry = (r['CF.Industry'] || '').toString();
  const notes = (r['Notes'] || '').toString().toLowerCase();
  const compName = (r['Company Name'] || '').toString();

  // Include if: M/Y or S/Y prefix
  const isYacht = /^(M\/Y|S\/Y|MY |SY )/i.test(name);
  // Include if yacht-related industry
  const isYachtIndustry = yachtIndustries.has(industry);
  // Include if marine keywords in name/notes
  const marinePat = /yacht|marine|maritime|boat|sail|charter|marina|shipyard|crew|nautical|captain|naval|anchor|port|harbour|harbor|deck|hull|refit|superyacht|mega.?yacht|provisioning|chandler/i;
  const isMarineCompany = marinePat.test(name + ' ' + notes + ' ' + compName);

  return isYacht || isYachtIndustry || isMarineCompany;
});

// Count useful info
let withEmail = 0, withPhone = 0, withBoth = 0;
yachtContacts.forEach(r => {
  const hasEmail = Boolean(r['EmailID']);
  const hasPhone = Boolean(r['Phone'] || r['MobilePhone']);
  if (hasEmail) withEmail++;
  if (hasPhone) withPhone++;
  if (hasEmail && hasPhone) withBoth++;
});

console.log('Yacht-related contacts:', yachtContacts.length);
console.log('With email:', withEmail);
console.log('With phone:', withPhone);
console.log('With both:', withBoth);

// Categorize the contacts
function categorize(r) {
  const name = (r['Display Name'] || '').toString();
  const industry = (r['CF.Industry'] || '').toString();
  const notes = (r['Notes'] || '').toString();
  const compName = (r['Company Name'] || '').toString();
  const combined = (name + ' ' + notes + ' ' + compName + ' ' + industry).toLowerCase();

  if (/^m\/y/i.test(name)) return 'Motor Yacht';
  if (/^s\/y/i.test(name)) return 'Sailing Yacht';
  if (/charter.*broker/i.test(industry) || /charter/i.test(combined)) return 'Charter Broker';
  if (/management/i.test(industry)) return 'Management Company';
  if (/provisioning/i.test(industry) || /provisioning|provision/i.test(combined)) return 'Provisioning';
  if (/agent/i.test(industry)) return 'Yacht Agent';
  if (/crew/i.test(combined)) return 'Crew Agency';
  if (/ship.?yard|refit/i.test(combined)) return 'Shipyard & Refit';
  if (/marina|port|harbour|harbor/i.test(combined)) return 'Marina';
  if (/chandler/i.test(combined)) return 'Chandlery';
  if (/sail/i.test(combined)) return 'Sailing';
  if (/yacht/i.test(combined)) return 'Yacht Services';
  return 'Marine Services';
}

// Build output
const output = yachtContacts.map(r => {
  const cat = categorize(r);
  return {
    name: r['Display Name'] || r['Company Name'] || '',
    category: cat,
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
  };
});

// Show category distribution
const catDist = {};
output.forEach(o => {
  catDist[o.category] = (catDist[o.category] || 0) + 1;
});
console.log('\n=== Category Distribution ===');
Object.entries(catDist).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${v} ${k}`));

// Show samples
console.log('\n=== Samples ===');
output.slice(0, 10).forEach(o => console.log(JSON.stringify(o)));

// Write output as JSON for the seed script to consume
fs.writeFileSync('prisma/xlsx-contacts.json', JSON.stringify(output, null, 2));
console.log('\nWrote', output.length, 'contacts to prisma/xlsx-contacts.json');
