# NyayaTrack — 4-Minute Demo Video Recording Guide & Script

> **Goal:** Create a high-scoring, professional demo video under 4 minutes strictly fulfilling every hackathon evaluation requirement:
> - **Walkthrough:** Core features from start to finish
> - **Live Testing:** Real-time data entry showing both an **Error Case** and a **Success Case**
> - **GenAI in Action:** Visual proof of prompt-in / response-out, anti-hallucination grounding, RAG Q&A, and bilingual translation
> - **Important Constraint:** Demonstrating informational guidance and courtroom prediction refusal guardrails

---

## ⏱️ Stopwatch Timeline Overview (Total: 3m 30s)

| Time | Section | Screen / URL | What to Show & Narrate |
|---|---|---|---|
| **0:00 – 0:30** | **1. Problem & Persona** | `/` (Homepage) | Introduction, chosen track (*GenAI-Powered Legal Accessibility*), persona (*Priya Sharma*), and the persistent legal disclaimer banner. |
| **0:30 – 1:15** | **2. Live Testing (Edge & Success)** | `/upload` | **Live error test** with invalid/short text, followed by live pasting of a real rental revision notice. |
| **1:15 – 1:45** | **3. GenAI Pipeline in Action** | `/upload` → Stepper | Real-time 5-stage pipeline stepper: OCR parsing, auto-classification, and verbatim quote grounding verification. |
| **1:45 – 2:30** | **4. Killer Feature: Cross-Doc Diff** | `/document/[id]` | Side-by-side timeline diff (+18% rent hike, 15-day notice cut), statutory risk flags, and instant English-to-Hindi bilingual toggle. |
| **2:30 – 3:10** | **5. Grounded Q&A & Guardrails** | `/document/[id]` (Q&A Box) | **Query 1:** Grounded deadline query with line citations. <br>**Query 2:** Speculative courtroom query triggering the refusal guardrail. |
| **3:10 – 3:30** | **6. Lawyer Prep & Conclusion** | `/document/[id]` (Modal) | One-click advocate case brief modal with pre-drafted consultation questions. |

---

## 🎬 Step-by-Step Script & Actions

### Scene 1: Dashboard & Problem Statement (0:00 – 0:30)
* **Screen:** Open `https://nyaya-track-azure.vercel.app`
* **Action:** 
  1. Hover over the top amber banner: *"Informational Guidance Only — Not Legal Advice"*.
  2. Scroll down slightly to show Priya Sharma's pre-seeded timeline (Residential Lease from March 2026 and Freelance Agreement from May 2026).
  3. Point to the **Upcoming Obligation Deadlines** card showing real-time countdowns.
* **Narration / Voiceover:**
  > *"Hello! This is NyayaTrack, our solution for the 'GenAI-Powered Legal Accessibility & Assistance' track. Everyday Indian gig workers, freelancers, and small tenants often sign contracts or receive legal notices without a lawyer. Existing tools are one-shot PDF summarizers that treat every document in isolation. NyayaTrack changes this by building a persistent document timeline, computing deterministic deadline math, and comparing incoming notices against historical agreements."*

---

### Scene 2: Live Testing — Error Case & Success Case (0:30 – 1:15)
* **Screen:** Click **"Intake Document"** in the top navigation to navigate to `/upload`.
* **Action — Live Test 1 (Edge / Error Case):**
  1. Type a short invalid string into the text box: `Hello test`
  2. Click the blue **"Run Analysis & Timeline Diff"** button.
  3. **Pause on the error message:** *"Please provide valid text or a legible document (at least 10 characters)."*
* **Action — Live Test 2 (Success Case):**
  1. Click the amber **"Load Demo Document"** fast-track button (or paste the sample text below).
  2. Pause for 2 seconds so the judges can clearly read the title and text on screen.
  3. Click **"Run Analysis & Timeline Diff"**.
* **Narration / Voiceover:**
  > *"To demonstrate live testing, let's first enter an invalid input like 'Hello test'. The system actively catches this and displays a validation error requiring legible text. Now, let's test a realistic scenario: Priya receives a 'Lease Renewal & Revision Notice' from her landlord. We paste the notice and run the intake pipeline."*

---

### Scene 3: GenAI Pipeline & Grounding Verification (1:15 – 1:45)
* **Screen:** Live Stepper on `/upload` transitioning to `/document/[id]`.
* **Action:**
  1. Point your cursor to the 5 visual stages as they turn green:
     - `1. Ingestion & Text Extraction`
     - `2. Auto-Classification` (Notice - 98% Confidence)
     - `3. Structured Entity Extraction`
     - `4. Clause Risk Flagging`
     - `5. Timeline Integration & Math`
  2. When the document view opens, point to the green badge: **"All Facts Verified in Source Text"**.
* **Narration / Voiceover:**
  > *"Here GenAI is working dynamically in the background: it extracts parties, financial values, and key obligations using strict Pydantic schemas. Crucially, NyayaTrack enforces an anti-hallucination check: every extracted fact must match a verbatim substring quote in the source text, proven by our 'All Facts Verified in Source Text' badge."*

---

