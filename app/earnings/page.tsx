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
  PENDING: 'bg-[#FF6A2A]/15 text-[#FF6A2A]',
  CONFIRMED: 'bg-blue-100 text-[#268CB5]',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-[#9ED36A]/15 text-[#9ED36A]',
  CANCELLED: 'bg-[#102535] text-[#6B7C86]',
  DISPUTED: 'bg-red-100 text-red-400',
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

  if (authLoading) return <div className="min-h-screen bg-[#0B1F2A]" />
  if (!user) return (
    <div className="min-h-screen bg-[#0B1F2A] flex items-center justify-center">
      <p className="text-[#6B7C86]">Please <Link href="/login" className="text-[#FF6A2A]">sign in</Link></p>
    </div>
  )

  const fmt = (amount: number, currency: string) => {
    const sym = currency === 'GBP' ? '\u00A3' : currency === 'EUR' ? '\u20AC' : '$'
    return `${sym}${amount.toFixed(2)}`
  }

  return (
    <div id="main-content" className="min-h-screen bg-[#0B1F2A] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#F7F9FB] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Earnings</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#162E3D] rounded-lg border border-white/10 animate-pulse" />)}
          </div>
        ) : !data || data.totalBookings === 0 ? (
          <div className="text-center py-16 bg-[#162E3D] rounded-lg border border-white/10">
            <p className="text-[#6B7C86] mb-2">No earnings yet</p>
            <p className="text-xs text-slate-400 mb-4">Complete deliveries to start earning</p>
            <Link href="/marketplace" className="text-[#FF6A2A] font-medium hover:underline">Browse available bookings</Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#162E3D] rounded-lg border border-white/10 p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-[#9ED36A]">{fmt(data.totalRevenue, data.currency)}</p>
              </div>
              <div className="bg-[#162E3D] rounded-lg border border-white/10 p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Pending Payout</p>
                <p className="text-2xl font-bold text-[#FF6A2A]">{fmt(data.pendingPayouts, data.currency)}</p>
              </div>
              <div className="bg-[#162E3D] rounded-lg border border-white/10 p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Deliveries</p>
                <p className="text-2xl font-bold text-[#F7F9FB]">{data.completedDeliveries}</p>
              </div>
              <div className="bg-[#162E3D] rounded-lg border border-white/10 p-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-[#F7F9FB]">{data.totalBookings}</p>
              </div>
            </div>

            {/* Recent Bookings */}
            <h2 className="text-lg font-semibold text-[#F7F9FB] mb-4">Recent Bookings</h2>
            <div className="bg-[#162E3D] rounded-lg border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#0B1F2A]">
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#6B7C86] uppercase">Booking</th>
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#6B7C86] uppercase">Shipper</th>
                      <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-[#6B7C86] uppercase">Status</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-[#6B7C86] uppercase">Total</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-[#6B7C86] uppercase">Your Payout</th>
                      <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-[#6B7C86] uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentBookings.map(b => (
                      <tr key={b.id} className="border-b border-white/10 last:border-0 hover:bg-[#0B1F2A]">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#F7F9FB]">{b.trackingCode || b.id.slice(0, 8)}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">{b.cargoDescription}</div>
                        </td>
                        <td className="px-4 py-3 text-[#9AADB8]">{b.shipper?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-[#102535] text-[#6B7C86]'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[#9AADB8]">{fmt(b.totalPrice, b.currency)}</td>
                        <td className="px-4 py-3 text-right font-medium text-[#9ED36A]">{fmt(b.carrierPayout, b.currency)}</td>
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
