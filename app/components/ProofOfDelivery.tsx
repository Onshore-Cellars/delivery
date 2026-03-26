'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface PODProps {
  bookingId: string
  trackingCode: string
  token: string
  onComplete: () => void
  onClose: () => void
}

export default function ProofOfDelivery({ bookingId, trackingCode, token, onComplete, onClose }: PODProps) {
  const [step, setStep] = useState<'capture' | 'signature' | 'review'>('capture')
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [useCamera, setUseCamera] = useState(false)

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setUseCamera(true)
    } catch {
      setError('Camera access denied. You can upload a photo instead.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setUseCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      setPhotoData(canvas.toDataURL('image/jpeg', 0.8))
      stopCamera()
    }
  }

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be under 10MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPhotoData(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Signature drawing
  const initSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match display size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Draw guide line
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#e8e4de'
    ctx.beginPath()
    ctx.moveTo(20, rect.height - 30)
    ctx.lineTo(rect.width - 20, rect.height - 30)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.strokeStyle = '#1a1a1a'
  }, [])

  useEffect(() => {
    if (step === 'signature') {
      setTimeout(initSignature, 100)
    }
  }, [step, initSignature])

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current = getPos(e)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing.current || !lastPos.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = () => {
    isDrawing.current = false
    lastPos.current = null
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    initSignature()
    setSignatureData(null)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSignatureData(canvas.toDataURL('image/png'))
    setStep('review')
  }

  // Submit POD
  const submitPOD = async () => {
    if (!signatureData && !photoData) {
      setError('Please capture a photo or signature')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/pod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          signature: signatureData,
          photoData: photoData,
          notes: notes,
          recipientName: recipientName,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit POD')
      }
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#162E3D] w-full sm:max-w-lg sm:rounded-lg rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#162E3D] border-b border-white/10 px-5 py-4 z-10 rounded-t-2xl sm:rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#F7F9FB]" style={{ fontFamily: 'var(--font-display)' }}>Proof of Delivery</h2>
            <p className="text-xs text-[#6B7C86]">{trackingCode}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-[#162E3D] text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded bg-red-900/20 border border-red-500/30">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="p-5 space-y-5">
          {/* Step 1: Photo capture */}
          {step === 'capture' && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-[#F7F9FB] mb-3">Delivery Photo</h3>
                {photoData ? (
                  <div className="relative">
                    <img src={photoData} alt="Delivery" className="w-full rounded-lg border border-white/10" />
                    <button onClick={() => setPhotoData(null)} className="absolute top-2 right-2 p-1.5 bg-[#162E3D]/90 rounded-full shadow text-[#6B7C86] hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : useCamera ? (
                  <div className="relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                      <button onClick={capturePhoto} className="w-14 h-14 rounded-full bg-[#162E3D] border-4 border-[#FF6A2A] shadow-lg" />
                      <button onClick={stopCamera} className="p-3 rounded-full bg-[#162E3D]/80 text-[#9AADB8] shadow">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={startCamera} className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-white/10 hover:border-[#FF6A2A] transition-colors">
                      <svg className="w-8 h-8 text-[#FF6A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="text-xs font-semibold text-[#F7F9FB]">Take Photo</span>
                    </button>
                    <label className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-white/10 hover:border-[#FF6A2A] transition-colors cursor-pointer">
                      <svg className="w-8 h-8 text-[#FF6A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-xs font-semibold text-[#F7F9FB]">Upload Photo</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Recipient Name</label>
                <input type="text" className="w-full px-4 py-3 rounded border border-white/10 text-sm text-[#F7F9FB] focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 outline-none" placeholder="Name of person receiving delivery" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Notes (optional)</label>
                <textarea className="w-full px-4 py-3 rounded border border-white/10 text-sm text-[#F7F9FB] focus:border-[#FF6A2A] focus:ring-2 focus:ring-[#FF6A2A]/10 outline-none min-h-[60px] resize-none" placeholder="e.g. Left at gangway, 3 boxes" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('signature')} className="btn-primary flex-1">
                  {photoData ? 'Next — Get Signature' : 'Skip Photo — Get Signature'}
                </button>
              </div>
              {photoData && (
                <button onClick={() => { setStep('review') }} className="w-full text-center text-sm text-[#FF6A2A] font-semibold">
                  Skip signature — submit with photo only
                </button>
              )}
            </>
          )}

          {/* Step 2: Signature capture */}
          {step === 'signature' && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-[#F7F9FB] mb-1">Signature</h3>
                <p className="text-xs text-[#6B7C86] mb-3">Ask the recipient to sign below with their finger</p>
                <div className="relative border-2 border-white/10 rounded-lg bg-[#162E3D] overflow-hidden" style={{ touchAction: 'none' }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full"
                    style={{ height: '200px' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                  />
                  <button onClick={clearSignature} className="absolute top-2 right-2 px-3 py-1 bg-[#162E3D] rounded border border-white/10 text-xs font-semibold text-[#6B7C86] hover:text-white">
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('capture')} className="btn-secondary flex-1">Back</button>
                <button onClick={saveSignature} className="btn-primary flex-1">Review & Submit</button>
              </div>
            </>
          )}

          {/* Step 3: Review & submit */}
          {step === 'review' && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#F7F9FB]">Review Proof of Delivery</h3>

                {photoData && (
                  <div>
                    <p className="text-xs text-[#6B7C86] mb-2">Delivery Photo</p>
                    <img src={photoData} alt="Delivery" className="w-full max-h-48 object-cover rounded-lg border border-white/10" />
                  </div>
                )}

                {signatureData && (
                  <div>
                    <p className="text-xs text-[#6B7C86] mb-2">Signature</p>
                    <img src={signatureData} alt="Signature" className="w-full h-24 object-contain rounded-lg border border-white/10 bg-[#162E3D] p-2" />
                  </div>
                )}

                {recipientName && (
                  <div>
                    <p className="text-xs text-[#6B7C86]">Received by</p>
                    <p className="text-sm font-medium text-[#F7F9FB]">{recipientName}</p>
                  </div>
                )}

                {notes && (
                  <div>
                    <p className="text-xs text-[#6B7C86]">Notes</p>
                    <p className="text-sm text-[#F7F9FB]">{notes}</p>
                  </div>
                )}

                {!photoData && !signatureData && (
                  <p className="text-sm text-red-400">Please go back and capture at least a photo or signature.</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('capture')} className="btn-secondary flex-1">Back</button>
                <button onClick={submitPOD} disabled={submitting || (!photoData && !signatureData)} className="btn-primary flex-1 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Confirm Delivery'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
