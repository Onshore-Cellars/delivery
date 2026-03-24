// ─── CLAUDE AI INTEGRATION ───────────────────────────────────────────────────
// Central AI service for all Claude-powered features in Onshore Deliver

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

const MODEL = 'claude-sonnet-4-6'
const FAST_MODEL = 'claude-haiku-4-5-20251001'

// ─── SUPPORTED LANGUAGES ────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  el: 'Ελληνικά',
  nl: 'Nederlands',
  de: 'Deutsch',
  pt: 'Português',
  tr: 'Türkçe',
  hr: 'Hrvatski',
  ar: 'العربية',
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

// ─── HELPER ─────────────────────────────────────────────────────────────────

async function ask(prompt: string, system: string, model = FAST_MODEL, maxTokens = 1024): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[AI] No ANTHROPIC_API_KEY set — returning empty')
    return ''
  }
  try {
    const msg = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = msg.content[0]
    return block.type === 'text' ? block.text : ''
  } catch (err) {
    console.error('[AI] Error:', err)
    return ''
  }
}

async function askJSON<T>(prompt: string, system: string, model = FAST_MODEL, maxTokens = 1024): Promise<T | null> {
  const raw = await ask(prompt, system + '\n\nRespond ONLY with valid JSON. No markdown, no explanation.', model, maxTokens)
  try {
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    console.error('[AI] JSON parse failed:', raw.slice(0, 200))
    return null
  }
}

// ─── 1. TRANSLATE ───────────────────────────────────────────────────────────

export async function translateText(text: string, targetLang: LanguageCode, sourceLang?: LanguageCode): Promise<string> {
  if (!text.trim()) return text
  const targetName = SUPPORTED_LANGUAGES[targetLang]
  const sourceName = sourceLang ? SUPPORTED_LANGUAGES[sourceLang] : 'auto-detected'
  return await ask(text, `You are a translator for a maritime logistics platform. Translate the user's message to ${targetName} (from ${sourceName}). Preserve technical terms (MMSI, LOA, berth, marina names). Return ONLY the translated text, nothing else.`)
}

export async function translateEmailContent(subject: string, htmlBody: string, textBody: string, targetLang: LanguageCode): Promise<{ subject: string; html: string; text: string }> {
  const result = await askJSON<{ subject: string; html: string; text: string }>(
    JSON.stringify({ subject, html: htmlBody, text: textBody }),
    `You are a translator for a maritime logistics platform. Translate the email content to ${SUPPORTED_LANGUAGES[targetLang]}. Preserve HTML tags exactly. Preserve brand names, tracking codes, URLs, and monetary amounts. Return JSON with keys: subject, html, text.`,
    FAST_MODEL, 4096
  )
  return result || { subject, html: htmlBody, text: textBody }
}

// ─── 2. CARGO CLASSIFIER ───────────────────────────────────────────────────

export interface CargoClassification {
  cargoType: string
  estimatedWeightKg: number | null
  estimatedVolumeM3: number | null
  suggestedInsuranceTier: 'basic' | 'standard' | 'premium'
  temperatureRequired: string | null
  isFragile: boolean
  isDangerous: boolean
  specialHandling: string | null
  warnings: string[]
}

export async function classifyCargo(description: string): Promise<CargoClassification | null> {
  return await askJSON<CargoClassification>(
    description,
    `You are a cargo classification AI for a yacht/marine delivery platform. Given a cargo description, analyze and return JSON:
{
  "cargoType": one of: "Provisions", "Wine", "Marine Equipment", "Electronics", "Luxury Goods", "Spare Parts", "Clothing", "Documents", "Hazardous Materials", "Fine Art", "General",
  "estimatedWeightKg": estimated weight or null,
  "estimatedVolumeM3": estimated volume or null,
  "suggestedInsuranceTier": "basic" | "standard" | "premium",
  "temperatureRequired": e.g. "2-8°C" for wine/food or null,
  "isFragile": boolean,
  "isDangerous": boolean,
  "specialHandling": brief note or null,
  "warnings": array of relevant warnings
}
Wine → premium insurance, 12-16°C. Electronics → standard, fragile. Food → basic/standard, may need refrigeration.
Be practical: a case of wine ≈ 15kg/0.02m³. An outboard motor ≈ 40kg/0.1m³.`
  )
}

