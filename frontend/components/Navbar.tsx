"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, Upload, RefreshCw, Calendar, CheckCircle2 } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      await fetch(`${baseUrl}/api/reset-seed`, { method: "POST" });
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        router.push("/");
        router.refresh();
      }, 800);
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Main Navigation"
      className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" aria-label="NyayaTrack Homepage" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform" aria-hidden="true">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">NyayaTrack</span>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                MVP
              </span>
            </div>
            <p className="text-xs text-gray-400">Legal-Document Copilot</p>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            aria-label="View Document Timeline"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800/80 transition-colors"
          >
            <Calendar className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span>Timeline</span>
          </Link>

          <Link
            href="/upload"
            aria-label="Intake New Document"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Intake Document</span>
          </Link>

          <button
            onClick={handleReset}
            disabled={resetting}
            aria-label="Reset to seeded demo state for judging"
            title="Reset to seeded demo state for judging"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-amber-300 hover:bg-gray-800 transition-colors border border-gray-800"
          >
            {resetDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Reset</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin text-amber-400" : ""}`} />
                <span className="hidden sm:inline">Reset Demo Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
