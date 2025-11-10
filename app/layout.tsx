import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fact Checker - AI-Powered Fact Checking",
  description: "AI-powered fact-checking service to detect misinformation",
  keywords: ["fact-check", "AI", "misinformation", "truth", "verification"],
  authors: [{ name: "Fact Checker Team" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
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
      <body className="antialiased">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