// ─── 3. INSTANT QUOTE GENERATOR ─────────────────────────────────────────────

export interface AIQuoteEstimate {
  estimatedPrice: number
  currency: string
  priceBreakdown: { item: string; cost: number }[]
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  suggestedInsurancePremium: number | null
}

export async function generateQuoteEstimate(data: {
  origin: string
  destination: string
  distanceKm: number
  weightKg: number
  volumeM3: number
  cargoType: string
  vehicleType: string
  historicalAvgPerKg?: number
  historicalAvgPerM3?: number
  fuelCostEstimate?: number
}): Promise<AIQuoteEstimate | null> {
  return await askJSON<AIQuoteEstimate>(
    JSON.stringify(data),
    `You are a pricing AI for a European yacht logistics platform. Given route and cargo details, estimate a fair quote in EUR.
Consider: distance, fuel (~€0.30-0.50/km for vans), cargo type risk, vehicle type, historical pricing if provided.
Wine/luxury → premium. General provisions → standard pricing. Short routes (<100km) minimum €50.
Return JSON: { "estimatedPrice": number, "currency": "EUR", "priceBreakdown": [{"item":"Fuel","cost":X},...], "confidence": "low"|"medium"|"high", "reasoning": "brief", "suggestedInsurancePremium": number|null }`,
    MODEL
  )
}

// ─── 4. LISTING DESCRIPTION WRITER ──────────────────────────────────────────

export async function generateListingDescription(data: {
  origin: string
  destination: string
  vehicleType: string
  vehicleName?: string
  departureDate: string
  capacityKg: number
  capacityM3: number
  hasRefrigeration: boolean
  hasTailLift: boolean
  routeDirection: string
  acceptedCargo?: string
  returnNotes?: string
}): Promise<string> {
  return await ask(
    JSON.stringify(data),
    `You are a copywriter for a yacht/marine logistics marketplace. Write a compelling, professional listing description (2-3 sentences max). Highlight key selling points: vehicle features, route, capacity. Mention return leg deals if applicable. Be concise and professional. No emojis. No markdown.`,
  )
}

// ─── 5. DISPUTE RESOLUTION ASSISTANT ────────────────────────────────────────

export interface DisputeAssessment {
  summary: string
  suggestedResolution: string
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  refundRecommendation: 'none' | 'partial' | 'full'
  refundPercentage: number | null
  reasoning: string
  additionalInfoNeeded: string[]
}

export async function assessDispute(data: {
  disputeType: string
  description: string
  claimAmount: number | null
  bookingTotal: number
  cargoDescription: string
  trackingEvents: { status: string; description: string; timestamp: string }[]
  messages: string[]
}): Promise<DisputeAssessment | null> {
  return await askJSON<DisputeAssessment>(
    JSON.stringify(data),
    `You are a dispute resolution AI for a logistics platform. Analyze the dispute and provide a fair assessment.
Consider: dispute type, evidence from tracking events, communication history, claim amount vs booking total.
DAMAGE: check if carrier followed special handling. LATE: check tracking timeline vs promised ETA. LOSS: full refund likely.
Return JSON: { "summary": "brief", "suggestedResolution": "action to take", "suggestedPriority": "LOW"|"MEDIUM"|"HIGH"|"URGENT", "refundRecommendation": "none"|"partial"|"full", "refundPercentage": number|null, "reasoning": "why", "additionalInfoNeeded": ["list of questions"] }`,
    MODEL, 2048
  )
}

// ─── 6. CONSOLIDATION RECOMMENDER ───────────────────────────────────────────

export interface ConsolidationRecommendation {
  recommendation: string
  estimatedSavings: string
  consolidationScore: number
  steps: string[]
}

