import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { HtmlLangUpdater } from "./components/HtmlLangUpdater";

export const metadata: Metadata = {
  title: "Check with me.",
  description: "Check facts and detect misinformation",
  keywords: ["fact check", "AI", "misinformation", "truth", "verification", "check", "claims"],
  authors: [{ name: "Check with me" }],
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
      <body className="antialiased">
        <LanguageProvider>
          <HtmlLangUpdater />
          <a href="#main-content" className="skip-to-main">
            Skip to main content
          </a>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
