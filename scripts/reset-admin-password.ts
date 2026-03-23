#!/usr/bin/env npx tsx
/**
 * Reset admin password utility
 *
 * Usage (run in Railway console or locally with DATABASE_URL set):
 *   npx tsx scripts/reset-admin-password.ts <email> <new-password>
 *
 * Example:
 *   npx tsx scripts/reset-admin-password.ts admin@onshoredelivery.com MyNewPass123
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const [email, newPassword] = process.argv.slice(2)

  if (!email || !newPassword) {
    console.error('Usage: npx tsx scripts/reset-admin-password.ts <email> <new-password>')
    console.error('Example: npx tsx scripts/reset-admin-password.ts admin@onshoredelivery.com MyNewPass123')
    process.exit(1)
  }

  if (newPassword.length < 8) {
    console.error('Password must be at least 8 characters')
    process.exit(1)
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  if (!user) {
    console.error(`No account found for: ${normalizedEmail}`)
    console.log('\nExisting users:')
    const users = await prisma.user.findMany({ select: { email: true, role: true, createdAt: true } })
    if (users.length === 0) {
      console.log('  (no users in database — you need to register first)')
    } else {
      users.forEach(u => console.log(`  ${u.email} (${u.role}) — created ${u.createdAt.toISOString()}`))
    }
    process.exit(1)
  }

  // Hash and update password
  const hashedPassword = await hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  console.log(`Password reset successfully for: ${normalizedEmail} (${user.role})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
