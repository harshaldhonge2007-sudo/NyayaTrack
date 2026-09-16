"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  AlertCircle,
  Clock,
  FileText,
  Upload,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2
} from "lucide-react";

interface ComputedDeadline {
  id: string;
  document_id: string;
  document_title: string;
  label: string;
  target_date: string;
  days_remaining: number | null;
  status: "urgent" | "upcoming" | "future" | "expired" | "no_date";
}

interface DocumentRecord {
  id: string;
  title: string;
  filename: string;
  upload_date: string;
  extraction: {
    document_type: string;
    confidence: number;
    parties: string[];
    amounts: { label: string; value: string }[];
    flagged_clauses: { risk_level: string; reason: string }[];
    raw_summary: string;
  };
  deadlines: ComputedDeadline[];
}

export default function TimelineDashboard() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [deadlines, setDeadlines] = useState<ComputedDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const [docsRes, dlRes] = await Promise.all([
        fetch(`${baseUrl}/api/documents`),
        fetch(`${baseUrl}/api/deadlines`),
      ]);
      const docs = await docsRes.json();
      const dls = await dlRes.json();
      setDocuments(docs || []);
      setDeadlines(dls || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const urgentCount = deadlines.filter((d) => d.status === "urgent").length;
  const upcomingCount = deadlines.filter((d) => d.status === "upcoming").length;

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-gray-900 to-gray-950 p-6 sm:p-8 border border-indigo-500/20 shadow-xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recurring Legal-Document Timeline</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Never sign in the dark. Accumulate context over time.
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            NyayaTrack builds an intelligent running timeline across all your rental leases, freelance
            contracts, and legal notices — comparing new revisions against earlier terms to expose hidden shifts.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4" />
              <span>Intake New Document</span>
            </Link>
            <div className="flex items-center gap-4 text-xs text-gray-400 px-2">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Hallucinations</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Plain-Code Math</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deadlines Radar Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Upcoming Obligation Deadlines ({deadlines.length})
              </h3>
            </div>
            <span className="text-xs text-gray-400">Pure Python Date Math</span>
          </div>

          {deadlines.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No active deadlines recorded.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {deadlines.slice(0, 4).map((dl, idx) => {
                const isUrgent = dl.status === "urgent";
                const isUpcoming = dl.status === "upcoming";
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-gray-950/70 border border-gray-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-gray-200 truncate">{dl.label}</p>
                      <p className="text-gray-400 text-[11px] truncate">{dl.document_title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-gray-300">{dl.target_date}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          isUrgent
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : isUpcoming
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {dl.days_remaining !== null
                          ? dl.days_remaining >= 0
                            ? `${dl.days_remaining}d left`
                            : "Past date"
                          : "Scheduled"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats Summary Card */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              User Profile Intelligence
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Mock Persona:</span>
                <span className="text-xs font-semibold text-white">Priya Sharma (Freelancer / Tenant)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Tracked Documents:</span>
                <span className="text-xs font-bold text-indigo-400">{documents.length} in timeline</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Urgent Notice Windows:</span>
                <span className="text-xs font-bold text-rose-400">{urgentCount} urgent</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <Link
              href="/upload"
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Intake Document to Compare</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Persistent Document Timeline List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Your Document Timeline</h2>
            <p className="text-xs text-gray-400">Documents accumulate context over time</p>
          </div>
          <Link
            href="/upload"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>+ Add Document</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading timeline documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-gray-800 space-y-3">
            <FileText className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm text-gray-400">No documents in timeline yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const hasRisks = doc.extraction.flagged_clauses.length > 0;
              const rentVal = doc.extraction.amounts.find((a) =>
                a.label.toLowerCase().includes("rent")
              )?.value;

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 p-5 space-y-3 transition-all hover:shadow-xl group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {doc.extraction.document_type}
                      </span>
                      <span className="text-xs text-gray-500">{doc.upload_date}</span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {doc.title}
                    </h3>

                    {doc.extraction.parties.length > 0 && (
                      <p className="text-xs text-gray-400">
                        Parties: <span className="text-gray-300">{doc.extraction.parties.join(", ")}</span>
                      </p>
                    )}

                    {rentVal && (
                      <p className="text-xs text-gray-400">
                        Financial obligation: <span className="text-emerald-400 font-mono font-semibold">{rentVal}</span>
                      </p>
                    )}

                    {/* Risk Badge indicator */}
                    {hasRisks ? (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{doc.extraction.flagged_clauses.length} clause(s) flagged as high/unusual risk</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Clauses align with standard reference conventions</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {doc.deadlines.length} deadline(s) extracted
                    </span>
                    <Link
                      href={`/document/${doc.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Inspect & Compare</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
