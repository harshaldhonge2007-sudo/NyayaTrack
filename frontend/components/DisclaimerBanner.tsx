import React from "react";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div
      role="region"
      aria-label="Legal Disclaimer"
      className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between shadow-inner"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2 w-full justify-center text-center">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Informational Guidance Only — Not Legal Advice:</strong> NyayaTrack organizes timelines, flags unusual clauses, and extracts deadlines. We never issue legal verdicts or predict court rulings.
        </span>
      </div>
    </div>
  );
}
