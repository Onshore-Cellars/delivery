import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./components/ClientLayout"

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
