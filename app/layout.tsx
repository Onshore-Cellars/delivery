import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./components/ClientLayout"

export const metadata: Metadata = {
  title: "Onshore Deliver — Delivery Logistics Marketplace",
  description: "The marketplace for delivery logistics. Carriers share van space to ports and marinas. Book space for provisions, equipment, and supplies. Simple, premium, reliable.",
  keywords: ["delivery logistics", "marine delivery", "port delivery", "maritime transport", "van space sharing"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
