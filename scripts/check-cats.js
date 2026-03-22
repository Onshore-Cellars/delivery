const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./prisma/xlsx-contacts.json', 'utf8'));

const cats = {};
data.forEach(c => {
  if (!cats[c.category]) cats[c.category] = [];
  if (cats[c.category].length < 4) {
    cats[c.category].push({
      name: c.name,
      email: c.email,
      phone: c.phone,
      notes: c.notes ? c.notes.substring(0, 80) : ''
    });
  }
});

Object.entries(cats).forEach(([k, v]) => {
  console.log('\n=== ' + k + ' ===');
  v.forEach(c => console.log('  ' + c.name + ' | ' + c.email + ' | ' + c.phone + ' | ' + c.notes));
});