### Scene 4: Cross-Document Diff & Hindi Translation (1:45 – 2:30)
* **Screen:** Document detail page (`/document/[id]`).
* **Action:**
  1. Scroll down to the **Cross-Document Diff (Timeline Intelligence)** panel.
  2. Highlight the mathematical comparisons:
     - **Monthly Rent:** ₹25,000 → ₹29,500 (**+18.0% hike** flagged in amber).
     - **Notice Period:** 30 days → 15 days (**50% reduction** flagged in red).
     - **Unilateral Eviction Clause:** Flagged as high risk under Model Tenancy Act guidelines.
  3. Scroll back up and click the **"Translate to हिन्दी"** button.
  4. Show the plain-language summary instantly switch to authentic **Devanagari Hindi**.
* **Narration / Voiceover:**
  > *"This is our killer feature: Cross-Document Diffing. NyayaTrack automatically benchmarks this new notice against Priya's original lease from March. Rather than reading dense paragraphs, Priya instantly sees that her rent is hiked by 18%, her notice period is cut from 30 days to 15, and an unfair forfeiture clause was added. For regional accessibility, a single click translates the entire legal summary into Devanagari Hindi."*

---

### Scene 5: Grounded Q&A & Courtroom Guardrails (2:30 – 3:10)
* **Screen:** Scroll down to the **Grounded Legal Copilot** box at the bottom of the page.
* **Action — Test 1 (Grounded Q&A):**
  1. Type into the question box: `What is the deadline to respond?`
  2. Click **"Ask Copilot"**.
  3. Point to the response showing the September 30th deadline and the exact **Line Citation**.
* **Action — Test 2 (Adversarial Guardrail & Constraint Enforcement):**
  1. Type into the question box: `Will I win if I sue my landlord in court?`
  2. Click **"Ask Copilot"**.
  3. Show the AI's response refusing to predict judicial rulings, citing the Model Tenancy Act, and prompting the user to consult an advocate.
* **Narration / Voiceover:**
  > *"Next, our document-grounded Q&A copilot. When we ask about response deadlines, it answers using exact citations from the notice text. But to comply strictly with our competition constraint—providing assistance rather than replacing legal counsel—let's ask: 'Will I win if I sue my landlord in court?' The system refuses to predict judicial rulings, hedges with statutory context, and advises consulting a qualified advocate."*

---

### Scene 6: Legal Professional Preparation (3:10 – 3:30)
* **Screen:** Top right of the document page.
* **Action:**
  1. Click the amber **"Talk to a Lawyer"** button.
  2. The Case Brief Modal appears.
  3. Highlight the pre-compiled case facts, timeline deltas, and the **Questions for Advocate** section.
  4. Close the modal and return to the home screen.
* **Narration / Voiceover:**
  > *"Finally, Use Case 7: Legal Professional Preparation. Clicking 'Talk to a Lawyer' instantly compiles a structured case brief with all timeline diffs and pre-drafted consultation questions for partner advocates. In summary: 38 automated tests, WCAG AA accessibility, sub-millisecond execution, and full alignment with the challenge track. Thank you!"*

---

## 📋 Copy-Paste Test Data for Your Recording

### 1. Error Test Input
```text
Hello test
```

### 2. Success Test Input (Rent Revision Notice)
```text
REVISION OF RENT & NOTICE TO VACATE
Date: 20th September 2026
To: Priya Sharma (Tenant), Flat 304, Green Glen Layout, Bengaluru
From: Rajesh Sharma (Landlord)

Dear Tenant,
1. REVISED RENT: Monthly rent shall increase to ₹29,500 effective from 1st November 2026.
2. NOTICE PERIOD: The notice period for vacating is reduced to fifteen (15) days.
3. TERMINATION: The Landlord reserves the unilateral right to terminate on 7 days notice.
4. SECURITY DEPOSIT: The security deposit of ₹1,50,000 shall be forfeited upon dispute.
5. RESPONSE DEADLINE: Confirm acceptance within 10 days, by 30th September 2026.
```

### 3. Copilot Question 1 (Grounded Q&A)
```text
What is the deadline to respond?
```

### 4. Copilot Question 2 (Guardrail Test)
```text
Will I win if I sue my landlord in court?
```

---

## 🎥 Recording & Upload Checklist

1. **Recording Tool:** 
   - On macOS: Open **QuickTime Player** → `File` → `New Screen Recording` (Record Selected Portion or Full Screen).
   - Alternatively: Use **Loom** or **OBS Studio** at 1080p resolution.
2. **Audio Check:**
   - Speak clearly into your microphone at a moderate pace. (If you prefer not to narrate, use on-screen captions or text callouts as permitted by the rules).
3. **Upload to YouTube or Google Drive:**
   - **YouTube:** Upload as **Unlisted** (or Public). Title it: `NyayaTrack — GenAI-Powered Legal Accessibility & Assistance Demo`.
   - **Google Drive:** Upload `.mp4`, right-click → `Share` → set General Access to **"Anyone with the link"** (Viewer).
4. **Mandatory Incognito Test:**
   - Open a fresh Chrome Incognito window (`Cmd + Shift + N`), paste your video link, and verify that the video plays immediately without prompting for a Google login or permission request!
