import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fact Checker - AI-Powered Verification",
  description: "Verify the accuracy of any text using AI-powered fact-checking",
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
