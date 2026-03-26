'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '../components/AuthProvider'

interface Post {
  id: string
  title: string
  content: string
  category: string
  likes: number
  views: number
  pinned: boolean
  createdAt: string
  author: { name: string; company?: string; role: string }
  replyCount: number
}

const CATEGORIES = [
  { value: '', label: 'All Posts' },
  { value: 'routes', label: 'Routes & Schedules' },
  { value: 'wanted', label: 'Cargo & Capacity Wanted' },
  { value: 'ports', label: 'Ports & Marinas' },
  { value: 'customs', label: 'Customs & Regulations' },
  { value: 'tips', label: 'Tips & Advice' },
]

const CATEGORY_COLORS: Record<string, string> = {
  routes: 'bg-indigo-50 text-indigo-700',
  wanted: 'bg-red-500/10 text-red-600',
  ports: 'bg-sky-50 text-sky-700',
  customs: 'bg-[#FF6A2A]/10 text-[#9a7039]',
  tips: 'bg-[#9ED36A]/10 text-[#9ED36A]',
}

export default function CommunityPage() {
  const { user, token } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'routes' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      params.append('limit', '30')
      const res = await fetch(`/api/community?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
        setError('')
      } else {
        setError('Failed to load posts.')
      }
    } catch {
      setError('Failed to load posts.')
    }
    finally { setLoading(false) }
  }, [category])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newPost),
      })
      if (res.ok) {
        setNewPost({ title: '', content: '', category: 'routes' })
        setShowNewPost(false)
        setError('')
        fetchPosts()
      } else {
        setError('Failed to create post. Please try again.')
      }
    } catch {
      setError('Failed to create post. Please try again.')
    }
    finally { setSubmitting(false) }
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const inputClass = "w-full px-4 py-3 rounded border border-white/[0.08] bg-[#162E3D] text-[15px] text-[#F7F9FB] placeholder:text-[#9a9a9a] focus:border-[#1E6F8F] focus:ring-2 focus:ring-[#1E6F8F]/10 transition-all outline-none"

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-light text-[#F7F9FB] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            Community
          </h1>
          <p className="text-sm text-[#6B7C86] mt-1">Connect with carriers, suppliers, and yacht crews across the Mediterranean.</p>
        </div>
        {user && (
          <button onClick={() => setShowNewPost(!showNewPost)} className="btn-primary !text-sm !py-2.5 !px-5">
            {showNewPost ? 'Cancel' : 'New Post'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-200">
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* New post form */}
      {showNewPost && (
        <form onSubmit={handleSubmit} className="bg-[#162E3D] rounded-lg border border-white/[0.08] p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Title</label>
            <input type="text" required className={inputClass} placeholder="What's on your mind?" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Category</label>
            <select className={inputClass + " appearance-none"} value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}>
              {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Content</label>
            <textarea required className={inputClass + " min-h-[120px] resize-none"} placeholder="Share your thoughts, ask questions, or offer advice..." value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary !text-sm !py-2.5 disabled:opacity-50">
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-2 rounded text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
              category === c.value
                ? 'bg-[#FF6A2A] text-white'
                : 'bg-[#102535] text-[#6B7C86] hover:text-[#F7F9FB]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="loading-shimmer h-32 rounded-lg" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#162E3D] rounded-lg border border-white/[0.08] p-12 text-center">
          <p className="text-[#F7F9FB] font-semibold mb-2">No posts yet</p>
          <p className="text-sm text-[#6B7C86] mb-4">Be the first to start a discussion!</p>
          {user && (
            <button onClick={() => setShowNewPost(true)} className="btn-primary !text-sm !py-2.5 !px-5">
              Create First Post
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className={`bg-[#162E3D] rounded-lg border ${post.pinned ? 'border-[#C6904D]/30' : 'border-white/[0.08]'} p-5 hover:shadow-sm transition-shadow`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {post.pinned && (
                      <span className="text-[10px] font-bold text-[#FF6A2A] uppercase tracking-wider">Pinned</span>
                    )}
                    <span className={`badge ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}>
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#F7F9FB] text-base mb-1">{post.title}</h3>
                  <p className="text-sm text-[#6B7C86] line-clamp-2">{post.content}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f5f3f0]">
                <div className="flex items-center gap-4 text-xs text-[#6B7C86]">
                  <span className="font-medium text-[#9AADB8]">{post.author?.name}</span>
                  {post.author?.company && <span>{post.author.company}</span>}
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B7C86]">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {post.replyCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!user && (
        <div className="mt-8 text-center">
          <p className="text-sm text-[#6B7C86]">
            <Link href="/register" className="font-semibold text-[#FF6A2A] hover:underline">Create an account</Link> to join the conversation.
          </p>
        </div>
      )}
    </div>
  )
}