export async function recommendConsolidation(data: {
  bookings: { id: string; origin: string; destination: string; weightKg: number; volumeM3: number; date: string }[]
  availableListings: { id: string; origin: string; destination: string; availableKg: number; availableM3: number; date: string; pricePerKg: number | null; flatRate: number | null }[]
}): Promise<ConsolidationRecommendation | null> {
  return await askJSON<ConsolidationRecommendation>(
    JSON.stringify(data),
    `You are a logistics optimization AI. Given pending bookings and available carrier listings, recommend the best consolidation strategy.
Match bookings to carriers by route proximity and date. Calculate estimated savings vs individual shipping.
Return JSON: { "recommendation": "human-readable summary", "estimatedSavings": "€XX", "consolidationScore": 0-100, "steps": ["step 1", "step 2"] }`,
    MODEL
  )
}

// ─── 7. REVIEW SUMMARIZER ───────────────────────────────────────────────────

export interface ReviewSummary {
  overallSentiment: 'positive' | 'mixed' | 'negative'
  summary: string
  strengths: string[]
  weaknesses: string[]
  bestFor: string
}

export async function summarizeReviews(reviews: { rating: number; comment: string; communicationRating?: number; timelinessRating?: number; conditionRating?: number }[]): Promise<ReviewSummary | null> {
  if (reviews.length < 3) return null
  return await askJSON<ReviewSummary>(
    JSON.stringify(reviews),
    `You are a review analysis AI for a logistics platform. Summarize the carrier's reviews into a helpful profile.
Return JSON: { "overallSentiment": "positive"|"mixed"|"negative", "summary": "2-3 sentence summary", "strengths": ["list"], "weaknesses": ["list"], "bestFor": "what they're best at" }`,
  )
}

// ─── 8. HELP CHAT ───────────────────────────────────────────────────────────

export async function helpChat(userMessage: string, userRole: string, conversationHistory: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return 'AI assistant is not configured. Please contact support.'
  try {
    const messages = [
      ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userMessage },
    ]
    const msg = await client.messages.create({
      model: FAST_MODEL,
      max_tokens: 1024,
      system: `You are the Onshore Deliver support assistant. You help users of a maritime logistics marketplace that connects carriers (van drivers with spare capacity) with shippers (suppliers, yacht owners, crew) who need goods delivered to ports, marinas, and yachts across Europe.

Key features you can help with:
- Browsing and booking van space (marketplace at /marketplace)
- Creating listings for available capacity (carriers at /listings/create)
- Tracking deliveries (at /tracking)
- Managing bookings and payments (Stripe, at /dashboard)
- Messaging between carriers and shippers (/messages)
- Quote requests and bidding
- Insurance (basic 0.8%, standard 1.5%, premium 2.5% of declared value)
- Vehicle and document verification
- Return leg bookings (discounted empty-leg capacity)
- Saved alerts for new matching listings
- Route corridor matching (flexible carriers who detour for pickups)
- MMSI/IMO vessel tracking for yacht owners
- Community forum (/community)

The user's role is: ${userRole}. Tailor your answers accordingly.
Be concise, helpful, and friendly. If you don't know something specific to their account, direct them to the relevant page.`,
      messages,
    })
    const block = msg.content[0]
    return block.type === 'text' ? block.text : 'Sorry, I could not generate a response.'
  } catch (err) {
    console.error('[AI] Help chat error:', err)
    return 'Sorry, the AI assistant is temporarily unavailable. Please try again.'
  }
}

// ─── 9. NATURAL LANGUAGE SEARCH ─────────────────────────────────────────────

export interface ParsedSearch {
  originPort: string | null
  destinationPort: string | null
  cargoType: string | null
  dateFrom: string | null
  dateTo: string | null
  maxPrice: number | null
  minCapacityKg: number | null
  vehicleType: string | null
  needsRefrigeration: boolean
  direction: 'outbound' | 'return' | 'both' | null
}

