import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { HtmlLangUpdater } from "./components/HtmlLangUpdater";
import StructuredData from "./components/StructuredData";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "Check with me - AI-Powered Fact Checker",
    template: "%s | Check with me",
  },
  description: "Fast, AI-powered fact-checking tool. Verify claims, detect misinformation, and get accurate answers with citations. Free fact checker supporting multiple languages.",
  keywords: [
    "fact check",
    "fact checker",
    "AI fact checking",
    "misinformation detection",
    "truth verification",
    "claim verification",
    "fake news detector",
    "information verification",
    "citation checker",
    "source verification",
    "AI verification tool",
    "multilingual fact checker",
    "Korean fact checker",
    "팩트체크",
    "사실확인",
  ],
  authors: [{ name: "Check with me", url: "https://chqwm.vercel.app" }],
  creator: "Check with me",
  publisher: "Check with me",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
    url: "https://chqwm.vercel.app",
    siteName: "Check with me",
    title: "Check with me - AI-Powered Fact Checker",
    description: "Fast, AI-powered fact-checking tool. Verify claims, detect misinformation, and get accurate answers with citations.",
    images: [
      {
        url: "https://chqwm.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Check with me - AI-Powered Fact Checker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Check with me - AI-Powered Fact Checker",
    description: "Fast, AI-powered fact-checking tool. Verify claims and detect misinformation.",
    images: ["https://chqwm.vercel.app/og-image.png"],
    creator: "@checkwithme",
  },
  metadataBase: new URL("https://chqwm.vercel.app"),
  alternates: {
    canonical: "https://chqwm.vercel.app",
    languages: {
      en: "https://chqwm.vercel.app",
      ko: "https://chqwm.vercel.app",
    },
  },
  verification: {
    google: "XhsRvfRAAu6PTtmMr77mL38Rt13IYuZNfsREBxd0Xt8",
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <HtmlLangUpdater />
          <a href="#main-content" className="skip-to-main">
            Skip to main content
          </a>
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
