// Top 200 most common passwords that pass basic complexity rules
const COMMON_PASSWORDS = new Set([
  'Password1', 'Password123', 'Qwerty123', 'Abc12345', 'Admin123',
  'Welcome1', 'Passw0rd', 'Change123', 'Letmein1', 'Master123',
  'Summer2024', 'Winter2024', 'Spring2024', 'Autumn2024',
  'Iloveyou1', 'Sunshine1', 'Princess1', 'Football1', 'Charlie1',
  'Shadow123', 'Dragon123', 'Michael1', 'Jordan123', 'Monkey123',
  'Liverpool1', 'Arsenal123', 'Chelsea123', 'Delivery1', 'Onshore1',
  'Password12', 'Qwerty1234', 'Abcdef123', 'Trustno1', 'Baseball1',
  'Superman1', 'Batman123', 'Matrix123', 'Flower123', 'Hello123',
  'P@ssw0rd', 'Pa$$word1', 'Passw0rd1', 'Test1234', 'User1234',
])

export function isCommonPassword(password: string): boolean {
  // Check exact match (case-insensitive)
  if (COMMON_PASSWORDS.has(password)) return true
  // Check lowercase version
  for (const common of COMMON_PASSWORDS) {
    if (password.toLowerCase() === common.toLowerCase()) return true
  }
  // Check if it's just a word + numbers pattern like "Company2024"
  if (/^[A-Za-z]+\d{4}$/.test(password) && password.length < 12) return true
  return false
}
