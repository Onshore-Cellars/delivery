import { NextRequest, NextResponse } from 'next/server'

// Google Places Autocomplete proxy — keeps API key server-side
// Set GOOGLE_PLACES_API_KEY in your .env

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ predictions: [] })
    }

    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')
    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    // Use Google Places Autocomplete API
    // Bias towards Europe for relevant results
    const params = new URLSearchParams({
      input,
      key: apiKey,
      types: 'establishment|geocode',
      components: 'country:fr|country:es|country:it|country:gr|country:hr|country:me|country:gb|country:pt|country:nl|country:de|country:mc|country:mt|country:cy|country:tr',
      language: 'en',
    })

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    )

    if (!res.ok) {
      return NextResponse.json({ predictions: [] })
    }

    const data = await res.json()

    // Map to simplified format
    const predictions = (data.predictions || []).map((p: {
      place_id: string
      description: string
      structured_formatting: { main_text: string; secondary_text: string }
      types: string[]
    }) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
      types: p.types || [],
    }))

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Places API error:', error)
    return NextResponse.json({ predictions: [] })
  }
}

// GET place details by place_id — returns full address components
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Places API not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { placeId } = body

    if (!placeId) {
      return NextResponse.json({ error: 'placeId required' }, { status: 400 })
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      fields: 'formatted_address,geometry,address_components,name',
    })

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 502 })
    }

    const data = await res.json()
    const result = data.result

    if (!result) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    // Extract address components
    const components = result.address_components || []
    const getComponent = (type: string) =>
      components.find((c: { types: string[] }) => c.types.includes(type))?.long_name || ''
    const getComponentShort = (type: string) =>
      components.find((c: { types: string[] }) => c.types.includes(type))?.short_name || ''

    return NextResponse.json({
      place: {
        name: result.name || '',
        address: result.formatted_address || '',
        city: getComponent('locality') || getComponent('postal_town') || getComponent('administrative_area_level_2'),
        region: getComponent('administrative_area_level_1'),
        country: getComponent('country'),
        countryCode: getComponentShort('country'),
        postcode: getComponent('postal_code'),
        lat: result.geometry?.location?.lat || null,
        lng: result.geometry?.location?.lng || null,
      },
    })
  } catch (error) {
    console.error('Place details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
