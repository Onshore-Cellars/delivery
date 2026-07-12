'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'
import AvatarUpload from '../components/AvatarUpload'

interface ProfileData {
  id: string; email: string; name: string; role: string
  phone?: string; company?: string; bio?: string; website?: string
  address?: string; city?: string; country?: string; avatarUrl?: string
  canCarry: boolean; canShip: boolean
  termsAcceptedAt?: string; termsVersion?: string
  yachtName?: string; yachtMMSI?: string; yachtIMO?: string; yachtFlag?: string
  yachtLength?: number; yachtType?: string; homePort?: string
  preferredLanguage?: string
  emailNotifications: boolean; smsNotifications: boolean
  notifyBookings?: boolean; notifyPayments?: boolean; notifyBids?: boolean; notifyMessages?: boolean; notifyMarketing?: boolean; weeklyDigest?: boolean
  verified: boolean; createdAt: string; stripeAccountId?: string
  vatNumber?: string; vatNumberValid?: boolean | null; vatNumberCheckedAt?: string; vatBusinessName?: string; isBusiness?: boolean
  _count: { listings: number; bookings: number; receivedReviews: number; documents: number; vehicles: number }
}

interface RatingData { average: number; count: number }

export default function ProfilePage() {
  const { user, token, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [rating, setRating] = useState<RatingData>({ average: 0, count: 0 })
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string | boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [acceptingTerms, setAcceptingTerms] = useState(false)
  const [vatInput, setVatInput] = useState('')
  const [vatBusy, setVatBusy] = useState(false)
  const [vatResult, setVatResult] = useState<{ valid: boolean; name?: string | null; source: string; reason?: string } | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setRating(data.rating)
        setVatInput(data.user.vatNumber || '')
        setForm({
          name: data.user.name || '', phone: data.user.phone || '', company: data.user.company || '',
          bio: data.user.bio || '', website: data.user.website || '', address: data.user.address || '',
          city: data.user.city || '', country: data.user.country || '',
          canCarry: data.user.canCarry || false, canShip: data.user.canShip || true,
          yachtName: data.user.yachtName || '', yachtMMSI: data.user.yachtMMSI || '',
          yachtIMO: data.user.yachtIMO || '', yachtFlag: data.user.yachtFlag || '',
          yachtLength: data.user.yachtLength || '', yachtType: data.user.yachtType || '',
          homePort: data.user.homePort || '',
          preferredLanguage: data.user.preferredLanguage || 'en',
          emailNotifications: data.user.emailNotifications, smsNotifications: data.user.smsNotifications,
        })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    fetchProfile()
  }, [authLoading, user, router, fetchProfile])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true); setSuccess(''); setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess('Profile updated successfully')
        setEditing(false)
        fetchProfile()
        refreshUser()
      } else {
        setError('Failed to save profile. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to save profile. Please try again.')
    }
    finally { setSaving(false) }
  }

  if (authLoading || loading || !profile) {
    return <div className="flex items-center justify-center py-20"><div className="loading-shimmer w-64 h-8 rounded-lg" /></div>
  }

  return (
    <div className="page-container narrow">
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-[var(--c-accent)] uppercase tracking-[0.15em] mb-1">Account</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--c-ink)] tracking-[-0.02em]">Profile & Settings</h1>
        </div>

        {success && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-[var(--c-success)]/10 border border-[var(--c-success)]/40" role="status">
            <p className="text-sm text-[var(--c-success)] font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-[var(--c-error)]/10 border border-[var(--c-error)]/30" role="alert">
            <p className="text-sm text-[var(--c-error)] font-medium">{error}</p>
          </div>
        )}

        {!profile.termsAcceptedAt && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/20">
            <p className="text-sm text-[var(--c-accent)] font-medium mb-3">Please review and accept our updated Terms of Service and Privacy Policy to continue using Onshore Deliver.</p>
            <button
              disabled={acceptingTerms}
              onClick={async () => {
                if (!token) return
                setAcceptingTerms(true); setError('')
                try {
                  const res = await fetch('/api/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ termsAcceptedAt: new Date().toISOString(), termsVersion: '2026-03-01', privacyAcceptedAt: new Date().toISOString() }),
                  })
                  if (res.ok) {
                    setSuccess('Terms accepted successfully')
                    fetchProfile()
                  } else {
                    setError('Failed to accept terms. Please try again.')
                  }
                } catch {
                  setError('Failed to accept terms. Please try again.')
                }
                finally { setAcceptingTerms(false) }
              }}
              className="btn-primary text-sm !py-2 !px-5 disabled:opacity-50"
            >
              {acceptingTerms ? 'Accepting...' : 'Accept Terms'}
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[var(--c-surface)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <AvatarUpload
              currentUrl={profile.avatarUrl || undefined}
              name={profile.name}
              token={token || ''}
              onUpload={() => { fetchProfile(); refreshUser() }}
            />
            <div>
              <h2 className="text-xl font-bold text-[var(--c-ink)]">{profile.name}</h2>
              <p className="text-sm text-[var(--c-text-3)]">{profile.role.replace('_', ' ')}{profile.company && ` at ${profile.company}`}</p>
              <div className="flex items-center gap-3 mt-1">
                {rating.count > 0 && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating.average) ? 'text-[var(--c-accent)]' : 'text-[var(--c-text-3)]'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                    <span className="text-xs text-[var(--c-text-3)]">{rating.average.toFixed(1)} ({rating.count})</span>
                  </div>
                )}
                <span className="text-xs text-[var(--c-text-2)]">{profile._count.listings} listings &middot; {profile._count.bookings} bookings</span>
              </div>
            </div>
          </div>

          {!editing ? (
            <>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Email', profile.email],
                  ['Phone', profile.phone],
                  ['Company', profile.company],
                  ['City', profile.city],
                  ['Country', profile.country],
                  ['Website', profile.website],
                  ['Member since', new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-xs text-[var(--c-text-2)] uppercase tracking-wider">{label}</dt>
                    <dd className="text-sm font-medium text-[var(--c-ink)] mt-0.5">{value || '-'}</dd>
                  </div>
                ))}
              </dl>
              {profile.bio && <p className="mt-4 text-sm text-[var(--c-text-2)] leading-relaxed border-t border-[var(--c-border)] pt-4">{profile.bio}</p>}
              <button onClick={() => setEditing(true)} className="mt-6 btn-primary text-sm !py-2 !px-5">Edit Profile</button>
            </>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['name', 'Full Name', 'text'],
                  ['phone', 'Phone', 'tel'],
                  ['company', 'Company', 'text'],
                  ['city', 'City', 'text'],
                  ['country', 'Country', 'text'],
                  ['website', 'Website', 'url'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">{label}</label>
                    <input type={type} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-black/10 text-base sm:text-sm text-[var(--c-ink)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none" value={(form[key] as string) || ''} onChange={e => setForm({...form, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">Bio</label>
                <textarea rows={3} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-black/10 text-base sm:text-sm text-[var(--c-ink)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none resize-none" value={(form.bio as string) || ''} onChange={e => setForm({...form, bio: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary text-sm !py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 text-sm text-[var(--c-text-3)] hover:bg-[var(--c-canvas-2)] rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* VAT / Tax status */}
        <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[var(--c-ink)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>VAT / Tax status</h2>
          <p className="text-xs text-[var(--c-text-3)] mb-5">
            Add your business VAT number so invoices are issued correctly. EU numbers are verified live against the EU VIES service. With a valid EU VAT number, cross-border supplies are invoiced under the reverse-charge rule (no VAT charged).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">VAT number</label>
              <input
                type="text"
                placeholder="e.g. FR12345678901"
                className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-black/10 text-base sm:text-sm text-[var(--c-ink)] uppercase focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none"
                value={vatInput}
                onChange={e => { setVatInput(e.target.value); setVatResult(null) }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={vatBusy || !vatInput.trim()}
                onClick={async () => {
                  if (!token) return
                  setVatBusy(true); setVatResult(null); setError(''); setSuccess('')
                  try {
                    const res = await fetch('/api/vat/validate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ vatNumber: vatInput.trim() }),
                    })
                    const data = await res.json()
                    if (res.ok && data.result) {
                      setVatResult(data.result)
                      if (data.result.valid) setSuccess('VAT number verified and saved.')
                      await fetchProfile()
                    } else {
                      setError(data.error || 'Could not verify VAT number')
                    }
                  } catch { setError('Could not verify VAT number') }
                  finally { setVatBusy(false) }
                }}
                className="btn-primary text-sm !py-2.5 !px-5 disabled:opacity-50 whitespace-nowrap"
              >
                {vatBusy ? 'Checking…' : 'Verify & save'}
              </button>
              {profile.vatNumber && (
                <button
                  type="button"
                  disabled={vatBusy}
                  onClick={async () => {
                    if (!token) return
                    setVatBusy(true); setVatResult(null)
                    try {
                      await fetch('/api/vat/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ vatNumber: '' }),
                      })
                      setVatInput(''); setSuccess('VAT number removed.')
                      await fetchProfile()
                    } catch { setError('Could not remove VAT number') }
                    finally { setVatBusy(false) }
                  }}
                  className="px-4 py-2.5 text-sm text-[var(--c-text-3)] hover:bg-[var(--c-canvas-2)] rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {/* Current status */}
          {(vatResult || profile.vatNumber) && (
            <div className="mt-4 text-sm">
              {vatResult ? (
                vatResult.valid ? (
                  <div className="flex items-start gap-2 text-[var(--c-success)]">
                    <span>✓</span>
                    <span>
                      {vatResult.source === 'vies' ? 'Verified via EU VIES' : 'Format valid'}
                      {vatResult.name ? ` — ${vatResult.name}` : ''}
                      {vatResult.source === 'unavailable' ? ' (live check unavailable — accepted on format)' : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-[var(--c-error)]">
                    <span>✕</span>
                    <span>{vatResult.reason || 'This VAT number could not be validated.'}</span>
                  </div>
                )
              ) : (
                <div className="text-[var(--c-text-2)]">
                  On file: <span className="font-semibold text-[var(--c-ink)]">{profile.vatNumber}</span>
                  {profile.vatNumberValid === true && <span className="text-[var(--c-success)]"> · verified</span>}
                  {profile.vatBusinessName ? ` · ${profile.vatBusinessName}` : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification preferences */}
        <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[var(--c-ink)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Notification preferences</h2>
          <p className="text-xs text-[var(--c-text-3)] mb-5">Choose which emails you receive.</p>
          <div className="space-y-3">
            {([
              ['notifyBookings', 'Booking & delivery updates', 'Confirmations, status changes, proof of delivery'],
              ['notifyPayments', 'Payments & payouts', 'Receipts, carrier payouts, refunds'],
              ['notifyBids', 'Bids & quotes', 'New bids, counter-offers, quote requests'],
              ['notifyMessages', 'Messages', 'New direct messages'],
              ['weeklyDigest', 'Weekly digest', 'A summary of your activity each week'],
              ['notifyMarketing', 'Product news & tips', 'Occasional updates about Onshore'],
            ] as [keyof ProfileData, string, string][]).map(([key, label, desc]) => {
              const on = profile[key] !== false
              return (
                <div key={key as string} className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[var(--c-ink)]">{label}</div>
                    <div className="text-xs text-[var(--c-text-3)]">{desc}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={async () => {
                      if (!token) return
                      const next = !on
                      setProfile(p => p ? { ...p, [key]: next } : p)
                      try {
                        await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ [key]: next }) })
                      } catch { setProfile(p => p ? { ...p, [key]: on } : p) }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-canvas-2)]'}`}
                  >
                    <span className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-[var(--c-surface)] shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Role & Capabilities */}
        <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[var(--c-ink)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Role & Capabilities</h2>
          <p className="text-xs text-[var(--c-text-3)] mb-5">Toggle what you can do on the platform. You can both ship and carry.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--c-ink)]">I can carry / deliver</div>
                <div className="text-xs text-[var(--c-text-3)]">List van space, accept bookings, deliver goods to ports</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.canCarry as boolean} onChange={async () => {
                  const val = !form.canCarry
                  setForm({...form, canCarry: val})
                  setError('')
                  if (token) {
                    try {
                      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ canCarry: val }) })
                      if (res.ok) {
                        setSuccess('Capabilities updated')
                        refreshUser()
                      } else {
                        setForm({...form, canCarry: !val})
                        setError('Failed to update capability. Please try again.')
                      }
                    } catch {
                      setForm({...form, canCarry: !val})
                      setError('Failed to update capability. Please try again.')
                    }
                  }
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--c-canvas-2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--c-surface)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--c-accent)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--c-ink)]">I need deliveries / shipping</div>
                <div className="text-xs text-[var(--c-text-3)]">Book space, request quotes, receive goods at marina</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.canShip as boolean} onChange={async () => {
                  const val = !form.canShip
                  setForm({...form, canShip: val})
                  setError('')
                  if (token) {
                    try {
                      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ canShip: val }) })
                      if (res.ok) {
                        setSuccess('Capabilities updated')
                        refreshUser()
                      } else {
                        setForm({...form, canShip: !val})
                        setError('Failed to update capability. Please try again.')
                      }
                    } catch {
                      setForm({...form, canShip: !val})
                      setError('Failed to update capability. Please try again.')
                    }
                  }
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--c-canvas-2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--c-surface)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--c-accent)]"></div>
              </label>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-black/10">
            <div className="flex items-center gap-2 text-xs text-[var(--c-text-2)]">
              <span className="font-medium text-[var(--c-ink)]">Current role:</span>
              <span className="badge bg-[var(--c-accent)]/10 text-[var(--c-accent)]">{profile.role.replace('_', ' ')}</span>
              {form.canCarry && <span className="badge bg-[var(--c-success)]/10 text-[var(--c-success)]">Can Carry</span>}
              {form.canShip && <span className="badge bg-[var(--c-info)]/10 text-[var(--c-info)]">Can Ship</span>}
            </div>
          </div>
        </div>

        {/* Yacht / Vessel Details */}
        {(profile.role === 'YACHT_OWNER' || profile.role === 'CREW' || form.canShip) && (
          <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8 mb-6">
            <h2 className="font-semibold text-[var(--c-ink)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Yacht / Vessel Details</h2>
            <p className="text-xs text-[var(--c-text-3)] mb-5">Optional — helps carriers find your vessel and deliver to the right berth.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['yachtName', 'Vessel Name', 'text', 'e.g. MY Ocean Dream'],
                ['yachtType', 'Vessel Type', 'text', 'e.g. Motor Yacht'],
                ['yachtFlag', 'Flag State', 'text', 'e.g. Cayman Islands'],
                ['yachtLength', 'Length (m)', 'number', 'LOA in metres'],
                ['homePort', 'Home Port', 'text', 'e.g. Antibes'],
              ].map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[var(--c-ink)] mb-1.5 uppercase tracking-wider">{label}</label>
                  <input type={type} className="w-full px-4 py-2.5 rounded border border-black/10 text-sm text-[var(--c-ink)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none" placeholder={placeholder as string} value={(form[key] as string) || ''} onChange={e => setForm({...form, [key]: e.target.value})} />
                </div>
              ))}
              {/* MMSI & IMO — only shown for yacht accounts */}
              {(profile.role === 'YACHT_OWNER' || profile.role === 'CREW') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--c-ink)] mb-1.5 uppercase tracking-wider">MMSI Number</label>
                    <input type="text" className="w-full px-4 py-2.5 rounded border border-black/10 text-sm text-[var(--c-ink)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none" placeholder="9-digit MMSI" maxLength={9} value={(form.yachtMMSI as string) || ''} onChange={e => setForm({...form, yachtMMSI: e.target.value.replace(/\D/g, '').slice(0, 9)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--c-ink)] mb-1.5 uppercase tracking-wider">IMO Number</label>
                    <input type="text" className="w-full px-4 py-2.5 rounded border border-black/10 text-sm text-[var(--c-ink)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none" placeholder="IMO number" value={(form.yachtIMO as string) || ''} onChange={e => setForm({...form, yachtIMO: e.target.value})} />
                  </div>
                </>
              )}
            </div>
            <button onClick={async () => {
              if (!token) return
              setSaving(true); setError('')
              try {
                const yachtFields = { yachtName: form.yachtName, yachtMMSI: form.yachtMMSI, yachtIMO: form.yachtIMO, yachtFlag: form.yachtFlag, yachtLength: form.yachtLength ? parseFloat(form.yachtLength as string) : null, yachtType: form.yachtType, homePort: form.homePort }
                const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(yachtFields) })
                if (res.ok) {
                  setSuccess('Vessel details saved')
                } else {
                  setError('Failed to save vessel details. Please try again.')
                }
              } catch {
                setError('Failed to save vessel details. Please try again.')
              }
              finally { setSaving(false) }
            }} disabled={saving} className="mt-4 btn-primary !text-sm !py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Vessel Details'}
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[var(--c-ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Account</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a href="/dashboard" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
              Dashboard
            </a>
            <a href="/messages" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
              Messages
            </a>
            <a href="/reviews" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
              Reviews ({profile._count.receivedReviews})
            </a>
            <a href="/notifications" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
              Notifications
            </a>
            <a href="/disputes" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
              Disputes
            </a>
            <a href="/analytics" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
              Analytics
            </a>
            <a href="/insurance" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
              Insurance
            </a>
            {form.canCarry && (
              <>
              <a href="/listings/create" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
                List Van Space
              </a>
              <a href="/vehicles" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
                My Vehicles
              </a>
              <a href="/earnings" className="px-4 py-3 rounded border border-black/10 text-center font-medium text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors hover:no-underline">
                Earnings
              </a>
              </>
            )}
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[var(--c-ink)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Language & Region</h2>
          <p className="text-xs text-[var(--c-text-3)] mb-5">Choose your preferred language for the platform.</p>
          <div>
            <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">Preferred Language</label>
            <select
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-black/10 text-base sm:text-sm text-[var(--c-ink)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none"
              value={(form.preferredLanguage as string) || 'en'}
              onChange={async (e) => {
                const val = e.target.value
                setForm({...form, preferredLanguage: val})
                setError('')
                if (token) {
                  try {
                    const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ preferredLanguage: val }) })
                    if (res.ok) {
                      setSuccess('Language preference saved')
                    } else {
                      setForm({...form, preferredLanguage: form.preferredLanguage})
                      setError('Failed to update language preference.')
                    }
                  } catch {
                    setForm({...form, preferredLanguage: form.preferredLanguage})
                    setError('Failed to update language preference.')
                  }
                }
              }}
            >
              {Object.entries({ en: 'English', fr: 'Fran\u00e7ais', es: 'Espa\u00f1ol', it: 'Italiano', el: '\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac', nl: 'Nederlands', de: 'Deutsch', pt: 'Portugu\u00eas', tr: 'T\u00fcrk\u00e7e', hr: 'Hrvatski', ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' }).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8 mb-6">
          <h2 className="font-bold text-[var(--c-ink)] mb-4">Change Password</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            setSuccess('')
            const fd = new FormData(e.currentTarget)
            const currentPassword = fd.get('currentPassword') as string
            const newPassword = fd.get('newPassword') as string
            const confirmPassword = fd.get('confirmPassword') as string
            if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
            if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
            try {
              const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword }),
              })
              const data = await res.json()
              if (res.ok) { setSuccess('Password changed successfully'); (e.target as HTMLFormElement).reset() }
              else setError(data.error || 'Failed to change password')
            } catch { setError('Failed to change password') }
          }} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">Current Password</label>
              <input type="password" name="currentPassword" required minLength={8} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-black/10 text-base sm:text-sm focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">New Password</label>
              <input type="password" name="newPassword" required minLength={8} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-black/10 text-base sm:text-sm focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--c-ink)] mb-1">Confirm New Password</label>
              <input type="password" name="confirmPassword" required minLength={8} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-black/10 text-base sm:text-sm focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10 outline-none" />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-[var(--c-accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--c-accent-hover)] transition-colors">
              Change Password
            </button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8">
          <h2 className="font-bold text-[var(--c-ink)] mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--c-ink)]">Email Notifications</div>
                <div className="text-xs text-[var(--c-text-2)]">Booking updates, messages, and alerts via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.emailNotifications as boolean} onChange={async () => {
                  const val = !form.emailNotifications
                  setForm({...form, emailNotifications: val})
                  setError('')
                  if (token) {
                    try {
                      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ emailNotifications: val }) })
                      if (!res.ok) {
                        setForm({...form, emailNotifications: !val})
                        setError('Failed to update notification settings.')
                      }
                    } catch {
                      setForm({...form, emailNotifications: !val})
                      setError('Failed to update notification settings.')
                    }
                  }
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--c-canvas-2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--c-surface)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--c-accent)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--c-ink)]">SMS Notifications</div>
                <div className="text-xs text-[var(--c-text-2)]">Critical delivery updates via text message</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.smsNotifications as boolean} onChange={async () => {
                  const val = !form.smsNotifications
                  setForm({...form, smsNotifications: val})
                  setError('')
                  if (token) {
                    try {
                      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ smsNotifications: val }) })
                      if (!res.ok) {
                        setForm({...form, smsNotifications: !val})
                        setError('Failed to update notification settings.')
                      }
                    } catch {
                      setForm({...form, smsNotifications: !val})
                      setError('Failed to update notification settings.')
                    }
                  }
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-[var(--c-canvas-2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--c-surface)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--c-accent)]"></div>
              </label>
            </div>
          </div>
        </div>
        {/* Data Management */}
        <div className="bg-[var(--c-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-black/10 p-6 sm:p-8">
          <h2 className="font-bold text-[var(--c-ink)] mb-2">Data Management</h2>
          <p className="text-xs text-[var(--c-text-2)] mb-5">Export or delete your account data. See our <a href="/privacy" className="text-[var(--c-accent)] hover:underline">privacy policy</a> for details.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/profile/export', { headers: { Authorization: `Bearer ${token}` } })
                  if (res.ok) {
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `onshore-data-export-${new Date().toISOString().slice(0,10)}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                    setSuccess('Data exported successfully')
                  } else setError('Failed to export data')
                } catch { setError('Failed to export data') }
              }}
              className="px-5 py-2.5 border border-black/10 rounded-lg text-sm font-semibold text-[var(--c-ink)] hover:bg-[var(--c-canvas)] transition-colors"
            >
              Export My Data
            </button>
            <button
              onClick={async () => {
                if (!confirm('Are you sure you want to delete your account? This action cannot be undone. All your data, bookings, and listings will be permanently removed.')) return
                const confirmText = prompt('Type DELETE to confirm account deletion:')
                if (confirmText !== 'DELETE') return
                try {
                  const res = await fetch('/api/profile/delete', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                  if (res.ok) { alert('Your account has been deleted.'); window.location.href = '/' }
                  else { const d = await res.json(); setError(d.error || 'Failed to delete account') }
                } catch { setError('Failed to delete account') }
              }}
              className="px-5 py-2.5 border border-[var(--c-error)]/30 rounded-lg text-sm font-semibold text-[var(--c-error)] hover:bg-[var(--c-error)]/10 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
  )
}
