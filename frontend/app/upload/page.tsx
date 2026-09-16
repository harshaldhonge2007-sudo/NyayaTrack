"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Scale
} from "lucide-react";

const SAMPLE_DEMO_TEXT = `LEGAL NOTICE & TENANCY REVISION

Date: 12th September 2026
From: Rajesh Sharma, Landlord & Owner of Flat 304, Green Glen Layout, Bellandur, Bengaluru - 560103
To: Priya Sharma (Tenant), Residing at Flat 304, Green Glen Layout, Bellandur, Bengaluru

SUBJECT: FORMAL NOTICE OF RENT REVISION AND TENANCY RENEWAL CONDITIONS

Dear Priya Sharma,

With reference to our original Residential Tenancy Agreement dated 15th March 2026 expiring shortly, please take notice that continuing the tenancy for the upcoming term will be governed under revised commercial terms:

1. REVISED MONTHLY RENT: Effective from 1st October 2026, the revised monthly rent shall be ₹29,500 payable on or before the 5th day of each calendar month.
2. COMPRESSED NOTICE PERIOD: In supersession of previous clauses, either party must serve a notice period of 15 days prior to termination.
3. MANDATORY RESPONSE DEADLINE: You are hereby notified to convey your written acceptance within 10 days of receipt of this notice, failing which you must vacate the premises by 30th September 2026.
4. UNILATERAL TERMINATION RIGHT: The Landlord reserves sole discretion and unilateral right to cancel the tenancy upon seven (7) days written notice without assigning any reason.
5. DEPOSIT FORFEITURE STIPULATION: In the event of any unauthorized holdover or failure to accept the revised rent, the Landlord shall forfeit the entire security deposit of ₹1,50,000 as liquidated damages.

Kindly sign and return a duplicate copy within 10 calendar days.

Sincerely,
Rajesh Sharma
Landlord / Property Owner`;

export default function IntakePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("Lease Renewal & Revision Notice (Flat 304)");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Processing pipeline states
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const steps = [
    { title: "Ingestion & Text/OCR Parsing", desc: "Extracting text layer and fallback OCR verification" },
    { title: "Auto-Classification", desc: "Detecting document type (Notice / Agreement / Contract)" },
    { title: "Structured Field Extraction", desc: "Extracting parties, dates, amounts with verbatim source verification" },
    { title: "Clause Risk Flagging", desc: "Cross-referencing against Indian tenancy & contract guidelines" },
    { title: "Timeline Integration & Math", desc: "Computing pure-code deadline countdowns and diffs" },
  ];

  const handlePreFill = () => {
    setTab("paste");
    setRawText(SAMPLE_DEMO_TEXT.trim());
    setTitle("Lease Renewal & Revision Notice (Flat 304)");
  };

  const handleStartIntake = async () => {
    if (tab === "paste" && !rawText.trim()) {
      setErrorMsg("Please paste document text or load the demo sample.");
      return;
    }
    if (tab === "upload" && !selectedFile) {
      setErrorMsg("Please select a file to upload.");
      return;
    }

    setErrorMsg(null);
    setProcessing(true);
    setCurrentStep(1);

    // Multi-stage stepper simulation while API processes
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      const formData = new FormData();
      formData.append("title", title || "Uploaded Document");

      if (tab === "upload" && selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("raw_text", rawText);
      }

      const res = await fetch("http://localhost:8000/api/documents/intake", {
        method: "POST",
        body: formData,
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to intake document");
      }

      const data = await res.json();
      setCurrentStep(5);

      setTimeout(() => {
        router.push(`/document/${data.id}`);
      }, 700);
    } catch (e: any) {
      clearInterval(stepInterval);
      setProcessing(false);
      setErrorMsg(e.message || "An error occurred during document intake");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
          <Scale className="w-3.5 h-3.5" />
          <span>Multi-Stage Ingestion Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Intake Legal Notice or Agreement
        </h1>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Upload any tenancy notice, freelance contract, or legal demand. Our pipeline extracts obligations,
          verifies source quotes, and flags unusual terms against standard Indian legal templates.
        </p>
      </div>

      {/* Demo Script 1-Click Fast Track Button */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">
              1-Click Demo Fast Track
            </span>
            <p className="text-sm font-semibold text-white">
              Load &ldquo;Lease Renewal & Revision Notice&rdquo;
            </p>
            <p className="text-xs text-gray-400">
              Pre-populates the Section 5 hackathon demo notice (+18% rent, 15-day notice, 10-day deadline)
            </p>
          </div>
        </div>
        <button
          onClick={handlePreFill}
          className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105"
        >
          Load Demo Document
        </button>
      </div>

      {/* Main Intake Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Document Title Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Document Label / Reference Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lease Renewal Notice - Flat 304"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Tab Toggle: Paste vs Upload */}
        <div className="flex items-center border-b border-gray-800">
          <button
            onClick={() => setTab("paste")}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              tab === "paste"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Document Text</span>
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              tab === "upload"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File (PDF / Image)</span>
          </button>
        </div>

        {/* Tab Content */}
        {tab === "paste" ? (
          <div>
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste legal notice, rent escalation letter, or contract text here..."
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs sm:text-sm text-gray-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-800 hover:border-indigo-500/50 rounded-2xl text-center space-y-4 transition-colors">
            <UploadCloud className="w-10 h-10 text-gray-500 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-200">
                {selectedFile ? selectedFile.name : "Select a PDF, PNG, JPG, or TXT file"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Direct text extraction + Tesseract OCR fallback supported
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>
        )}

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Action Button */}
        <div>
          <button
            onClick={handleStartIntake}
            disabled={processing}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Pipeline ({currentStep}/5)...</span>
              </>
            ) : (
              <>
                <span>Run Analysis & Timeline Diff</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visible Pipeline Processing Indicators (Section 8 requirement) */}
      {processing && (
        <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4 animate-in fade-in duration-300 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Live Ingestion Pipeline Stepper</span>
            </h3>
            <span className="text-xs text-indigo-400 font-mono">Stage {currentStep} of 5</span>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    isCompleted
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                      : isCurrent
                      ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-200 shadow-md"
                      : "bg-gray-950/40 border-gray-800/60 text-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      ) : (
                        <span className="text-gray-600">{stepNum}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-200">{step.title}</p>
                      <p className="text-[11px] text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {isCompleted ? "Verified" : isCurrent ? "Processing..." : "Queued"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
