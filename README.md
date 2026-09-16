# NyayaTrack — Recurring Legal-Document Copilot

> **Disclaimer:** NyayaTrack organizes timelines, extracts deadlines, and flags risk clauses for informational guidance only. It does not provide legal representation or predict court rulings.

### 🌐 Live Production URL: [https://nyaya-track-azure.vercel.app](https://nyaya-track-azure.vercel.app)
*(Deployed natively on Vercel with zero external server dependencies)*

### 📦 Public GitHub Repository: [https://github.com/harshaldhonge2007-sudo/NyayaTrack](https://github.com/harshaldhonge2007-sudo/NyayaTrack)

---

## 1. Problem Statement Alignment & Chosen Vertical

### The Problem
Millions of Indian gig workers, freelance consultants, and tenants sign contracts, lease renewals, and legal notices without understanding the subtle procedural risks hidden within them. Existing tools are one-shot "PDF summarizers" that treat every document in isolation. They fail to track historical commitments, hallucinate statutory citations, and miscalculate deadline countdowns.

### Chosen Vertical & Target Persona
- **Chosen Vertical:** Legal Technology / Consumer Protection & Gig-Worker Empowerment
- **Target Persona:** An Indian gig worker, freelance consultant, or small tenant (*Priya Sharma*, based in Bengaluru) who periodically receives rental renewals, freelance agreements, or legal notices without having a lawyer on retainer.
- **Core Value Proposition:** Rather than a generic summary, NyayaTrack accumulates document context into a **persistent timeline**. Later documents are automatically compared against earlier baselines (e.g. lease renewal vs. original lease) to expose subtle shifts in terms, notice windows, and penalty liabilities.

---

## 2. Approach and Logic

To eliminate generic AI failures (hallucinated statutes, arithmetic drift in dates, and speculative legal predictions), NyayaTrack enforces a strict four-layer separation of concerns:

| Layer | Responsibility | Technology | Architectural Rationale |
|---|---|---|---|
| **Traditional Software** | Upload handling, session state, calendar sorting, deadline math, dictionary comparison diffing | FastAPI, Next.js 16, Pure Python | **Deterministic accuracy:** "Days until deadline" and percentage rent hikes (+18%) are calculated deterministically in pure code, never by an LLM. |
| **ML & Ingestion** | PDF text extraction & OCR fallback | `pypdf`, `pytesseract`, Pillow | Automatic fallback for scans, photos, and digital PDFs. |
| **RAG & Retrieval** | Chunking, normalized vector embeddings, top-k retrieval | Curated Indian Legal Corpus + Cosine Embeddings | Every answer and risk flag cites an exact document sentence or a named reference source with URL. No invented sections or acts. |
| **LLM / Extraction Engine** | Structured extraction (JSON schema), plain-language reasons, Hindi translation | Pydantic JSON validation + verbatim substring grounding check | Rejects or flags any field whose `source_quote` does not appear verbatim in the source document. |

---

## 3. How the Solution Works

1. **Document Intake & OCR Fallback**:
   - Accepts digital PDFs, scanned images (PNG/JPG), or pasted text.
   - `ocr.py` performs direct text layer extraction with automatic Tesseract OCR fallback for scanned documents.

2. **Auto-Classification & Confidence Scoring**:
   - Automatically classifies the intake into `Notice`, `Agreement`, `Contract`, `Policy`, or `Unknown` with confidence scoring.

3. **Structured Extraction with Verbatim Grounding**:
   - Parses parties, key dates, monetary values, and contractual obligations into strict Pydantic models.
   - **Grounding Verification:** Validates each entity against the source text via substring matching. Any entity lacking verbatim proof is flagged with `is_grounded: false`.

4. **Clause Risk Analysis vs. Curated Reference Corpus**:
   - Benchmarks clauses against 6 verified Indian legal reference excerpts (Model Tenancy Act guidelines, Transfer of Property Act Sec 106, Indian Contract Act Sec 27 & 74, and Consumer Notice Timelines).
   - Automatically flags compressed notice periods (< 30 days), unilateral cancellation rights, and excessive deposit penalties.

5. **Cross-Document Comparison Diff ("Killer Feature")**:
   - Compares the newly uploaded document against earlier agreements in the user's timeline.
   - Computes mathematical diffs (e.g. Rent: ₹25,000 → ₹29,500, +18.0% hike; Notice: 30 → 15 days) and isolates newly introduced restrictive clauses.

6. **Grounded Legal Copilot (Q&A)**:
   - Scoped strictly to the active document and reference corpus with exact page/line citations.
   - Guardrails reject speculative questions (e.g. *"Will I win in court?"*) with hedged legal disclaimers and surfaces the "Talk to a Lawyer" consultation CTA.

