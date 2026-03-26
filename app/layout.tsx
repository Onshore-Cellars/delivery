import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./components/ClientLayout"

export const metadata: Metadata = {
  title: {
    default: "ON.SHORE Delivery — Marine-Grade Logistics",
    template: "%s | ON.SHORE Delivery",
  },
  description: "Marine-grade logistics infrastructure for high-value environments. Consolidate deliveries to ports and marinas. Premium, precise, reliable.",
  keywords: ["marine logistics", "yacht delivery", "port delivery", "maritime transport", "marine-grade logistics", "yacht provisions", "marine supplies"],
  openGraph: {
    type: "website",
    siteName: "ON.SHORE Delivery",
    title: "ON.SHORE Delivery — Marine-Grade Logistics",
    description: "Marine-grade logistics infrastructure. Consolidate deliveries to ports and marinas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ON.SHORE Delivery",
    description: "Marine-grade logistics infrastructure for high-value environments.",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" type="image/png" href="/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
