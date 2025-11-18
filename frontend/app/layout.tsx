import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Content Generator & Planner - AI-Powered Content Creation Platform",
  description: "Create engaging content ideas with AI, plan your content calendar, and optimize posts for all major social media platforms. Free, Pro, and Agency plans available.",
  keywords: ["content generator", "AI content creation", "social media planner", "content calendar", "content marketing", "AI writing tool"],
  openGraph: {
    title: "Content Generator & Planner - AI-Powered Content Creation",
    description: "Create engaging content ideas with AI, plan your content calendar, and optimize posts for all major social media platforms.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Content Generator & Planner",
    description: "AI-Powered Content Creation Platform",
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
        {children}
      </body>
    </html>
  );
}
