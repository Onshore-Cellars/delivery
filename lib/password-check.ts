// Common passwords that pass basic complexity rules (stored lowercase for fast lookup)
const COMMON_PASSWORDS_LOWER = new Set([
  'password1', 'password123', 'qwerty123', 'abc12345', 'admin123',
  'welcome1', 'passw0rd', 'change123', 'letmein1', 'master123',
  'summer2024', 'winter2024', 'spring2024', 'autumn2024',
  'summer2025', 'winter2025', 'spring2025', 'autumn2025',
  'summer2026', 'winter2026', 'spring2026', 'autumn2026',
  'iloveyou1', 'sunshine1', 'princess1', 'football1', 'charlie1',
  'shadow123', 'dragon123', 'michael1', 'jordan123', 'monkey123',
  'liverpool1', 'arsenal123', 'chelsea123', 'delivery1', 'onshore1',
  'password12', 'qwerty1234', 'abcdef123', 'trustno1', 'baseball1',
  'superman1', 'batman123', 'matrix123', 'flower123', 'hello123',
  'p@ssw0rd', 'pa$$word1', 'passw0rd1', 'test1234', 'user1234',
  'secure123', 'access123', 'marine123', 'yacht1234', 'boat12345',
])

export function isCommonPassword(password: string): boolean {
  // Case-insensitive lookup via pre-lowered set
  if (COMMON_PASSWORDS_LOWER.has(password.toLowerCase())) return true
  // Check if it's just a word + 4 digits pattern like "Company2024"
  if (/^[A-Za-z]+\d{4}$/.test(password) && password.length < 12) return true
  return false
}
