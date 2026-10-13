import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TJAY JEWELER",
  description: "Sterling silver jewelry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <div className="min-h-dvh bg-[var(--paper)] text-[var(--ink)] md:flex">
            <Sidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
