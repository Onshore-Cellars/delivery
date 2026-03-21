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

// ─── 11. SMART ALERT MATCHING WITH RETURN LEG LOGIC ─────────────────────────

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
