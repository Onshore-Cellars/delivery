'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'
import AvatarUpload from '../components/AvatarUpload'
import AddressAutocomplete from '../components/AddressAutocomplete'

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
  verified: boolean; createdAt: string; stripeAccountId?: string
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

  const fetchProfile = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setRating(data.rating)
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
          <p className="text-[11px] font-semibold text-[#FF6A2A] uppercase tracking-[0.15em] mb-1">Account</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#F7F9FB] tracking-[-0.02em]">Profile & Settings</h1>
        </div>

        {success && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200" role="status">
            <p className="text-sm text-emerald-700 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-200" role="alert">
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}

        {!profile.termsAcceptedAt && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-[#FF6A2A]/10 border border-[#FF6A2A]/20">
            <p className="text-sm text-[#FF6A2A] font-medium mb-3">Please review and accept our updated Terms of Service and Privacy Policy to continue using Onshore Deliver.</p>
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
        <div className="bg-[#162E3D] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-white/[0.08] p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <AvatarUpload
              currentUrl={profile.avatarUrl || undefined}
              name={profile.name}
              token={token || ''}
              onUpload={() => { fetchProfile(); refreshUser() }}
            />
            <div>
              <h2 className="text-xl font-bold text-[#F7F9FB]">{profile.name}</h2>
              <p className="text-sm text-[#6B7C86]">{profile.role.replace('_', ' ')}{profile.company && ` at ${profile.company}`}</p>
              <div className="flex items-center gap-3 mt-1">
                {rating.count > 0 && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating.average) ? 'text-[#FF6A2A]' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                    <span className="text-xs text-[#6B7C86]">{rating.average.toFixed(1)} ({rating.count})</span>
                  </div>
                )}
                <span className="text-xs text-[#6B7C86]">{profile._count.listings} listings &middot; {profile._count.bookings} bookings</span>
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
                    <dt className="text-xs text-[#6B7C86] uppercase tracking-wider">{label}</dt>
                    <dd className="text-sm font-medium text-[#F7F9FB] mt-0.5">{value || '-'}</dd>
                  </div>
                ))}
              </dl>
              {profile.bio && <p className="mt-4 text-sm text-[#9AADB8] leading-relaxed border-t border-white/[0.06] pt-4">{profile.bio}</p>}
              <button onClick={() => setEditing(true)} className="mt-6 btn-primary text-sm !py-2 !px-5">Edit Profile</button>
            </>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['name', 'Full Name', 'text'],
                  ['phone', 'Phone', 'tel'],
                  ['company', 'Company', 'text'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-[#F7F9FB] mb-1">{label}</label>
                    <input type={type} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-white/[0.08] text-base sm:text-sm text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" value={(form[key] as string) || ''} onChange={e => setForm({...form, [key]: e.target.value})} />
                  </div>
                ))}
                <div>
                  <AddressAutocomplete
                    label="Address"
                    value={(form.address as string) || ''}
                    onChange={val => setForm(f => ({...f, address: val}))}
                    onSelect={addr => setForm(f => ({...f, address: addr.display, ...(addr.city ? { city: addr.city } : {}), ...(addr.country ? { country: addr.country } : {})}))}
                    placeholder="Start typing an address..."
                  />
                </div>
                {[
                  ['city', 'City', 'text'],
                  ['country', 'Country', 'text'],
                  ['website', 'Website', 'url'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-[#F7F9FB] mb-1">{label}</label>
                    <input type={type} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-white/[0.08] text-base sm:text-sm text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" value={(form[key] as string) || ''} onChange={e => setForm({...form, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Bio</label>
                <textarea rows={3} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-white/[0.08] text-base sm:text-sm text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none resize-none" value={(form.bio as string) || ''} onChange={e => setForm({...form, bio: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary text-sm !py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 text-sm text-[#6B7C86] hover:bg-[#162E3D] rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Role & Capabilities */}
        <div className="bg-[#162E3D] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-white/[0.08] p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[#F7F9FB] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Role & Capabilities</h2>
          <p className="text-xs text-[#6B7C86] mb-5">Toggle what you can do on the platform. You can both ship and carry.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#F7F9FB]">I can carry / deliver</div>
                <div className="text-xs text-[#6B7C86]">List van space, accept bookings, deliver goods to ports</div>
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#162E3D] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6A2A]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#F7F9FB]">I need deliveries / shipping</div>
                <div className="text-xs text-[#6B7C86]">Book space, request quotes, receive goods at marina</div>
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#162E3D] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6A2A]"></div>
              </label>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-[#6B7C86]">
              <span className="font-medium text-[#F7F9FB]">Current role:</span>
              <span className="badge bg-[#FF6A2A]/10 text-[#9a7039]">{profile.role.replace('_', ' ')}</span>
              {form.canCarry && <span className="badge bg-[#9ED36A]/10 text-[#9ED36A]">Can Carry</span>}
              {form.canShip && <span className="badge bg-indigo-50 text-indigo-700">Can Ship</span>}
            </div>
          </div>
        </div>

        {/* Yacht / Vessel Details */}
        {(profile.role === 'YACHT_OWNER' || profile.role === 'CREW' || form.canShip) && (
          <div className="bg-[#162E3D] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-white/[0.08] p-6 sm:p-8 mb-6">
            <h2 className="font-semibold text-[#F7F9FB] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Yacht / Vessel Details</h2>
            <p className="text-xs text-[#6B7C86] mb-5">Optional — helps carriers find your vessel and deliver to the right berth.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['yachtName', 'Vessel Name', 'text', 'e.g. MY Ocean Dream'],
                ['yachtType', 'Vessel Type', 'text', 'e.g. Motor Yacht'],
                ['yachtFlag', 'Flag State', 'text', 'e.g. Cayman Islands'],
                ['yachtLength', 'Length (m)', 'number', 'LOA in metres'],
                ['homePort', 'Home Port', 'text', 'e.g. Antibes'],
              ].map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[#F7F9FB] mb-1.5 uppercase tracking-wider">{label}</label>
                  <input type={type} className="w-full px-4 py-2.5 rounded border border-white/[0.08] text-sm text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" placeholder={placeholder as string} value={(form[key] as string) || ''} onChange={e => setForm({...form, [key]: e.target.value})} />
                </div>
              ))}
              {/* MMSI & IMO — only shown for yacht accounts */}
              {(profile.role === 'YACHT_OWNER' || profile.role === 'CREW') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#F7F9FB] mb-1.5 uppercase tracking-wider">MMSI Number</label>
                    <input type="text" className="w-full px-4 py-2.5 rounded border border-white/[0.08] text-sm text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" placeholder="9-digit MMSI" maxLength={9} value={(form.yachtMMSI as string) || ''} onChange={e => setForm({...form, yachtMMSI: e.target.value.replace(/\D/g, '').slice(0, 9)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#F7F9FB] mb-1.5 uppercase tracking-wider">IMO Number</label>
                    <input type="text" className="w-full px-4 py-2.5 rounded border border-white/[0.08] text-sm text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" placeholder="IMO number" value={(form.yachtIMO as string) || ''} onChange={e => setForm({...form, yachtIMO: e.target.value})} />
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
        <div className="bg-[#162E3D] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-white/[0.08] p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[#F7F9FB] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Account</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a href="/dashboard" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
              Dashboard
            </a>
            <a href="/messages" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
              Messages
            </a>
            <a href="/reviews" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
              Reviews ({profile._count.receivedReviews})
            </a>
            <a href="/notifications" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
              Notifications
            </a>
            <a href="/disputes" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
              Disputes
            </a>
            <a href="/analytics" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
              Analytics
            </a>
            <a href="/insurance" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
              Insurance
            </a>
            {form.canCarry && (
              <>
              <a href="/listings/create" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                List Van Space
              </a>
              <a href="/vehicles" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                My Vehicles
              </a>
              <a href="/earnings" className="px-4 py-3 rounded border border-white/[0.08] text-center font-medium text-[#F7F9FB] hover:bg-[#162E3D] transition-colors hover:no-underline">
                Earnings
              </a>
              </>
            )}
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-[#162E3D] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-white/[0.08] p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[#F7F9FB] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Language & Region</h2>
          <p className="text-xs text-[#6B7C86] mb-5">Choose your preferred language for the platform.</p>
          <div>
            <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Preferred Language</label>
            <select
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-white/[0.08] text-base sm:text-sm text-[#F7F9FB] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none"
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
        <div className="bg-[#162E3D] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-white/[0.08] p-6 sm:p-8 mb-6">
          <h2 className="font-bold text-[#F7F9FB] mb-4">Change Password</h2>
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
              <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Current Password</label>
              <input type="password" name="currentPassword" required minLength={8} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-white/[0.08] text-base sm:text-sm focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#F7F9FB] mb-1">New Password</label>
              <input type="password" name="newPassword" required minLength={8} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-white/[0.08] text-base sm:text-sm focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#F7F9FB] mb-1">Confirm New Password</label>
              <input type="password" name="confirmPassword" required minLength={8} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-white/[0.08] text-base sm:text-sm focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 outline-none" />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#333] transition-colors">
              Change Password
            </button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="bg-[#162E3D] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-white/[0.08] p-6 sm:p-8">
          <h2 className="font-bold text-[#F7F9FB] mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#F7F9FB]">Email Notifications</div>
                <div className="text-xs text-[#6B7C86]">Booking updates, messages, and alerts via email</div>
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#162E3D] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a1a1a]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#F7F9FB]">SMS Notifications</div>
                <div className="text-xs text-[#6B7C86]">Critical delivery updates via text message</div>
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#162E3D] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a1a1a]"></div>
              </label>
            </div>
          </div>
        </div>
        {/* Data Management */}
        <div className="bg-[#162E3D] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-white/[0.08] p-6 sm:p-8">
          <h2 className="font-bold text-[#F7F9FB] mb-2">Data Management</h2>
          <p className="text-xs text-[#6B7C86] mb-5">Export or delete your account data. See our <a href="/privacy" className="text-[#FF6A2A] hover:underline">privacy policy</a> for details.</p>
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
              className="px-5 py-2.5 border border-white/[0.08] rounded-lg text-sm font-semibold text-[#F7F9FB] hover:bg-[#162E3D] transition-colors"
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
              className="px-5 py-2.5 border border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-500/10 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
  )
}
