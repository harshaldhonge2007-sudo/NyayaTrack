import type { Metadata } from "next";
import "./globals.css";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NyayaTrack — Legal-Document Copilot",
  description: "Recurring legal-document copilot for Indian gig workers, freelancers, and small tenants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {/* Skip to Main Content Link for Screen Readers (WCAG 2.1 AA) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <header role="banner">
          <DisclaimerBanner />
          <Navbar />
        </header>
        <main id="main-content" role="main" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 outline-none">
          {children}
        </main>
        <footer role="contentinfo" className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>NyayaTrack MVP — Hackathon Edition</span>
            <span>Grounding verified against Indian Reference Corpus</span>
            <span>Informational guidance only</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
