// Analyze EXCLUDED contacts from the xlsx to find missed brokers, mgmt companies, vendors
const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('app/community/Contacts/Contacts.xlsx');
const ws = wb.Sheets['Contacts'];
const data = XLSX.utils.sheet_to_json(ws);

// Current yacht filter (from parse-contacts.js)
const yachtIndustries = new Set([
  'Yacht', 'Charter Broker', 'Management Company', 'Agent',
  'Provisioning Company', 'Ship Yard', 'Services provider', 'Yachtneeds'
]);

const marinePat = /yacht|marine|maritime|boat|sail|charter|marina|shipyard|crew|nautical|captain|naval|anchor|port|harbour|harbor|deck|hull|refit|superyacht|mega.?yacht|provisioning|chandler/i;

const included = new Set();
const excluded = [];

data.forEach(r => {
  const name = (r['Display Name'] || r['Company Name'] || '').toString();
  const industry = (r['CF.Industry'] || '').toString();
  const notes = (r['Notes'] || '').toString();
  const compName = (r['Company Name'] || '').toString();
  
  const isYacht = /^(M\/Y|S\/Y|MY |SY )/i.test(name);
  const isYachtIndustry = yachtIndustries.has(industry);
  const isMarineCompany = marinePat.test(name + ' ' + notes + ' ' + compName);
  
  if (isYacht || isYachtIndustry || isMarineCompany) {
    included.add(name);
  } else {
    excluded.push(r);
  }
});

console.log('Total:', data.length, '| Included:', included.size, '| Excluded:', excluded.length);

// Look at excluded contacts by CF.Industry
const exclIndustries = {};
excluded.forEach(r => {
  const ind = r['CF.Industry'] || 'EMPTY';
  if (!exclIndustries[ind]) exclIndustries[ind] = [];
  exclIndustries[ind].push(r);
});

console.log('\n=== EXCLUDED by CF.Industry ===');
Object.entries(exclIndustries).sort((a,b) => b[1].length - a[1].length).forEach(([k, arr]) => {
  console.log(`\n--- ${k} (${arr.length}) ---`);
  arr.slice(0, 8).forEach(r => {
    const name = r['Display Name'] || r['Company Name'] || '';
    const email = r['EmailID'] || '';
    const phone = r['Phone'] || r['MobilePhone'] || '';
    const notes = (r['Notes'] || '').substring(0, 100);
    const comp = r['Company Name'] || '';
    const acctType = r['CF.Account Type'] || '';
    console.log(`  ${name} | ${comp} | ${email} | ${phone} | ${acctType} | ${notes}`);
  });
});
