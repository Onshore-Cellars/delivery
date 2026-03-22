import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function requireAdmin(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null
  return decoded
}

// POST /api/admin/crm/ai — generate AI content (emails, social posts)
export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const { type, prompt, context } = body

    if (!type || !prompt) {
      return NextResponse.json({ error: 'type and prompt are required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured — set ANTHROPIC_API_KEY' }, { status: 503 })
    }

    const systemPrompts: Record<string, string> = {
      email_campaign: `You are an expert email marketing copywriter for Onshore Deliver — a premium yacht delivery logistics platform connecting yacht owners, charter companies, crew, and marine service providers across the Mediterranean and worldwide.

Write professional, engaging marketing emails in HTML format. Use inline CSS styles only (no external stylesheets). The email will be wrapped in Onshore Deliver's branded template automatically, so just provide the inner content.

Guidelines:
- Use a warm, professional tone suited to the luxury yachting industry
- Keep paragraphs short (2-3 sentences max)
- Include a clear call-to-action button styled as: <a href="{{cta_url}}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C6904D,#b07e3f);color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">CTA TEXT</a>
- Use {{name}} for personalisation
- Include relevant emojis sparingly for modern feel
- Structure: compelling headline → value proposition → details → CTA → sign-off
- Return ONLY the HTML content, no markdown fences`,

      email_subject: `You are an email subject line expert for Onshore Deliver (yacht delivery logistics). Generate 5 compelling subject lines that maximise open rates. Return them as a JSON array of strings. Be creative, professional, and relevant to the yachting industry. Consider using: personalisation, urgency, curiosity, or value-driven approaches. Return ONLY the JSON array, no other text.`,

      email_route_update: `You are a logistics communications specialist for Onshore Deliver — a yacht delivery platform. Write professional HTML emails announcing new delivery routes, schedule changes, or capacity updates to yacht owners, charter companies, and marine service providers.

Include practical details (routes, dates, capacity) in a clean, scannable format. Use inline CSS only. Include {{name}} for personalisation. Use a professional CTA button. Return ONLY HTML content.`,

      linkedin_article: `You are a thought leadership content writer for Onshore Deliver — a premium yacht delivery logistics platform. Write engaging LinkedIn articles that position the company as an industry leader.

Guidelines:
- Professional but approachable tone
- Include industry insights and data points
- Structure with clear sections and subheadings
- 600-1200 words ideal length
- End with a thought-provoking question to drive engagement
- Include 3-5 relevant hashtags at the end
- Return the content in markdown format`,

      linkedin_post: `You are a social media specialist for Onshore Deliver — a premium yacht delivery logistics platform. Write engaging LinkedIn posts that drive engagement and visibility.

Guidelines:
- Hook in the first line (stop-the-scroll)
- Use line breaks for readability
- Include relevant emojis
- 150-300 words ideal
- End with a question or CTA to drive comments
- Include 3-5 relevant hashtags
- Return plain text (not markdown)`,

      instagram_post: `You are an Instagram content specialist for Onshore Deliver — a premium yacht delivery logistics platform. Write engaging Instagram captions.

Guidelines:
- Hook in the first line
- Tell a story or share insight
- Use emojis naturally throughout
- Include a clear CTA
- Add 15-20 relevant hashtags in a separate block at the end (mix of popular and niche yachting hashtags)
- Return plain text`,

      instagram_story: `Create a short, punchy Instagram story text overlay for Onshore Deliver (yacht delivery logistics). Keep it under 30 words. Include 1-2 emojis. Make it eye-catching and swipeable.`,
    }

    const systemPrompt = systemPrompts[type] || systemPrompts.email_campaign

    const messages = [
      { role: 'user' as const, content: context ? `Context: ${context}\n\nRequest: ${prompt}` : prompt }
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const errData = await response.text()
      console.error('Anthropic API error:', errData)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    return NextResponse.json({
      content,
      type,
      model: data.model,
      usage: data.usage,
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
