import prisma from './prisma'
import { platformVatConfig, toVatCountryCode, PlatformVatConfig } from './vat'

// Keys stored in the PlatformSetting table.
const KEYS = ['vatCountry', 'vatNumber', 'vatRegistered'] as const
type Key = typeof KEYS[number]

// Short in-process cache so we don't hit the DB on every VAT determination.
let cache: { at: number; rows: Record<string, string> } | null = null
const TTL_MS = 30_000

async function loadRows(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows
  try {
    const rows = await prisma.platformSetting.findMany({ where: { key: { in: KEYS as unknown as string[] } } })
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    cache = { at: Date.now(), rows: map }
    return map
  } catch {
    return cache?.rows ?? {}
  }
}

/**
 * The effective platform VAT config: DB settings when present, else the env
 * defaults (platformVatConfig from lib/vat). Injected into the VAT engine so
 * the establishment can be changed from the admin UI without a redeploy.
 */
export async function getPlatformVatConfig(): Promise<PlatformVatConfig> {
  const env = platformVatConfig()
  const rows = await loadRows()
  const country = rows.vatCountry ? (toVatCountryCode(rows.vatCountry) || env.country) : env.country
  const vatNumber = 'vatNumber' in rows ? (rows.vatNumber || null) : env.vatNumber
  const registered = 'vatRegistered' in rows ? rows.vatRegistered !== 'false' : env.registered
  return { country, vatNumber, registered }
}

/** Read the raw stored settings (for the admin UI), with env defaults shown. */
export async function getPlatformSettingsForAdmin() {
  const cfg = await getPlatformVatConfig()
  const rows = await loadRows()
  return {
    vatCountry: cfg.country,
    vatNumber: cfg.vatNumber || '',
    vatRegistered: cfg.registered,
    // Whether each value currently comes from the DB (overridden) or env.
    source: {
      vatCountry: rows.vatCountry ? 'db' : 'env',
      vatNumber: 'vatNumber' in rows ? 'db' : 'env',
      vatRegistered: 'vatRegistered' in rows ? 'db' : 'env',
    },
  }
}

/** Upsert platform VAT settings and bust the cache. */
export async function savePlatformVatSettings(input: { vatCountry?: string; vatNumber?: string; vatRegistered?: boolean }) {
  const writes: { key: Key; value: string }[] = []
  if (input.vatCountry !== undefined) {
    const code = toVatCountryCode(input.vatCountry)
    if (!code) throw new Error('Unrecognised VAT country')
    writes.push({ key: 'vatCountry', value: code })
  }
  if (input.vatNumber !== undefined) writes.push({ key: 'vatNumber', value: String(input.vatNumber).trim() })
  if (input.vatRegistered !== undefined) writes.push({ key: 'vatRegistered', value: input.vatRegistered ? 'true' : 'false' })

  for (const w of writes) {
    await prisma.platformSetting.upsert({
      where: { key: w.key },
      update: { value: w.value },
      create: { key: w.key, value: w.value },
    })
  }
  cache = null // invalidate
}
