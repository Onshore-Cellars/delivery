// Final pass - find remaining yacht crew by department field and other signals
const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('app/community/Contacts/Contacts.xlsx');
const ws = wb.Sheets['Contacts'];
const data = XLSX.utils.sheet_to_json(ws);

// Load already-included names to avoid dupes
const existing = JSON.parse(fs.readFileSync('./prisma/xlsx-contacts.json', 'utf8'));
const includedNames = new Set(existing.map(c => c.name));

const found = [];

data.forEach(r => {
  const name = (r['Display Name'] || r['Company Name'] || '').toString();
  if (includedNames.has(name)) return; // already included
  
  const dept = (r['Department'] || '').toString();
  const desig = (r['Designation'] || '').toString();
  const notes = (r['Notes'] || '').toString();
  const compName = (r['Company Name'] || '').toString();
  const email = (r['EmailID'] || '').toString();
  const website = (r['Website'] || '').toString();
  const mgmt = (r['CF.Management Company'] || '').toString();
  
  let reason = null;
  
  // Yacht crew departments
  if (/^(Interior|Deck|Engineering|Galley|Bridge)$/i.test(dept)) {
    reason = 'yacht_department';
  }
  // Yacht crew designations
  else if (/chief\s*stew|stewardess|purser|bosun|deckhand|1st\s*mate|2nd\s*mate|first\s*officer|chief\s*officer|engineer|captain|chef|cook/i.test(desig)) {
    reason = 'crew_role';
  }
  // Management company field is set
  else if (mgmt && mgmt.length > 2) {
    reason = 'has_mgmt_company';
  }
  // MarineTraffic website = it's a vessel
  else if (/marinetraffic/i.test(website)) {
    reason = 'marinetraffic_vessel';
  }
  // Email contains typical yacht patterns
  else if (/chiefstew|stewardess|purser|bosun|captain|@my[.-]|@sy[.-]|@mv[.-]/i.test(email)) {
    reason = 'crew_email';
  }
  // Name starts with "Project" (common yacht project names)
  else if (/^Project\s/i.test(name) && (email || r['Phone'] || r['MobilePhone'])) {
    reason = 'project_name';
  }

  if (reason) {
    found.push(r);
    
    let category;
    if (/marinetraffic/i.test(website)) {
      if (/S\/Y/i.test(name)) category = 'Sailing Yacht';
      else category = 'Motor Yacht';
    } else if (reason === 'has_mgmt_company') {
      category = 'Yacht Services';
    } else {
      category = 'Yacht Crew';
    }
    
    const contact = {
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
    };
    existing.push(contact);
    includedNames.add(name);
  }
});

console.log('Additional contacts found (final pass):', found.length);

// Show samples
const byReason = {};
found.forEach(r => {
  const name = (r['Display Name'] || r['Company Name'] || '').toString();
  const email = r['EmailID'] || '';
  const phone = r['Phone'] || r['MobilePhone'] || '';
  // group by reason not stored... just show all
});

found.slice(0, 20).forEach(r => {
  const name = (r['Display Name'] || r['Company Name'] || '').toString();
  const email = r['EmailID'] || '';
  const phone = r['Phone'] || r['MobilePhone'] || '';
  const dept = r['Department'] || '';
  const desig = r['Designation'] || '';
  console.log(`  ${name} | ${email} | ${phone} | ${dept}/${desig}`);
});
if (found.length > 20) console.log(`  ... and ${found.length - 20} more`);

fs.writeFileSync('./prisma/xlsx-contacts.json', JSON.stringify(existing, null, 2));
console.log(`\nTotal contacts now: ${existing.length}`);
