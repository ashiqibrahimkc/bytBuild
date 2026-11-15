import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "byten – Construction Cash Flow & Site ERP",
  description: "Enterprise cash flow, vendor credit, worker wages & multi-site management with RBAC.",
  icons: {
    icon: "/image/logo.png",
    shortcut: "/image/logo.png",
    apple: "/image/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
