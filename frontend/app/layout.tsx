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
        <DisclaimerBanner />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500">
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
