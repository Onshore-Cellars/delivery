import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DockDrop - Yacht Supply Delivery Marketplace",
  description: "Book space in supply vans heading to marinas and yachts. Yacht suppliers list spare capacity, crews and chandleries book affordable deliveries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
