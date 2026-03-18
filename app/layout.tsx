import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./components/ClientLayout"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
})

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
      <body className={`${inter.className} antialiased`}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
