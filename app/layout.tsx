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
  title: "YachtHop — Premium Yacht Logistics Marketplace",
  description: "The marketplace for yacht logistics. Suppliers offer van space to ports and marinas. Yachts and suppliers book space for deliveries. Simple, premium, reliable.",
  keywords: ["yacht logistics", "marine delivery", "yacht supplies", "port delivery", "maritime transport"],
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
