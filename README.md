# NyayaTrack — Recurring Legal-Document Copilot

> **Disclaimer:** NyayaTrack organizes timelines, extracts deadlines, and flags risk clauses for informational guidance only. It does not provide legal representation or predict court rulings.

---

## 1. Chosen Vertical & Persona

- **Vertical**: Legal Technology / Consumer Protection & Gig-Worker Empowerment
- **Target Persona**: An Indian gig worker, freelance consultant, or small tenant (e.g. *Priya Sharma*, based in Bengaluru) who periodically receives notices, lease renewals, or agreements that they do not fully understand and who lacks an in-house legal counsel or retained advocate.
- **Core Value Proposition**: Rather than offering an isolated, one-shot "PDF summarizer," NyayaTrack accumulates document context into a persistent timeline. Later documents are compared against earlier baselines (e.g., lease renewal vs. original lease) to expose subtle shifts in terms, notice windows, and penalty liabilities.

---

## 2. Approach & Architecture

To prevent common failures of generative AI in legal domains (hallucinated statutory sections, arithmetic drift in countdowns, and unfounded predictions), NyayaTrack enforces a strict four-layer separation of concerns:

| Layer | Responsibility | Technology | Architectural Rationale |
|---|---|---|---|
| **Traditional Software** | Upload handling, session state, calendar sorting, deadline math, dictionary comparison diffing | FastAPI, Next.js 16, Pure Python | **Deterministic accuracy:** "Days until deadline" and percentage rent hikes (+18%) are calculated deterministically in pure code, never by an LLM. |
| **ML & Ingestion** | PDF text extraction & OCR fallback | `pypdf`, `pytesseract`, Pillow | Automatic fallback for scans, photos, and digital PDFs. |
| **RAG & Retrieval** | Chunking, normalized vector embeddings, top-k retrieval | Curated Indian Legal Corpus + Cosine Embeddings | Every answer and risk flag cites an exact document sentence or a named reference source with URL. No invented sections or acts. |
| **LLM / Extraction Engine** | Structured extraction (JSON schema), plain-language reasons, Hindi translation | Pydantic JSON validation + verbatim substring grounding check | Rejects or flags any field whose `source_quote` does not appear verbatim in the source document. |

---

## 3. How the Solution Works

1. **Document Intake & OCR Fallback**:
   - The user uploads a digital PDF, scanned image, or pastes text.
   - `ocr.py` runs direct text layer extraction with automatic Tesseract OCR fallback for scanned images.

2. **Auto-Classification & Confidence**:
   - Classifies document into `Notice`, `Agreement`, `Contract`, `Policy`, or `Unknown` with confidence scoring.

3. **Structured Extraction with Verbatim Grounding**:
   - Extracts parties, key dates, monetary values, and obligations into strict Pydantic models.
   - **Grounding Verification:** Validates each entity against the source text via substring matching. Any entity lacking verbatim proof is flagged with `is_grounded: false`.

4. **Clause Risk Analysis vs. Indian Reference Corpus**:
   - Evaluates clauses against a curated reference corpus (Model Tenancy Act guidelines, Transfer of Property Act Sec 106, Indian Contract Act Sec 27 & 74, and Consumer Notice timelines).
   - Flags compressed notice periods (< 30 days), unilateral cancellation rights, and excessive penalties.

5. **Cross-Document Comparison Diff ("Killer Feature")**:
   - Compares the newly uploaded document against earlier agreements in the user's timeline.
   - Computes exact mathematical diffs (e.g. Rent: ₹25,000 → ₹29,500, +18.0% hike) and flags newly inserted restrictive clauses.

6. **Grounded Q&A with Citation Enforcement**:
   - Scoped strictly to the active document and reference corpus.
   - Rejects speculative questions (e.g., *"Will I win in court?"*) with hedged legal disclaimers and surfaces the "Talk to a Lawyer" consultation CTA.

7. **Bilingual Summaries & Actionable Checklists**:
   - Plain-language explanation available in both English and Hindi (Devanagari script).
   - Generates actionable deadlines and pre-drafted consultation questions for advocates.

---

## 4. Assumptions Made (MVP Scope)

As documented in [SHORTCUTS.md](SHORTCUTS.md):
- **Single Mock User Session**: Uses a pre-seeded profile (*Priya Sharma*) with 2 historical agreements to enable instant live demonstration of timeline comparison without manual uploads.
- **In-Memory Store**: Session and document records reside in memory (`db_store`) with an instant reset endpoint (`/api/reset-seed`).
- **Curated Reference Corpus**: Scoped to 6 honest, verified plain-language legal guideline excerpts with public source URLs rather than the entire corpus of Indian statutory codes.
- **Lawyer Marketplace Escalation**: Consultations dispatch a structured legal brief to a mock partner advocate (*Adv. Arvind Nambiar*).

---

## 5. Evaluation Focus Areas Addressed

- **Code Quality**: Modular package structure (`ingestion`, `extraction`, `rag`, `timeline`, `qa`, `translate`, `models`, `db`), strict Pydantic schemas, and typed Next.js components.
- **Security & Hallucination Defense**: Zero statutory fabrication, verbatim source quotation check, and prompt-level fencing against court outcome predictions.
- **Efficiency**: Pure-code execution for dates and diffs (< 15ms latency), normalized term-frequency embeddings, and under 1 MB total repository footprint.
- **Testing**: Complete pipeline test suite (`backend/test_pipeline.py`) validating extraction, deadline calculations, diffing, and Q&A hedging.
- **Accessibility & Design**: Modern dark theme with high-contrast text, keyboard-navigable forms, visible multi-stage pipeline indicators, and Hindi localization.

---

## 6. Quickstart Instructions

### Backend (FastAPI)
```bash
# From repository root:
source backend/venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### Frontend (Next.js 16 + Tailwind CSS)
```bash
# In a second terminal:
cd frontend
npm run dev
```
Frontend will run at `http://localhost:3000`.

### Run Automated Test Suite
```bash
PYTHONPATH=backend backend/venv/bin/python3 backend/test_pipeline.py
```

---

## 7. 4-Minute Demo Script Walkthrough

1. Open `http://localhost:3000` to inspect the pre-seeded timeline and upcoming deadline countdowns.
2. Navigate to `/upload` and click **&ldquo;Load Demo Document&rdquo;** to pre-fill the sample lease revision notice.
3. Click **&ldquo;Run Analysis & Timeline Diff&rdquo;** to observe the live 5-stage pipeline stepper.
4. On `/document/[id]`, review the cross-document diff (+18% rent hike, 15-day notice reduction), toggle the summary to Hindi, and ask questions in the Grounded Legal Copilot box.
