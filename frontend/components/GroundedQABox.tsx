"use client";

import React, { useState } from "react";
import { Send, Bot, Bookmark, AlertCircle, PhoneCall, Sparkles } from "lucide-react";

interface QACitation {
  source_type: string;
  source_name: string;
  page_or_line?: string;
  quote: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: QACitation[];
  suggestLawyer?: boolean;
}

interface GroundedQABoxProps {
  documentId: string;
  onOpenLawyerModal: () => void;
}

export default function GroundedQABox({ documentId, onOpenLawyerModal }: GroundedQABoxProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I can answer questions grounded strictly in this document and our curated Indian tenancy/contract reference guidelines. How can I help clarify these terms?",
      citations: [],
      suggestLawyer: false,
    },
  ]);

  const sampleQuestions = [
    "Can the landlord reduce notice period to 15 days?",
    "Will I win if I sue my landlord in court?",
    "Can he legally forfeit my entire security deposit?",
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/api/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, question: q }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations || [],
          suggestLawyer: data.suggest_lawyer || false,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, an error occurred while querying the legal copilot engine.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-800 bg-gray-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide uppercase">Grounded Legal Copilot</h4>
            <p className="text-[11px] text-gray-400">Strictly grounded in document & reference corpus</p>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
          Zero Hallucination Mode
        </span>
      </div>

      {/* Message Feed */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation with legal copilot"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800/90 text-gray-200 border border-gray-700/60"
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>

              {/* Citations Box */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-gray-700/60 space-y-1.5">
                  <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-indigo-400" />
                    <span>Verified Citations ({m.citations.length}):</span>
                  </span>
                  {m.citations.map((c, cIdx) => (
                    <div
                      key={cIdx}
                      className="text-[11px] bg-gray-900/80 p-2 rounded-lg border border-gray-800 text-gray-300 space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-indigo-400 font-medium">
                        <span>{c.source_name}</span>
                        {c.page_or_line && (
                          <span className="text-gray-500 text-[10px]">{c.page_or_line}</span>
                        )}
                      </div>
                      <p className="italic text-gray-400 text-[10px]">&ldquo;{c.quote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Lawyer CTA Prompt */}
              {m.suggestLawyer && (
                <div className="mt-3 pt-2 border-t border-amber-500/30 flex items-center justify-between gap-2 bg-amber-500/10 p-2.5 rounded-xl">
                  <div className="text-[11px] text-amber-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>This dispute warrants specialized advocacy counsel.</span>
                  </div>
                  <button
                    onClick={onOpenLawyerModal}
                    className="shrink-0 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors shadow"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Talk to Lawyer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 bg-gray-800/40 px-3 py-2 rounded-xl max-w-[50%]">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Consulting document & reference corpus...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-gray-800 bg-gray-950/40 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-gray-500 shrink-0 font-medium">Try:</span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 bg-gray-800/90 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full border border-gray-700 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        aria-label="Ask Question Form"
        className="p-3 border-t border-gray-800 bg-gray-950/90 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document or Indian legal norms..."
          aria-label="Question text input"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Submit question to legal copilot"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
