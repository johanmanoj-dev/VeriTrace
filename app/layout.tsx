import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeriTrace — Multimodal Media Verification",
  description:
    "Analyze potentially AI-generated or manipulated media using multimodal analysis and contextual sources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-neutral-50/40 text-neutral-900 selection:bg-neutral-900 selection:text-white">
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-neutral-950 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <Header />
          <main id="main-content" className="flex flex-1 flex-col">
            {children}
          </main>
          <footer className="border-t border-neutral-200/80 bg-white py-6">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-neutral-500">
              <span className="font-medium text-neutral-800">VeriTrace</span>
              <span>AI detection is not proof. Review the evidence.</span>
            </div>
          </footer>
        </AuthProvider>

        {/* Polite ARIA live region */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          id="aria-announcer"
          className="sr-only"
        />
      </body>
    </html>
  );
}
