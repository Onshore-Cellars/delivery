import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { sanitizeHtml } from '@/lib/sanitize'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// POST /api/admin/crm/send-email — send a quick email to one or more contacts
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { to, subject, body, contactName } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 })
    }

    // Validate email format
    const emails = Array.isArray(to) ? to : [to]
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: `Invalid email: ${email}` }, { status: 400 })
      }
    }

    const sanitizedSubject = sanitizeHtml(subject)
    const sanitizedBody = sanitizeHtml(body)

    // Send to each recipient
    let sent = 0
    let failed = 0

    for (const email of emails) {
      try {
        await sendEmail({
          to: email,
          subject: sanitizedSubject,
          html: sanitizedBody.replace(/\n/g, '<br>'),
        })
        sent++
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      message: `Email sent to ${sent} recipient(s)${failed > 0 ? `, ${failed} failed` : ''}`,
    })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
