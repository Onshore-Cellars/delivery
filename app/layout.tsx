import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VanShare - Share Van Space, Save on Delivery",
  description: "The marketplace for sharing van delivery space. Carriers list spare capacity, customers book affordable deliveries.",
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
