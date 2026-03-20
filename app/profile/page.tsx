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
  yachtName?: string; yachtMMSI?: string; yachtIMO?: string; yachtFlag?: string
  yachtLength?: number; yachtType?: string; homePort?: string
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
    setSaving(true); setSuccess('')
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
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  if (authLoading || loading || !profile) {
    return <div className="flex items-center justify-center py-20"><div className="loading-shimmer w-64 h-8 rounded-lg" /></div>
  }

  return (
    <div className="page-container narrow">
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-[#C6904D] uppercase tracking-[0.15em] mb-1">Account</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">Profile & Settings</h1>
        </div>

        {success && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-sm text-emerald-700 font-medium">{success}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <AvatarUpload
              currentUrl={profile.avatarUrl || undefined}
              name={profile.name}
              token={token || ''}
              onUpload={() => { fetchProfile(); refreshUser() }}
            />
            <div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">{profile.name}</h2>
              <p className="text-sm text-slate-500">{profile.role.replace('_', ' ')}{profile.company && ` at ${profile.company}`}</p>
              <div className="flex items-center gap-3 mt-1">
                {rating.count > 0 && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating.average) ? 'text-[#C6904D]' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                    <span className="text-xs text-slate-500">{rating.average.toFixed(1)} ({rating.count})</span>
                  </div>
                )}
                <span className="text-xs text-slate-400">{profile._count.listings} listings &middot; {profile._count.bookings} bookings</span>
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
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{label}</dt>
                    <dd className="text-sm font-medium text-[#1a1a1a] mt-0.5">{value || '-'}</dd>
                  </div>
                ))}
              </dl>
              {profile.bio && <p className="mt-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{profile.bio}</p>}
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
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1">{label}</label>
                    <input type={type} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm text-[#1a1a1a] focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 outline-none" value={(form[key] as string) || ''} onChange={e => setForm({...form, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Bio</label>
                <textarea rows={3} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm text-[#1a1a1a] focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 outline-none resize-none" value={(form.bio as string) || ''} onChange={e => setForm({...form, bio: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary text-sm !py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Role & Capabilities */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Role & Capabilities</h2>
          <p className="text-xs text-slate-500 mb-5">Toggle what you can do on the platform. You can both ship and carry.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#1a1a1a]">I can carry / deliver</div>
                <div className="text-xs text-slate-500">List van space, accept bookings, deliver goods to ports</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.canCarry as boolean} onChange={async () => {
                  const val = !form.canCarry
                  setForm({...form, canCarry: val})
                  if (token) {
                    await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ canCarry: val }) })
                    setSuccess('Capabilities updated')
                    refreshUser()
                  }
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C6904D]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#1a1a1a]">I need deliveries / shipping</div>
                <div className="text-xs text-slate-500">Book space, request quotes, receive goods at marina</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.canShip as boolean} onChange={async () => {
                  const val = !form.canShip
                  setForm({...form, canShip: val})
                  if (token) {
                    await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ canShip: val }) })
                    setSuccess('Capabilities updated')
                    refreshUser()
                  }
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C6904D]"></div>
              </label>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#e8e4de]">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-[#1a1a1a]">Current role:</span>
              <span className="badge bg-amber-50 text-[#9a7039]">{profile.role.replace('_', ' ')}</span>
              {form.canCarry && <span className="badge bg-green-50 text-green-700">Can Carry</span>}
              {form.canShip && <span className="badge bg-blue-50 text-blue-700">Can Ship</span>}
            </div>
          </div>
        </div>

        {/* Yacht / Vessel Details */}
        {(profile.role === 'YACHT_OWNER' || profile.role === 'CREW' || form.canShip) && (
          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-8 mb-6">
            <h2 className="font-semibold text-[#1a1a1a] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Yacht / Vessel Details</h2>
            <p className="text-xs text-slate-500 mb-5">Optional — helps carriers find your vessel and deliver to the right berth.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['yachtName', 'Vessel Name', 'text', 'e.g. MY Ocean Dream'],
                ['yachtMMSI', 'MMSI Number', 'text', '9-digit MMSI'],
                ['yachtIMO', 'IMO Number', 'text', 'IMO number'],
                ['yachtType', 'Vessel Type', 'text', 'e.g. Motor Yacht'],
                ['yachtFlag', 'Flag State', 'text', 'e.g. Cayman Islands'],
                ['yachtLength', 'Length (m)', 'number', 'LOA in metres'],
                ['homePort', 'Home Port', 'text', 'e.g. Antibes'],
              ].map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-[#1a1a1a] mb-1.5 uppercase tracking-wider">{label}</label>
                  <input type={type} className="w-full px-4 py-2.5 rounded border border-[#e8e4de] text-sm text-[#1a1a1a] focus:border-[#C6904D] focus:ring-2 focus:ring-[#C6904D]/10 outline-none" placeholder={placeholder as string} value={(form[key] as string) || ''} onChange={e => setForm({...form, [key]: e.target.value})} />
                </div>
              ))}
            </div>
            <button onClick={async () => {
              if (!token) return
              setSaving(true)
              try {
                const yachtFields = { yachtName: form.yachtName, yachtMMSI: form.yachtMMSI, yachtIMO: form.yachtIMO, yachtFlag: form.yachtFlag, yachtLength: form.yachtLength ? parseFloat(form.yachtLength as string) : null, yachtType: form.yachtType, homePort: form.homePort }
                await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(yachtFields) })
                setSuccess('Vessel details saved')
              } catch { /* ignore */ }
              finally { setSaving(false) }
            }} disabled={saving} className="mt-4 btn-primary !text-sm !py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Vessel Details'}
            </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-8 mb-6">
          <h2 className="font-semibold text-[#1a1a1a] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Account</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a href="/dashboard" className="px-4 py-3 rounded border border-[#e8e4de] text-center font-medium text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors hover:no-underline">
              Dashboard
            </a>
            <a href="/messages" className="px-4 py-3 rounded border border-[#e8e4de] text-center font-medium text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors hover:no-underline">
              Messages
            </a>
            <a href="/reviews" className="px-4 py-3 rounded border border-[#e8e4de] text-center font-medium text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors hover:no-underline">
              Reviews ({profile._count.receivedReviews})
            </a>
            {form.canCarry && (
              <a href="/listings/create" className="px-4 py-3 rounded border border-[#e8e4de] text-center font-medium text-[#1a1a1a] hover:bg-[#faf9f7] transition-colors hover:no-underline">
                List Van Space
              </a>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e4de] p-6 sm:p-8">
          <h2 className="font-bold text-[#1a1a1a] mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#1a1a1a]">Email Notifications</div>
                <div className="text-xs text-slate-400">Booking updates, messages, and alerts via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.emailNotifications as boolean} onChange={async () => {
                  const val = !form.emailNotifications
                  setForm({...form, emailNotifications: val})
                  if (token) {
                    await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ emailNotifications: val }) })
                  }
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a1a1a]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#1a1a1a]">SMS Notifications</div>
                <div className="text-xs text-slate-400">Critical delivery updates via text message</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.smsNotifications as boolean} onChange={async () => {
                  const val = !form.smsNotifications
                  setForm({...form, smsNotifications: val})
                  if (token) {
                    await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ smsNotifications: val }) })
                  }
                }} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a1a1a]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
  )
}