export async function parseNaturalLanguageSearch(query: string): Promise<ParsedSearch | null> {
  return await askJSON<ParsedSearch>(
    query,
    `You are a search query parser for a European yacht logistics marketplace. Parse the natural language search into structured filters.
Known ports: Antibes, Nice, Cannes, Monaco, Saint-Tropez, Marseille, Barcelona, Palma de Mallorca, Ibiza, Valencia, Genoa, La Spezia, Naples, Olbia, Cagliari, Athens, Piraeus, Mykonos, Corfu, Dubrovnik, Split, Montenegro, Malta, Gibraltar, Amsterdam, Rotterdam, Hamburg, Southampton, Porto Cervo, Portofino, Toulon.
Vehicle types: Van, Truck, Refrigerated Van, Sprinter, Luton Van.
Return JSON: { "originPort": string|null, "destinationPort": string|null, "cargoType": string|null, "dateFrom": ISO date|null, "dateTo": ISO date|null, "maxPrice": number|null, "minCapacityKg": number|null, "vehicleType": string|null, "needsRefrigeration": boolean, "direction": "outbound"|"return"|"both"|null }
"next week" = 7 days from today (${new Date().toISOString().split('T')[0]}). "cheap" = maxPrice 100-150. "wine" → needsRefrigeration: true, cargoType: "Wine".`,
  )
}

// ─── 10. ADMIN INSIGHTS ─────────────────────────────────────────────────────

export interface AdminInsights {
  highlights: string[]
  anomalies: string[]
  recommendations: string[]
}

export async function generateAdminInsights(stats: {
  totalUsers: number
  newUsersThisWeek: number
  activeListings: number
  bookingsThisWeek: number
  bookingsLastWeek: number
  revenueThisWeek: number
  revenueLastWeek: number
  topRoutes: { origin: string; destination: string; count: number }[]
  openDisputes: number
  avgRating: number
}): Promise<AdminInsights | null> {
  return await askJSON<AdminInsights>(
    JSON.stringify(stats),
    `You are a business analytics AI for a yacht logistics marketplace. Analyze the dashboard stats and provide actionable insights.
Flag significant changes (>20% week-over-week). Note busy routes. Suggest actions.
Return JSON: { "highlights": ["3-5 key metrics"], "anomalies": ["anything unusual"], "recommendations": ["2-3 actions"] }
Keep each item to 1 sentence. Be specific with numbers.`,
    MODEL
  )
}

// ─── 11. ALERT EMAIL GENERATOR ──────────────────────────────────────────────

export async function generateAlertEmail(data: {
  userName: string
  listingTitle: string
  originPort: string
  destinationPort: string
  departureDate: string
  vehicleType: string
  capacityKg: number
  capacityM3: number
  pricePerKg: number | null
  flatRate: number | null
  currency: string
  hasRefrigeration: boolean
  listingType: string
  alertName: string | null
}): Promise<{ subject: string; body: string } | null> {
  return await askJSON<{ subject: string; body: string }>(
    JSON.stringify(data),
    `You are the Onshore Delivery platform email assistant. Write a SHORT, professional email notifying a user about a new listing that matches their saved alert. Be concise (3-4 sentences max). Include the key details: route, date, capacity, price. End with a call to action to view the listing. Do NOT use emojis. Return JSON with 'subject' and 'body' fields.`,
    FAST_MODEL,
    512
  )
}

// ─── 12. SMART ALERT MATCHING WITH RETURN LEG LOGIC ─────────────────────────

export interface SmartAlertMatch {
  matchScore: number
  matchReasons: string[]
  isReturnLegOpportunity: boolean
  returnLegSavings: string | null
}

export async function evaluateSmartAlertMatch(alert: {
  originPort: string | null
  destinationPort: string | null
  radiusKm: number
  direction: string | null
  cargoType: string | null
}, listing: {
  originPort: string
  destinationPort: string
  routeDirection: string
  returnAvailableKg: number | null
  returnPricePerKg: number | null
  pricePerKg: number | null
  flatRate: number | null
  distanceFromAlertOriginKm: number | null
  distanceFromAlertDestKm: number | null
  acceptedCargo: string | null
}): Promise<SmartAlertMatch | null> {
  return await askJSON<SmartAlertMatch>(
    JSON.stringify({ alert, listing }),
    `You are a logistics matching AI. Evaluate how well a listing matches a user's saved alert.
Score 0-100. Consider: route proximity, direction match, cargo type match, return leg opportunities.
Return leg logic: if the listing has RETURN or BOTH direction and the alert is looking from the listing's destination area back toward its origin, that's a return leg opportunity with typically 30-50% lower pricing.
If the listing's origin is within the alert's radius of the alert's destination, and it's heading back, flag it as a return leg opportunity.
Return JSON: { "matchScore": 0-100, "matchReasons": ["why it matches"], "isReturnLegOpportunity": boolean, "returnLegSavings": "~30-40% cheaper" or null }`
  )
}
// ─── CRM ASSISTANT ──────────────────────────────────────────────────────────

