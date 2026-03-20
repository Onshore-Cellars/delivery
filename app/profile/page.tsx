'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../components/AuthProvider'

interface ProfileData {
  id: string; email: string; name: string; role: string
  phone?: string; company?: string; bio?: string; website?: string
  address?: string; city?: string; country?: string
  emailNotifications: boolean; smsNotifications: boolean
  verified: boolean; createdAt: string; stripeAccountId?: string
  _count: { listings: number; bookings: number; receivedReviews: number }
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
    return <div className="min-h-screen flex items-center justify-center"><div className="loading-shimmer w-64 h-8 rounded-lg" /></div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-[#0071e3] uppercase tracking-[0.15em] mb-1">Account</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-[-0.02em]">Profile & Settings</h1>
        </div>

        {success && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-sm text-emerald-700 font-medium">{success}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-[#1d1d1f]">{profile.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1d1d1f]">{profile.name}</h2>
              <p className="text-sm text-slate-500">{profile.role.replace('_', ' ')}{profile.company && ` at ${profile.company}`}</p>
              <div className="flex items-center gap-3 mt-1">
                {rating.count > 0 && (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating.average) ? 'text-[#0071e3]' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
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
                    <dd className="text-sm font-medium text-[#1d1d1f] mt-0.5">{value || '-'}</dd>
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
                    <label className="block text-sm font-medium text-[#1d1d1f] mb-1">{label}</label>
                    <input type={type} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none" value={(form[key] as string) || ''} onChange={e => setForm({...form, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1">Bio</label>
                <textarea rows={3} className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-slate-200 text-base sm:text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 outline-none resize-none" value={(form.bio as string) || ''} onChange={e => setForm({...form, bio: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary text-sm !py-2.5 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100/80 p-6 sm:p-8">
          <h2 className="font-bold text-[#1d1d1f] mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#1d1d1f]">Email Notifications</div>
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d1d1f]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#1d1d1f]">SMS Notifications</div>
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d1d1f]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
