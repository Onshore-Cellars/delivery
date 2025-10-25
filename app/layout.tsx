import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yachting Logistics - Optimize Van Space in the Yachting Industry",
  description: "Connect suppliers with spare van space to those who need it. Efficient, cost-effective delivery solutions for yacht destinations.",
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
