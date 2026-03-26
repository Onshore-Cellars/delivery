'use client'

import { useState, useRef } from 'react'

interface AvatarUploadProps {
  currentUrl?: string
  name: string
  token: string
  onUpload: (url: string) => void
}

export default function AvatarUpload({ currentUrl, name, token, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setUploading(true)

    // Resize to max 400x400 for profile images
    const canvas = document.createElement('canvas')
    const img = new Image()
    const reader = new FileReader()

    reader.onload = () => {
      img.onload = async () => {
        const size = Math.min(img.width, img.height, 400)
        canvas.width = size
        canvas.height = size

        const ctx = canvas.getContext('2d')
        if (!ctx) { setUploading(false); return }

        // Center crop
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setPreview(dataUrl)

        // Save to profile
        try {
          const res = await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ avatarUrl: dataUrl }),
          })
          if (res.ok) {
            onUpload(dataUrl)
          } else {
            setError('Failed to save image. Please try again.')
            setPreview(currentUrl || null)
          }
        } catch {
          setError('Network error. Please try again.')
          setPreview(currentUrl || null)
        }
        setUploading(false)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div className="relative group">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#162E3D] flex items-center justify-center shadow-sm">
          {preview ? (
            <img src={preview} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-[#F7F9FB]">{initials}</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FF6A2A] text-white flex items-center justify-center shadow-md hover:bg-[#E85A1C] transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}
