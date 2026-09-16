"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  ShieldCheck,
  CheckSquare,
  FileQuestion,
  Languages,
  Copy,
  Check,
  PhoneCall,
  GitCompare,
  Quote,
  Clock,
  Sparkles
} from "lucide-react";

import ClauseRiskCard, { FlaggedClause } from "@/components/ClauseRiskCard";
import DocumentDiffView, { DocumentComparisonResult } from "@/components/DocumentDiffView";
import GroundedQABox from "@/components/GroundedQABox";
import LawyerModal from "@/components/LawyerModal";

interface DocumentDetailRecord {
  id: string;
  title: string;
  filename?: string;
  upload_date: string;
  content_text: string;
  extraction: {
    document_type: string;
    confidence: number;
    parties: string[];
    key_dates: { label: string; date: string; source_quote: string; is_grounded: boolean }[];
    amounts: { label: string; value: string; source_quote: string; is_grounded: boolean }[];
    obligations: { party: string; obligation: string; source_quote: string; is_grounded: boolean }[];
    flagged_clauses: FlaggedClause[];
    grounding_ok: boolean;
    raw_summary: string;
    summary_hi: string;
  };
  deadlines: {
    id: string;
    label: string;
    target_date: string;
    days_remaining: number | null;
    status: string;
  }[];
  checklist: string[];
  questions_for_lawyer: string[];
}

export default function DocumentDetailPage() {
  const params = useParams();
  const docId = params.id as string;

  const [document, setDocument] = useState<DocumentDetailRecord | null>(null);
  const [comparison, setComparison] = useState<DocumentComparisonResult | null>(null);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [copiedChecklist, setCopiedChecklist] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const [isLawyerModalOpen, setIsLawyerModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) return;

    const fetchDoc = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/documents/${docId}`);
        if (!res.ok) throw new Error("Document not found");
        const data = await res.json();
        setDocument(data);

        // Check if there is a prior document to compare against
        // If this is a notice or newly uploaded doc, compare against the seeded lease or freelance doc
        if (data.id !== "doc_lease_001") {
          try {
            const compRes = await fetch(`http://localhost:8000/api/compare/${data.id}/doc_lease_001`);
            if (compRes.ok) {
              const compData = await compRes.json();
              setComparison(compData);
            }
          } catch (err) {
            console.log("No comparison target found", err);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docId]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading document intelligence...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm text-gray-400">Document not found.</p>
        <Link href="/" className="text-xs text-indigo-400 font-semibold underline">
          Return to Timeline
        </Link>
      </div>
    );
  }

  const { extraction } = document;
  const isGroundingOk = extraction.grounding_ok;
  const flaggedCount = extraction.flagged_clauses.length;

  const handleCopyChecklist = () => {
    const text = document.checklist.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2000);
  };

  const handleCopyQuestions = () => {
    const text = document.questions_for_lawyer.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {extraction.document_type}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                Confidence: {Math.round(extraction.confidence * 100)}%
              </span>
              {isGroundingOk ? (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Grounding 100% Verified</span>
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Manual Review Advised</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {document.title}
            </h1>
          </div>
        </div>

        {/* Header Right CTAs */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-gray-300 transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === "en" ? "Translate to हिन्दी" : "Show English"}</span>
          </button>

          {/* Talk to Lawyer CTA */}
          <button
            onClick={() => setIsLawyerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-105"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Talk to a Lawyer</span>
          </button>
        </div>
      </div>

      {/* Bilingual Plain-Language Summary Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-gray-900 via-indigo-950/20 to-gray-900 border border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Plain-Language Summary ({language === "en" ? "English" : "हिन्दी"})</span>
          </span>
          <span className="text-[11px] text-gray-400 font-mono">
            {language === "en" ? "Non-Lawyer Plain English" : "सरल हिंदी अनुवाद"}
          </span>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed font-sans">
          {language === "en" ? extraction.raw_summary : extraction.summary_hi}
        </p>
      </div>

      {/* KILLER FEATURE: Side-by-side Timeline Comparison Panel (if available) */}
      {comparison && comparison.differences.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Cross-Document Diff (Timeline Intelligence)
              </h2>
            </div>
            <span className="text-xs text-amber-400 font-semibold">
              {comparison.differences.length} Material Changes Detected
            </span>
          </div>
          <DocumentDiffView comparison={comparison} />
        </section>
      )}

      {/* Risk Analysis Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Clause Risk & Deviation Analysis ({flaggedCount})
            </h2>
          </div>
          <span className="text-xs text-gray-400">
            Compared against Indian Model Tenancy & Contract Guidelines
          </span>
        </div>

        {flaggedCount === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No high-risk clauses or aggressive unilateral terms flagged in this document.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {extraction.flagged_clauses.map((clause, idx) => (
              <ClauseRiskCard key={idx} clause={clause} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* Extracted Structured Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parties & Amounts */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Identified Parties</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {extraction.parties.length > 0 ? (
                extraction.parties.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-800 text-gray-200 text-xs rounded-lg border border-gray-700 font-medium"
                  >
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No explicit parties named</span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-800/80">
            <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Financial Obligations & Amounts</span>
            </span>
            <div className="space-y-2">
              {extraction.amounts.map((amt, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800/80 flex items-center justify-between text-xs"
                >
                  <span className="text-gray-300 font-medium">{amt.label}</span>
                  <span className="font-mono text-emerald-400 font-bold">{amt.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deadlines & Obligations */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Extracted Deadlines & Timelines</span>
            </span>
            <div className="space-y-2">
              {document.deadlines.map((dl, idx) => {
                const isUrgent = dl.status === "urgent";
                const isUpcoming = dl.status === "upcoming";
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-300">{dl.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-200">{dl.target_date}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : isUpcoming
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {dl.days_remaining !== null ? `${dl.days_remaining}d left` : "Date"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Checklist & Questions for Lawyer Brief */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Checklist */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-indigo-400 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Actionable Checklist</span>
            </span>
            <button
              onClick={handleCopyChecklist}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              {copiedChecklist ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedChecklist ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div className="space-y-2">
            {document.checklist.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed"
              >
                <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Questions to Ask Lawyer */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Questions to Ask an Advocate</span>
            </span>
            <button
              onClick={handleCopyQuestions}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              {copiedQuestions ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedQuestions ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div className="space-y-2">
            {document.questions_for_lawyer.map((q, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed"
              >
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  ?
                </span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grounded Interactive Q&A Copilot */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Ask Questions on this Document
          </h2>
          <span className="text-xs text-gray-400">
            Answers cite exact document sentences and verified reference corpus
          </span>
        </div>
        <GroundedQABox
          documentId={document.id}
          onOpenLawyerModal={() => setIsLawyerModalOpen(true)}
        />
      </section>

      {/* Lawyer Consultation Modal */}
      <LawyerModal
        isOpen={isLawyerModalOpen}
        onClose={() => setIsLawyerModalOpen(false)}
        documentTitle={document.title}
        flaggedClausesCount={flaggedCount}
        questions={document.questions_for_lawyer}
      />
    </div>
  );
}