export interface CrmAssistantResponse {
  reply: string
  actions?: CrmAction[]
}

export interface CrmAction {
  type: 'draft_email' | 'draft_campaign' | 'suggest_contacts' | 'edit_signature' | 'segment_contacts' | 'draft_followup' | 'analyze_contacts'
  label: string
  data: Record<string, unknown>
}

export async function crmAssistant(
  message: string,
  context: {
    contactCount: number
    categories: string[]
    recentCampaigns: string[]
    signature?: string
    selectedContacts?: Array<{ name: string; email?: string; phone?: string; category: string; priority: string; country?: string; notes?: string }>
  }
): Promise<CrmAssistantResponse | null> {
  const systemPrompt = `You are the AI assistant for the Onshore Delivery CRM — a logistics and delivery platform serving the EU and UK.
You help the admin manage contacts, draft emails, plan campaigns, and grow the business.

CONTEXT:
- Total contacts: ${context.contactCount}
- Categories: ${context.categories.join(', ') || 'none yet'}
- Recent campaigns: ${context.recentCampaigns.join(', ') || 'none yet'}
- Email signature: ${context.signature || 'Not set'}
${context.selectedContacts?.length ? `- Selected contacts: ${JSON.stringify(context.selectedContacts)}` : ''}

CAPABILITIES — you can suggest these actions (the admin will approve before anything is sent):
1. draft_email — Draft a personalized email. Include { subject, body, to } in data. Use {{name}} for personalization. Always include the signature.
2. draft_campaign — Draft a bulk campaign. Include { name, subject, htmlBody, targetCategory, targetPriority } in data.
3. suggest_contacts — Suggest which contacts to reach out to. Include { reason, filters } in data.
4. edit_signature — Suggest a professional email signature. Include { html } in data.
5. segment_contacts — Suggest contact segments/tags for better targeting. Include { segments } in data.
6. draft_followup — Draft a follow-up email based on context. Include { subject, body } in data.
7. analyze_contacts — Analyze the contact database and give insights. Include { insights } in data.

RULES:
- Be concise, professional, and action-oriented.
- Always suggest specific actions the admin can approve/edit/send.
- When drafting emails, write warm, professional copy. Not salesy — helpful and genuine.
- Use the Onshore Delivery brand voice: professional, friendly, Mediterranean expertise.
- If the admin asks to send something, draft it and present for approval — never claim you sent it.
- For HTML emails, use simple inline styles. Keep it clean and professional.
- The signature should be appended to all emails.

Return JSON: { "reply": "your conversational response", "actions": [{ "type": "...", "label": "button label", "data": {...} }] }
The reply is shown as chat text. Actions become buttons the admin can review and approve.`

  return await askJSON<CrmAssistantResponse>(
    message,
    systemPrompt,
    MODEL,
    4096
  )
}

// ─── AI CONTENT MODERATION ──────────────────────────────────────────────────

export interface ModerationResult {
  flagged: boolean
  reason: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  explanation: string
  categories: string[]
}

export async function moderateContent(
  content: string,
  entityType: string,
  context?: { userName?: string; conversationSubject?: string }
): Promise<ModerationResult | null> {
  const systemPrompt = `You are a content moderation AI for Onshore Delivery — a logistics and delivery platform for the EU and UK marine/yacht industry.

Analyze the content for:
1. **Profanity / Foul language** — swearing, slurs, offensive language
2. **Platform circumvention** — attempts to arrange deals off-platform, share personal contact info to bypass fees
3. **Scam indicators** — suspicious offers, phishing, too-good-to-be-true deals, advance fee requests
4. **Harassment / Threats** — aggressive, threatening, or intimidating language
5. **Spam** — irrelevant promotional content, repetitive messages
6. **Fraud indicators** — fake documents, identity misrepresentation, payment fraud signals
7. **Discriminatory content** — racism, sexism, or other discriminatory language

Context: Entity type is "${entityType}".${context?.userName ? ` User: ${context.userName}.` : ''}${context?.conversationSubject ? ` Conversation: ${context.conversationSubject}.` : ''}

IMPORTANT:
- Be practical — normal business discussion about prices, routes, and logistics is fine
- Legitimate phone/email sharing in listing descriptions by carriers is acceptable
- Only flag genuinely problematic content
- Score confidence 0.0 to 1.0

Return JSON:
{
  "flagged": boolean,
  "reason": "profanity" | "circumvention" | "scam" | "harassment" | "spam" | "fraud" | "discrimination" | null,
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation of why this was flagged or why it's clean",
  "categories": ["list", "of", "matched", "categories"]
}`

  return await askJSON<ModerationResult>(content, systemPrompt, FAST_MODEL, 512)
}