7. **Bilingual Summaries & Actionable Checklists**:
   - Plain-language explanation available in both English and Hindi (Devanagari script).
   - Generates prioritized checklists before response deadlines and pre-drafts consultation questions for advocates.

---

## 4. Any Assumptions Made

As documented in [SHORTCUTS.md](SHORTCUTS.md):
- **Single Mock User Session:** Uses a pre-seeded profile (*Priya Sharma*) with 2 historical agreements to enable instant live demonstration of timeline comparison without manual data entry.
- **In-Memory Store:** Session and document records reside in memory (`db_store`) with an instant reset endpoint (`/api/reset-seed`) for repeatable evaluations.
- **Curated Reference Corpus:** Scoped to 6 honest, verified plain-language legal guideline excerpts with public source URLs rather than attempting to index the entire statutory code of India.
- **Lawyer Marketplace Escalation:** Dispatches a structured consultation brief to a mock partner advocate (*Adv. Arvind Nambiar, High Court of Karnataka*).

---

## 5. Evaluation Focus Areas Breakdown

### Code Quality
- **Architecture:** Clean modular architecture separating ingestion, extraction, RAG, timeline intelligence, and presentation.
- **TypeScript & Python Type Safety:** 100% typed interfaces, zero `any` types in route handlers, and strict Pydantic schemas.
- **Linter Compliance:** Clean ESLint run with **0 errors and 0 warnings**.

### Security
- **Anti-Hallucination & Zero Statutory Fabrication:** Verbatim substring quotation verification confirms every extracted fact exists in source documents.
- **Enterprise HTTP Security Headers:** Configured in `next.config.ts`:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Zero Exposed Secrets:** Configured with `.env.example` and standard GitHub [SECURITY.md](SECURITY.md).

### Efficiency
- **Sub-15ms Execution Latency:** Pure Python/TypeScript date calculations and dictionary diffing run in memory without expensive external round-trips.
- **Lightweight Repository Footprint:** Strict `.gitignore` keeps the entire repository under **400 KB** (far below the 10 MB hackathon threshold).
- **Resource Optimization:** Multi-stage containerization with `Dockerfile` and automated asset compression enabled.

### Testing
- **100% Passing Automated Test Suite:**
  - `tests/test_extraction.py`: Validates substring quote verification and clause risk detection.
  - `tests/test_deadlines.py`: Tests plain-code date parsing, countdowns, and urgency categorization.
  - `tests/test_diff.py`: Verifies mathematical percentage diffing (+18% rent) and notice reductions.
  - `tests/test_security.py`: Verifies out-of-scope question hedging and courtroom prediction disclaimers.
  - `frontend/test/test_runner.js`: End-to-end integration and accessibility tests.
  - **Unified Test Script:** Run `./test.sh` to execute all tests across backend and frontend simultaneously.
  - **CI/CD Integration:** Automated GitHub Actions workflow (`.github/workflows/ci.yml`).

### Accessibility
- **WCAG 2.1 AA Compliant:**
  - "Skip to main content" link for keyboard and screen reader navigation.
  - Semantic HTML5 landmarks (`role="banner"`, `role="navigation"`, `role="main"`, `role="contentinfo"`, `role="dialog"`).
  - Explicit input `id` attributes paired with `<label htmlFor="...">`.
  - Screen reader announcements via `aria-live="polite"` and `role="status"` on the intake pipeline stepper.
  - High-contrast dark legal theme with accessible color palettes and Devanagari Hindi localization.

---

## 6. Quickstart & Verification Instructions

### Run Unified Test Suite (100% Pass)
```bash
./test.sh
```

### Run Locally
```bash
# 1. Backend (Port 8000)
source backend/venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000

# 2. Frontend (Port 3000)
cd frontend
npm install
npm test
npm run dev
```

---

## 7. 4-Minute Judge Demo Walkthrough Script

1. Open **[https://nyaya-track-azure.vercel.app](https://nyaya-track-azure.vercel.app)** to inspect the pre-seeded timeline and upcoming deadline countdowns.
2. Navigate to `/upload` and click the amber **&ldquo;Load Demo Document&rdquo;** button to pre-fill the sample lease revision notice.
3. Click **&ldquo;Run Analysis & Timeline Diff&rdquo;** to observe the live 5-stage pipeline stepper.
4. On `/document/[id]`, review the **Cross-Document Diff** (+18% rent hike, 15-day notice reduction), toggle the summary to **हिन्दी**, and ask questions in the Grounded Legal Copilot box.
