'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthProvider'
import Link from 'next/link'

interface EarningsData {
  totalRevenue: number
  totalBookings: number
  completedDeliveries: number
  pendingPayouts: number
  currency: string
  recentBookings: {
    id: string
    trackingCode?: string
    cargoDescription?: string
    totalPrice: number
    carrierPayout: number
    platformFee: number
    currency: string
    status: string
    createdAt: string
    shipper: { name: string }
  }[]
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  DISPUTED: 'bg-red-100 text-red-600',
}

export default function EarningsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEarnings = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/bookings?role=carrier&limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const result = await res.json()
        const bookings = result.bookings || []
        const completed = bookings.filter((b: { status: string }) => b.status === 'DELIVERED')
        const pending = bookings.filter((b: { status: string }) => ['CONFIRMED', 'PICKED_UP', 'IN_TRANSIT'].includes(b.status))

        setData({
          totalRevenue: completed.reduce((s: number, b: { carrierPayout: number }) => s + (b.carrierPayout || 0), 0),
          totalBookings: bookings.length,
          completedDeliveries: completed.length,
          pendingPayouts: pending.reduce((s: number, b: { carrierPayout: number }) => s + (b.carrierPayout || 0), 0),
          currency: bookings[0]?.currency || 'EUR',
          recentBookings: bookings.slice(0, 20),
        })
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchEarnings() }, [fetchEarnings])

  if (authLoading) return <div className="min-h-screen bg-[#faf9f7]" />
  if (!user) return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <p className="text-slate-500">Please <Link href="/login" className="text-[#C6904D]">sign in</Link></p>
    </div>
  )

  const fmt = (amount: number, currency: string) => {
    const sym = currency === 'GBP' ? '\u00A3' : currency === 'EUR' ? '\u20AC' : '$'
    return `${sym}${amount.toFixed(2)}`
  }

  return (
    <div id="main-content" className="min-h-screen bg-[#faf9f7] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Earnings</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-lg border border-[#e8e4de] animate-pulse" />)}
          </div>
        ) : !data || data.totalBookings === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-[#e8e4de]">
            <p className="text-slate-500 mb-2">No earnings yet</p>
            <p className="text-xs text-slate-400 mb-4">Complete deliveries to start earning</p>
            <Link href="/marketplace" className="text-[#C6904D] font-medium hover:underline">Browse available bookings</Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-[#e8e4de] p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">{fmt(data.totalRevenue, data.currency)}</p>
              </div>
              <div className="bg-white rounded-lg border border-[#e8e4de] p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Pending Payout</p>
                <p className="text-2xl font-bold text-amber-600">{fmt(data.pendingPayouts, data.currency)}</p>
              </div>
              <div className="bg-white rounded-lg border border-[#e8e4de] p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Deliveries</p>
                <p className="text-2xl font-bold text-[#1a1a1a]">{data.completedDeliveries}</p>
              </div>
              <div className="bg-white rounded-lg border border-[#e8e4de] p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-[#1a1a1a]">{data.totalBookings}</p>
              </div>
            </div>

            {/* Recent Bookings */}
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Recent Bookings</h2>
            <div className="bg-white rounded-lg border border-[#e8e4de] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e4de] bg-[#faf9f7]">
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Booking</th>
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Shipper</th>
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Total</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Your Payout</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentBookings.map(b => (
                      <tr key={b.id} className="border-b border-[#e8e4de] last:border-0 hover:bg-[#faf9f7]">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#1a1a1a]">{b.trackingCode || b.id.slice(0, 8)}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">{b.cargoDescription}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{b.shipper?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-slate-100 text-slate-500'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{fmt(b.totalPrice, b.currency)}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">{fmt(b.carrierPayout, b.currency)}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
