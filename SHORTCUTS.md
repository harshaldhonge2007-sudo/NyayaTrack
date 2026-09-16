# NyayaTrack — Architectural Shortcuts & Trade-offs (MVP)

As outlined in Section 0 and Section 10 of the Antigravity build specification, here is an honest summary of shortcuts, assumptions, and stubbed integrations implemented for this hackathon MVP:

### 1. Single Mock User & Session State (No OAuth / Auth0)
- **Shortcut**: The MVP uses a pre-seeded mock user persona: *Priya Sharma (Freelancer & Small Tenant in Bengaluru)* with 2 prior documents pre-loaded into the database.
- **Production Need**: Production will require user authentication (OAuth2 / passkeys), multi-tenant tenancy scoping, and role-based permissions (personal tenant vs small business owner).

### 2. In-Memory Document & Deadline Store
- **Shortcut**: Documents, extraction JSONs, and deadline computations are stored in an in-memory dictionary store (`db_store`) with an instant reset endpoint (`/api/reset-seed`) to allow judges to reset the demo state in 1 click.
- **Production Need**: Encrypted-at-rest relational database (PostgreSQL with `pgvector` or Supabase) with document access controls, tenant isolation, and audit logging.

### 3. Lawyer Marketplace Escalation (Mock Callback Dispatch)
- **Shortcut**: The "Talk to a Lawyer" action dispatches a structured case brief (document title, 3 flagged clauses, pre-drafted legal questions) to a mock advocate partner profile (Adv. Arvind Nambiar, High Court of Karnataka) with an estimated 2-hour callback window.
- **Production Need**: Verified Indian advocate marketplace integration with Bar Council verification, consultation booking calendar, secure client-advocate messaging, and upfront UPI/escrow fee settlement.

### 4. Curated Indian Reference Corpus (6 Plain-Language Guidelines)
- **Shortcut**: Rather than indexing all Central and State Acts, we curated 6 honest, high-fidelity reference guideline excerpts (Model Tenancy Act, Transfer of Property Act Sec 106, Indian Contract Act Sec 27 & 74, Consumer Notice Windows, and Unilateral Contract Terms) with direct source URLs.
- **Production Need**: State-specific Rent Control Acts (e.g. Maharashtra Rent Control Act, Karnataka Rent Act), full Bare Acts index, and tribunal decision precedent retrieval.

### 5. Data Retention & Privacy Notice
- **Shortcut**: Files uploaded in the session are processed in memory and discarded on server restart. No permanent cloud file bucket is attached.
- **Production Need**: Strict data retention policy complying with the Digital Personal Data Protection Act (DPDPA 2023), client-side redaction of Aadhaar/PAN, and encrypted document deletion options.
