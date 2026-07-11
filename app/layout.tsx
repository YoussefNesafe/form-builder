import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Form Builder — Design forms visually, ship real React code",
    template: "%s · Form Builder",
  },
  description:
    "Visual form builder that exports type-safe, Zod-validated React Hook Form code. 24 field types, multi-step wizards, conditional logic — code you own, no hosted service.",
  openGraph: {
    title: "Form Builder — Design forms visually, ship real React code",
    description:
      "Visual form builder that exports type-safe, Zod-validated React Hook Form code. 24 field types, multi-step wizards, conditional logic — code you own, no hosted service.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Analytics />
        <SpeedInsights />
        {children}
      </body>
    </html>
  );
}
