import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GenPlan - AI-Powered Content Generation & Planning Platform",
  description:
    "Generate viral content ideas with AI, plan your content calendar, and auto-publish to all major platforms. The all-in-one platform for content creators.",
  keywords: [
    "content generator",
    "AI content creation",
    "social media planner",
    "content calendar",
    "content marketing",
    "AI writing tool",
    "GenPlan",
  ],
  openGraph: {
    title: "GenPlan - AI-Powered Content Generation & Planning",
    description:
      "Generate viral content ideas with AI, plan your content calendar, and auto-publish to all major platforms.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GenPlan",
    description: "AI-Powered Content Generation & Planning Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
