import { NextRequest, NextResponse } from 'next/server'
import { estimateInsurance, cargoCategories } from '@/lib/insurance'

// GET /api/insurance?value=5000&category=wine&crossBorder=true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const value = parseFloat(searchParams.get('value') || '0')
  const category = searchParams.get('category') || 'marine_equipment'
  const crossBorder = searchParams.get('crossBorder') === 'true'

  if (!value || value <= 0) {
    return NextResponse.json({ error: 'Declared value must be positive' }, { status: 400 })
  }

  const estimates = estimateInsurance(value, category, crossBorder)

  return NextResponse.json({
    estimates,
    categories: cargoCategories,
    declaredValue: value,
    currency: 'GBP',
  })
}