// ─── AI NOTIFICATION TEMPLATE GENERATOR ─────────────────────────────────────

export async function generateNotificationTemplate(
  eventType: string,
  channel: 'email' | 'push' | 'sms',
  brandVoice?: string
): Promise<{ subject?: string; htmlBody?: string; pushTitle?: string; pushBody?: string; smsBody?: string } | null> {
  const systemPrompt = `You are a notification copywriter for Onshore Delivery — a logistics platform for the EU/UK.
Brand voice: ${brandVoice || 'Professional, warm, Mediterranean expertise. Not salesy — helpful and genuine.'}

Generate a notification template for the "${eventType}" event on the "${channel}" channel.
Use template variables: {{userName}}, {{trackingCode}}, {{origin}}, {{destination}}, {{status}}, {{amount}}, {{date}}, {{itemDescription}}, {{carrierName}}, {{shipperName}}.

Return JSON based on channel:
- email: { "subject": "...", "htmlBody": "<html>..." }
- push: { "pushTitle": "...", "pushBody": "..." }
- sms: { "smsBody": "... (max 160 chars)" }`

  return await askJSON(eventType, systemPrompt, FAST_MODEL, 2048)
}

// ─── AI SOCIAL POST GENERATOR ───────────────────────────────────────────────

export interface GeneratedSocialPost {
  content: string
  hashtags: string
  type: string
  topic: string
  reasoning: string
  confidence: number
}

export async function generateSocialPost(
  platform: string,
  topic?: string,
  tone?: string
): Promise<GeneratedSocialPost | null> {
  const systemPrompt = `You are a social media content creator for Onshore Delivery — a maritime logistics and delivery platform for the EU/UK yacht and marine industry.

BRAND:
- Professional, warm, Mediterranean expertise
- Services: cargo delivery to yachts/marinas/shipyards, provisioning delivery, chandlery, spare parts
- Routes across Mediterranean, UK south coast, Balearics, French Riviera, Adriatic, Greek islands
- Audience: yacht owners, captains, crew, marine industry professionals, provisioning companies

PLATFORM: ${platform}
${platform === 'linkedin' ? 'Professional tone. Industry insights, company updates, thought leadership. 200-300 words.' : ''}
${platform === 'instagram' ? 'Visual, engaging. Short punchy captions. Emoji use. 100-200 words. Include call-to-action.' : ''}

TONE: ${tone || 'professional yet approachable'}
${topic ? `TOPIC: ${topic}` : 'Choose a relevant topic for the marine logistics industry.'}

Return JSON:
{
  "content": "the post text",
  "hashtags": "#OnshoreDelivery #MarineLogistics ...",
  "type": "post",
  "topic": "brief topic label",
  "reasoning": "why this post would perform well",
  "confidence": 0.0-1.0
}`

  return await askJSON<GeneratedSocialPost>(
    topic || 'Generate an engaging social media post',
    systemPrompt,
    MODEL,
    2048
  )
}

// ─── AI CAMPAIGN DRAFT GENERATOR ────────────────────────────────────────────

export interface GeneratedCampaign {
  name: string
  subject: string
  htmlBody: string
  reasoning: string
  confidence: number
}

