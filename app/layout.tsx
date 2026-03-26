import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./components/ClientLayout"

export const metadata: Metadata = {
  title: {
    default: "Onshore Deliver — Delivery Logistics Marketplace",
    template: "%s | Onshore Deliver",
  },
  description: "The marketplace for delivery logistics. Carriers share van space to ports and marinas. Book space for provisions, equipment, and supplies. Simple, premium, reliable.",
  keywords: ["delivery logistics", "marine delivery", "port delivery", "maritime transport", "van space sharing", "yacht provisions", "marine supplies"],
  openGraph: {
    type: "website",
    siteName: "Onshore Deliver",
    title: "Onshore Deliver — Delivery Logistics Marketplace",
    description: "Share van space. Book deliveries to ports and marinas. Simple, premium, reliable.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Onshore Deliver",
    description: "Delivery logistics marketplace for marine and yacht supplies.",
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
