/**
 * AIS Vessel Tracking via AISStream.io (free WebSocket API)
 *
 * Usage: Sign up at https://aisstream.io for a free API key.
 * Set env var: AISSTREAM_API_KEY
 *
 * Yachts transmit AIS every 2-30 seconds when moving, 3 minutes when anchored.
 */

export interface VesselPosition {
  mmsi: string
  name: string
  imo?: string
  lat: number
  lng: number
  speed: number      // knots
  course: number     // degrees
  heading: number    // degrees
  destination?: string
  eta?: string
  timestamp: string
}

/**
 * Get tracking URLs for a vessel by MMSI
 * These work without API keys - direct links to tracking sites
 */
export function getVesselTrackingURLs(mmsi: string) {
  return {
    marineTraffic: `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsi}`,
    vesselFinder: `https://www.vesselfinder.com/vessels?name=&mmsi=${mmsi}`,
    myShipTracking: `https://www.myshiptracking.com/vessels?mmsi=${mmsi}`,
    marineVesselTraffic: `https://www.marinevesseltraffic.com/2013/02/mmaritime-ede-vessel-702702000.html?mmsi=${mmsi}`,
  }
}

/**
 * Create an AISStream WebSocket subscription message
 * Use this client-side to connect to AISStream.io
 */
export function createAISSubscription(mmsis: string[], apiKey: string) {
  return {
    Apikey: apiKey,
    BoundingBoxes: [[[-90, -180], [90, 180]]], // Global
    FiltersShipMMSI: mmsis,
    FilterMessageTypes: ['PositionReport'],
  }
}

/**
 * Parse an AISStream position report message
 */
export function parseAISMessage(message: Record<string, unknown>): VesselPosition | null {
  try {
    const meta = message.MetaData as Record<string, unknown>
    const pos = message.Message as Record<string, unknown>
    const report = pos?.PositionReport as Record<string, unknown>

    if (!meta || !report) return null

    return {
      mmsi: String(meta.MMSI || ''),
      name: String(meta.ShipName || '').trim(),
      lat: Number(report.Latitude) || 0,
      lng: Number(report.Longitude) || 0,
      speed: Number(report.Sog) || 0,
      course: Number(report.Cog) || 0,
      heading: Number(report.TrueHeading) || 0,
      timestamp: String(meta.time_utc || new Date().toISOString()),
    }
  } catch {
    return null
  }
}

/**
 * AISStream WebSocket URL
 */
export const AISSTREAM_WS_URL = 'wss://stream.aisstream.io/v0/stream'