export async function generateCampaignDraft(
  goal: string,
  targetCategory?: string,
  context?: {
    contactCount: number
    categories: Array<{ name: string; count: number }>
    recentCampaigns: Array<{ name: string; status: string; sentCount: number; subject: string }>
    recentSocialPosts?: Array<{ platform: string; content: string; status: string }>
  }
): Promise<GeneratedCampaign | null> {
  const systemPrompt = `You are an email marketing expert for Onshore Delivery — a maritime logistics platform for EU/UK yacht and marine industry.

BRAND VOICE: Professional, warm, Mediterranean expertise. Not salesy — helpful and genuine.
GOAL: ${goal}
${targetCategory ? `TARGET AUDIENCE: ${targetCategory}` : ''}

${context ? `CONTEXT:
- ${context.contactCount} total contacts
- Categories: ${context.categories.map(c => `${c.name} (${c.count})`).join(', ')}
- Recent campaigns: ${context.recentCampaigns.map(c => `"${c.subject}" [${c.status}]`).join(', ') || 'none'}` : ''}

Create an email campaign. Use {{name}} for personalization.
Write clean HTML with inline styles. Use Onshore Delivery brand colors (#C6904D gold, #1d1d1f dark).
Include a clear call-to-action button.

Return JSON:
{
  "name": "campaign name",
  "subject": "email subject line",
  "htmlBody": "<html email body with inline styles>",
  "reasoning": "why this campaign approach",
  "confidence": 0.0-1.0
}`

  return await askJSON<GeneratedCampaign>(goal, systemPrompt, MODEL, 4096)
}

// ─── AI FOLLOW-UP SUGGESTIONS ───────────────────────────────────────────────

export interface FollowUpSuggestions {
  suggestions: Array<{
    contactId: string
    contactName: string
    email: string
    subject: string
    body: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>
}

export async function generateFollowUpSuggestions(
  contacts: Array<{
    id: string; name: string; email: string | null; category: string
    priority: string; country: string | null; notes: string | null; lastEmailed: Date | null
  }>
): Promise<FollowUpSuggestions | null> {
  const systemPrompt = `You are a CRM assistant for Onshore Delivery — a maritime logistics platform.

Analyze these contacts and suggest follow-up emails for the most important ones.
Consider: priority, how long since last contact, their category, and any notes.

Brand voice: Professional, warm, Mediterranean expertise.
Use {{name}} placeholder — it will be replaced with the contact's actual name.
Emails should be personalized based on their category and notes.

Return JSON:
{
  "suggestions": [
    {
      "contactId": "id",
      "contactName": "name",
      "email": "email",
      "subject": "email subject",
      "body": "<html email body>",
      "reason": "why follow up now",
      "priority": "high|medium|low"
    }
  ]
}`

  const contactSummary = contacts
    .filter(c => c.email)
    .map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      category: c.category,
      priority: c.priority,
      country: c.country,
      notes: c.notes?.slice(0, 100),
      lastEmailed: c.lastEmailed?.toISOString() || 'never',
    }))

  return await askJSON<FollowUpSuggestions>(
    JSON.stringify(contactSummary),
    systemPrompt,
    MODEL,
    4096
  )
}

// ─── AI CONTACT DATABASE ANALYSIS ───────────────────────────────────────────

export interface ContactAnalysis {
  summary: string
  insights: string[]
  recommendations: string[]
  segments: Array<{ name: string; description: string; filters: Record<string, string> }>
  gaps: string[]
}

export async function analyzeContactDatabase(
  context: {
    contactCount: number
    categories: Array<{ name: string; count: number }>
    recentCampaigns: Array<{ name: string; status: string; sentCount: number; subject: string }>
    recentSocialPosts?: Array<{ platform: string; content: string; status: string; impressions: number; likes: number }>
  }
): Promise<ContactAnalysis | null> {
  const systemPrompt = `You are a CRM strategist for Onshore Delivery — a maritime logistics platform for the EU/UK yacht industry.

Analyze the contact database and provide actionable insights.

Return JSON:
{
  "summary": "brief overview of the database health",
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", ...],
  "segments": [{ "name": "segment name", "description": "who's in this segment", "filters": { "category": "...", "priority": "..." } }],
  "gaps": ["gap or missing opportunity 1", ...]
}`

  return await askJSON<ContactAnalysis>(
    JSON.stringify(context),
    systemPrompt,
    MODEL,
    4096
  )
}