"use client";

import React, { useState } from "react";
import { X, ShieldAlert, CheckCircle2, UserCheck, PhoneCall, Scale } from "lucide-react";

interface LawyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  flaggedClausesCount?: number;
  questions?: string[];
}

export default function LawyerModal({
  isOpen,
  onClose,
  documentTitle = "Document",
  flaggedClausesCount = 0,
  questions = [],
}: LawyerModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("Priya Sharma");
  const [city, setCity] = useState("Bengaluru");
  const [phone, setPhone] = useState("+91 98450 XXXXX");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 to-indigo-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Escalate to an Indian Advocate</h3>
              <p className="text-xs text-gray-400">Verified Tenancy & Contract Specialists</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-white">Brief Dispatched to Partner Advocate</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your automated case brief including <strong>{flaggedClausesCount} flagged clause(s)</strong> and
              pre-drafted questions for &ldquo;{documentTitle}&rdquo; has been forwarded to an advocate in <strong>{city}</strong>.
            </p>
            <div className="p-3 bg-gray-800/80 rounded-xl text-xs text-gray-400 text-left border border-gray-700">
              <p className="font-medium text-gray-200 mb-1">Assigned Legal Partner (Demo):</p>
              <p>Adv. Arvind Nambiar, High Court of Karnataka (Tenancy & Commercial Contracts)</p>
              <p className="text-indigo-400 mt-1">Expected Callback: Within 2 business hours</p>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-start gap-3 text-xs text-indigo-200">
              <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                NyayaTrack prepares your questions and clause citations into a structured legal brief so your initial consultation is fast, focused, and cost-effective.
              </span>
            </div>

            {/* Case Brief Preview */}
            <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/60 text-xs space-y-1.5">
              <p className="text-gray-400 font-medium">Auto-Generated Consultation Brief:</p>
              <p className="text-white font-semibold">{documentTitle}</p>
              <p className="text-amber-400">⚠️ {flaggedClausesCount} potentially risky clauses extracted</p>
              {questions.length > 0 && (
                <div className="mt-2 text-gray-300">
                  <p className="text-gray-400 mb-0.5">Top question to clarify:</p>
                  <p className="italic">&ldquo;{questions[0]}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Quick Contact Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">City / Jurisdiction</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2">
              <button
                onClick={() => setSubmitted(true)}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Request Lawyer Consultation Callback</span>
              </button>
              <p className="text-[11px] text-gray-500 text-center mt-2">
                Mock consultation workflow for hackathon demo. Partner verification in ROADMAP.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
