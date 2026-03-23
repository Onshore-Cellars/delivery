import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ['bcryptjs'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://js.stripe.com https://maps.googleapis.com https://accounts.google.com`,
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          `connect-src 'self'${isDev ? ' ws: wss:' : ''} https://api.stripe.com https://maps.googleapis.com https://api.anthropic.com https://api.resend.com https://accounts.google.com https://photon.komoot.io`,
          "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "base-uri 'self'",
        ].join("; "),
      },
    ]

    // Only send HSTS in production where HTTPS is terminated by the platform
    if (!isDev) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      })
    }

    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
