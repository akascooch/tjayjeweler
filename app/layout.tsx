import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const amiri = localFont({
  src: [
    { path: "../font/Amiri/Amiri-Regular.ttf", weight: "400", style: "normal" },
    { path: "../font/Amiri/Amiri-Bold.ttf", weight: "700", style: "normal" },
    { path: "../font/Amiri/Amiri-Italic.ttf", weight: "400", style: "italic" },
    { path: "../font/Amiri/Amiri-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-body",
  display: "swap",
});

const cormorant = localFont({
  src: [
    { path: "../font/Cormorant_Unicase/CormorantUnicase-Regular.ttf", weight: "400", style: "normal" },
    { path: "../font/Cormorant_Unicase/CormorantUnicase-Medium.ttf", weight: "500", style: "normal" },
    { path: "../font/Cormorant_Unicase/CormorantUnicase-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../font/Cormorant_Unicase/CormorantUnicase-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const scienceGothic = localFont({
  src: [
    { path: "../font/Science_Gothic/static/ScienceGothic-Regular.ttf", weight: "400", style: "normal" },
    { path: "../font/Science_Gothic/static/ScienceGothic-Medium.ttf", weight: "500", style: "normal" },
    { path: "../font/Science_Gothic/static/ScienceGothic-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../font/Science_Gothic/static/ScienceGothic-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tjayjeweler.com"),
  title: "TJAY JEWELER",
  description: "Sterling silver jewelry",
  applicationName: "TJAY JEWELER",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48 32x32 16x16" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    title: "TJAY",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${amiri.variable} ${cormorant.variable} ${scienceGothic.variable}`}>
      <body className="antialiased">
        <div className="flex min-h-dvh min-w-0 flex-col bg-[var(--paper)] text-[var(--ink)]">
          <SiteHeader />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-w-0 flex-1">{children}</div>
            <footer className="border-t border-[var(--line)] px-4 py-6 sm:px-8">
              <p className="font-ui text-xs tracking-[0.18em] text-[#555555] uppercase">
                TJAY JEWELER © 2026 — Powered by Techooch
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
