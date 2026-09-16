"use client";

import React, { useState } from "react";
import { AlertCircle, AlertTriangle, ShieldCheck, Quote, ChevronDown, ChevronUp } from "lucide-react";

export interface FlaggedClause {
  clause_text: string;
  risk_level: "low" | "medium" | "high";
  reason: string;
  compared_to: string;
  is_grounded: boolean;
}

interface ClauseRiskCardProps {
  clause: FlaggedClause;
}

export default function ClauseRiskCard({ clause }: ClauseRiskCardProps) {
  const [showQuote, setShowQuote] = useState(true);
  const isHigh = clause.risk_level === "high";
  const isMedium = clause.risk_level === "medium";

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        isHigh
          ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60"
          : isMedium
          ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60"
          : "bg-gray-900/60 border-gray-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isHigh ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span
            className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isHigh
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {clause.risk_level} Risk
          </span>
          <span className="text-xs text-gray-400 font-medium">
            vs {clause.compared_to}
          </span>
        </div>

        {clause.is_grounded && (
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Verbatim in doc</span>
          </span>
        )}
      </div>

      {/* Reason in Plain Language */}
      <p className="text-sm font-medium text-gray-200 mt-2.5 leading-relaxed">
        {clause.reason}
      </p>

      {/* Source Quote Accordion */}
      <div className="mt-3 pt-2.5 border-t border-gray-800/80">
        <button
          onClick={() => setShowQuote(!showQuote)}
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 font-medium"
        >
          <Quote className="w-3.5 h-3.5 text-indigo-400" />
          <span>Source Clause from Document</span>
          {showQuote ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showQuote && (
          <div className="mt-2 p-2.5 rounded-lg bg-gray-950/80 border border-gray-800 text-xs text-gray-300 font-mono italic leading-relaxed">
            &ldquo;{clause.clause_text}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
