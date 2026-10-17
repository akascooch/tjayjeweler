import type { Metadata } from "next";
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
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
