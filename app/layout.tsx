import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
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
    <html lang="en">
      <body className={`${display.variable} ${display.className} antialiased`}>
        <div className="min-h-dvh bg-[var(--paper)] text-[var(--ink)] md:flex">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col md:min-h-dvh">
            <div className="flex-1">{children}</div>
            <footer className="border-t border-[var(--line)] px-6 py-6 md:px-12">
              <p className="text-xs tracking-widest text-[#555555] uppercase transition-colors hover:text-white">
                TJAY JEWELER © 2026 — Powered by Techooch
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
