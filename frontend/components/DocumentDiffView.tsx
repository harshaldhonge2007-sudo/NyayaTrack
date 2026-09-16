"use client";

import React from "react";
import { GitCompare, ArrowRight, AlertTriangle, ShieldCheck, TrendingUp, Clock } from "lucide-react";

export interface DiffFieldChange {
  field_name: string;
  old_value: string;
  new_value: string;
  change_type: string;
  plain_language_explanation: string;
  risk_impact: "low" | "medium" | "high";
}

export interface DocumentComparisonResult {
  target_doc_id: string;
  target_doc_title: string;
  prior_doc_id: string;
  prior_doc_title: string;
  differences: DiffFieldChange[];
  summary_explanation: string;
}

interface DocumentDiffViewProps {
  comparison: DocumentComparisonResult;
}

export default function DocumentDiffView({ comparison }: DocumentDiffViewProps) {
  if (!comparison || !comparison.differences || comparison.differences.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-sm text-gray-400">
        No material differences detected between these two documents.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comparison Header Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-gray-900 border border-indigo-500/30">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <GitCompare className="w-4 h-4" />
          <span>Timeline Cross-Document Intelligence</span>
        </div>
        <h4 className="text-sm font-semibold text-white">
          Comparing &ldquo;{comparison.target_doc_title}&rdquo; against &ldquo;{comparison.prior_doc_title}&rdquo;
        </h4>
        <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
          {comparison.summary_explanation}
        </p>
      </div>

      {/* Diff Table / Cards */}
      <div className="space-y-3">
        {comparison.differences.map((diff, index) => {
          const isHighRisk = diff.risk_impact === "high";
          const isMediumRisk = diff.risk_impact === "medium";

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border transition-all ${
                isHighRisk
                  ? "bg-rose-950/20 border-rose-500/40"
                  : isMediumRisk
                  ? "bg-amber-950/20 border-amber-500/40"
                  : "bg-gray-900/60 border-gray-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-200">{diff.field_name}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      isHighRisk
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : isMediumRisk
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {diff.risk_impact} Risk Impact
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400 capitalize">
                  {diff.change_type}
                </span>
              </div>

              {/* Old vs New Values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/80 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-medium">Prior Value (Original)</span>
                  <span className="text-gray-300 font-mono line-through opacity-80">{diff.old_value}</span>
                </div>
                <div className="border-t sm:border-t-0 sm:border-l border-gray-800 pt-1.5 sm:pt-0 sm:pl-3">
                  <span className="text-gray-500 block text-[10px] uppercase font-medium">New Value (This Document)</span>
                  <span className="text-indigo-300 font-mono font-semibold">{diff.new_value}</span>
                </div>
              </div>

              {/* Plain language explanation */}
              <p className="text-xs text-gray-300 leading-relaxed mt-2 flex items-start gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>{diff.plain_language_explanation}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
