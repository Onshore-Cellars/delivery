// File storage abstraction — supports S3-compatible services (AWS S3, Cloudflare R2, MinIO)
// Configure via environment variables:
//   STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY
//   STORAGE_ENDPOINT (for R2/MinIO), STORAGE_PUBLIC_URL (for CDN)

interface UploadOptions {
  key: string
  body: Buffer | Uint8Array | string
  contentType: string
  isPublic?: boolean
}

interface UploadResult {
  key: string
  url: string
  size: number
}

const BUCKET = process.env.STORAGE_BUCKET || ''
const REGION = process.env.STORAGE_REGION || 'eu-west-1'
const ACCESS_KEY = process.env.STORAGE_ACCESS_KEY || ''
const SECRET_KEY = process.env.STORAGE_SECRET_KEY || ''
const ENDPOINT = process.env.STORAGE_ENDPOINT || '' // e.g. https://<account>.r2.cloudflarestorage.com
const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL || '' // e.g. https://cdn.onshore.delivery

function isConfigured(): boolean {
  return !!(BUCKET && ACCESS_KEY && SECRET_KEY)
}

// ─── HMAC / Signing helpers for S3-compatible APIs ─────────────────────────

async function hmacSHA256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return new Uint8Array(sig)
}

async function sha256(data: string | Uint8Array): Promise<string> {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const hash = await crypto.subtle.digest('SHA-256', input.buffer as ArrayBuffer)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getSignatureKey(dateStamp: string): Promise<Uint8Array> {
  const kDate = await hmacSHA256(new TextEncoder().encode('AWS4' + SECRET_KEY), dateStamp)
  const kRegion = await hmacSHA256(kDate, REGION)
  const kService = await hmacSHA256(kRegion, 's3')
  return hmacSHA256(kService, 'aws4_request')
}

// ─── S3 PUT (Signature V4) ─────────────────────────────────────────────────

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  if (!isConfigured()) {
    // Dev fallback — store as base64 data URL (works for small files)
    console.warn('[Storage] Not configured — returning data as base64')
    const bodyStr = typeof options.body === 'string'
      ? options.body
      : Buffer.from(options.body).toString('base64')
    return {
      key: options.key,
      url: `data:${options.contentType};base64,${bodyStr}`,
      size: typeof options.body === 'string' ? options.body.length : options.body.length,
    }
  }

  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const host = ENDPOINT
    ? new URL(ENDPOINT).host
    : `${BUCKET}.s3.${REGION}.amazonaws.com`
  const baseUrl = ENDPOINT
    ? `${ENDPOINT}/${BUCKET}`
    : `https://${host}`

  const bodyBytes: Uint8Array = typeof options.body === 'string'
    ? new TextEncoder().encode(options.body)
    : new Uint8Array(options.body)
  const payloadHash = await sha256(bodyBytes)

  const headers: Record<string, string> = {
    'Host': host,
    'Content-Type': options.contentType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }

  const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';')
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k.toLowerCase()}:${headers[k]}\n`).join('')

  const canonicalRequest = [
    'PUT',
    `/${options.key}`,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${REGION}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join('\n')

  const signingKey = await getSignatureKey(dateStamp)
  const signatureBytes = await hmacSHA256(signingKey, stringToSign)
  const signature = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`${baseUrl}/${options.key}`, {
    method: 'PUT',
    headers: { ...headers, Authorization: authHeader },
    body: bodyBytes as unknown as BodyInit,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Storage upload failed (${res.status}): ${text}`)
  }

  const url = PUBLIC_URL ? `${PUBLIC_URL}/${options.key}` : `${baseUrl}/${options.key}`

  return {
    key: options.key,
    url,
    size: bodyBytes.length,
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

export async function deleteFile(key: string): Promise<void> {
  if (!isConfigured()) return

  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const host = ENDPOINT
    ? new URL(ENDPOINT).host
    : `${BUCKET}.s3.${REGION}.amazonaws.com`
  const baseUrl = ENDPOINT ? `${ENDPOINT}/${BUCKET}` : `https://${host}`

  const payloadHash = await sha256('')
  const headers: Record<string, string> = {
    'Host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }

  const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';')
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k.toLowerCase()}:${headers[k]}\n`).join('')

  const canonicalRequest = ['DELETE', `/${key}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')
  const credentialScope = `${dateStamp}/${REGION}/s3/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256(canonicalRequest)].join('\n')
  const signingKey = await getSignatureKey(dateStamp)
  const signatureBytes = await hmacSHA256(signingKey, stringToSign)
  const signature = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  await fetch(`${baseUrl}/${key}`, {
    method: 'DELETE',
    headers: { ...headers, Authorization: `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}` },
  })
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function generateKey(folder: string, filename: string): string {
  const timestamp = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  const ext = filename.split('.').pop() || 'bin'
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50)
  return `${folder}/${timestamp}-${rand}-${nameWithoutExt}.${ext}`
}

export function getPublicUrl(key: string): string {
  if (PUBLIC_URL) return `${PUBLIC_URL}/${key}`
  if (ENDPOINT) return `${ENDPOINT}/${BUCKET}/${key}`
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
}
