import { DocumentRecord, ComputedDeadline } from "./types";

const formatDate = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

export function createSeededLease(): DocumentRecord {
  const current = new Date();
  const noticeTarget = addDays(current, 14);
  const depositTarget = addDays(current, 45);
  const executionPast = addDays(current, -60);

  return {
    id: "doc_lease_001",
    title: "Residential Tenancy Agreement (Flat 304, Green Glen Layout)",
    filename: "tenancy_agreement_2026.pdf",
    upload_date: formatDate(addDays(current, -15)),
    content_text: `RESIDENTIAL TENANCY AGREEMENT
This Tenancy Agreement is entered into by and between:
Landlord: Rajesh Sharma, residing at #42 Indiranagar, Bengaluru
AND
Tenant: Priya Sharma, residing at Flat 304, Green Glen Layout, Bellandur, Bengaluru.
1. PREMISES & TERM: The Landlord leases to the Tenant residential Flat 304 for a term of 11 months.
2. MONTHLY RENT: The Tenant agrees to pay a monthly rent of ₹25,000 on or before the 5th day of each calendar month.
3. SECURITY DEPOSIT: The Tenant has paid a refundable interest-free security deposit of ₹1,50,000.
4. TERMINATION & NOTICE PERIOD: Either party may terminate this agreement by providing at least thirty (30) calendar days prior written notice to the counter-party.
5. MAINTENANCE CHARGES: Monthly society maintenance charges of ₹2,000 shall be paid directly by the Tenant.`,
    extraction: {
      document_type: "Agreement",
      confidence: 0.96,
      parties: ["Rajesh Sharma (Landlord)", "Priya Sharma (Tenant)"],
      key_dates: [
        { label: "Execution Date", date: formatDate(executionPast), source_quote: "This Tenancy Agreement is entered into", is_grounded: true },
        { label: "Notice Period Window", date: "within 30 calendar days", source_quote: "providing at least thirty (30) calendar days prior written notice", is_grounded: true },
        { label: "Deposit Refund Milestone", date: "within 45 calendar days", source_quote: "refundable interest-free security deposit", is_grounded: true }
      ],
      amounts: [
        { label: "Monthly Rent", value: "₹25,000", source_quote: "monthly rent of ₹25,000", is_grounded: true },
        { label: "Security Deposit", value: "₹1,50,000", source_quote: "security deposit of ₹1,50,000", is_grounded: true },
        { label: "Maintenance Charge", value: "₹2,000", source_quote: "maintenance charges of ₹2,000", is_grounded: true }
      ],
      obligations: [
        { party: "Tenant", obligation: "Pay monthly rent of ₹25,000 on or before 5th day of each calendar month.", source_quote: "monthly rent of ₹25,000 on or before the 5th day of each calendar month", is_grounded: true },
        { party: "Both Parties", obligation: "Provide thirty (30) days notice prior to termination.", source_quote: "Either party may terminate this agreement by providing at least thirty (30) calendar days prior written notice", is_grounded: true }
      ],
      flagged_clauses: [],
      grounding_ok: true,
      raw_summary: "This document is a Agreement concerning Rajesh Sharma (Landlord), Priya Sharma (Tenant). It states a monthly rent / financial obligation of ₹25,000. The extracted clauses align generally with standard reference conventions.",
      summary_hi: "यह दस्तावेज़ Rajesh Sharma (Landlord), Priya Sharma (Tenant) के संबंध में एक Agreement (विधिक सूचना/अनुबंध) है। इसमें मासिक किराया / देय राशि ₹25,000 उल्लिखित है। इस दस्तावेज़ की शर्तें सामान्य भारतीय मानकों के अनुरूप प्रतीत होती हैं।"
    },
    deadlines: [
      {
        id: "doc_lease_001_dl_0",
        document_id: "doc_lease_001",
        document_title: "Original Tenancy Agreement (Flat 304)",
        label: "Tenancy Renewal / 30-Day Notice Milestone",
        target_date: formatDate(noticeTarget),
        days_remaining: 14,
        status: "upcoming",
        source_quote: "providing at least thirty (30) calendar days prior written notice"
      },
      {
        id: "doc_lease_001_dl_1",
        document_id: "doc_lease_001",
        document_title: "Original Tenancy Agreement (Flat 304)",
        label: "Security Deposit Refund Window",
        target_date: formatDate(depositTarget),
        days_remaining: 45,
        status: "future",
        source_quote: "refundable interest-free security deposit of ₹1,50,000"
      },
      {
        id: "doc_lease_001_dl_2",
        document_id: "doc_lease_001",
        document_title: "Original Tenancy Agreement (Flat 304)",
        label: "Execution Date",
        target_date: formatDate(executionPast),
        days_remaining: -60,
        status: "expired",
        source_quote: "This Tenancy Agreement is entered into"
      }
    ],
    checklist: [
      "Acknowledge receipt and request clarification on 'Tenancy Renewal'.",
      "Review payment milestones and ensure clause specifies Net-15 or Net-30 payment terms.",
      "Request written confirmation of work handover criteria before signing."
    ],
    questions_for_lawyer: [
      "Are there any hidden indemnity liabilities in this document that I should push to cap?",
      "Does this notice meet procedural requirements for service under civil law?"
    ]
  };
}

export function createSeededFreelance(): DocumentRecord {
  const current = new Date();
  const paymentTarget = addDays(current, 4);
  const reviewTarget = addDays(current, 18);

  return {
    id: "doc_free_002",
    title: "Freelance Services Agreement (TechVentures Solutions)",
    filename: "freelance_contract_techventures.pdf",
    upload_date: formatDate(addDays(current, -8)),
    content_text: `INDEPENDENT CONSULTING AGREEMENT
This Agreement is made between:
Client: TechVentures Solutions Pvt Ltd, Koramangala, Bengaluru
AND
Consultant: Priya Sharma, Independent Product Designer.
1. SCOPE OF SERVICES: The Consultant shall deliver UI/UX wireframes and prototype specifications.
2. PROFESSIONAL FEES: The Client shall pay a consulting fee of ₹65,000 upon successful milestone completion.
3. INVOICE PAYMENT TIMELINE: All approved invoices must be paid within 15 calendar days.
4. TERMINATION: Either party may terminate by serving fifteen (15) days written notice.`,
    extraction: {
      document_type: "Contract",
      confidence: 0.94,
      parties: ["TechVentures Solutions Pvt Ltd (Client)", "Priya Sharma (Consultant)"],
      key_dates: [
        { label: "Milestone Payment Due Window", date: "within 15 calendar days", source_quote: "paid within 15 calendar days from the invoice submission date", is_grounded: true },
        { label: "Termination Notice Period", date: "within 15 calendar days", source_quote: "serving fifteen (15) days written notice", is_grounded: true }
      ],
      amounts: [
        { label: "Consulting Fee", value: "₹65,000", source_quote: "consulting fee of ₹65,000", is_grounded: true }
      ],
      obligations: [
        { party: "Client", obligation: "Pay all approved invoices within 15 calendar days of submission.", source_quote: "All approved invoices must be paid within 15 calendar days", is_grounded: true },
        { party: "Consultant", obligation: "Deliver UI/UX wireframes and prototype specifications.", source_quote: "deliver UI/UX wireframes and prototype specifications", is_grounded: true }
      ],
      flagged_clauses: [],
      grounding_ok: true,
      raw_summary: "This document is a Contract concerning TechVentures Solutions Pvt Ltd (Client), Priya Sharma (Consultant). It states a monthly rent / financial obligation of ₹65,000. The extracted clauses align generally with standard reference conventions.",
      summary_hi: "यह दस्तावेज़ TechVentures Solutions Pvt Ltd (Client), Priya Sharma (Consultant) के संबंध में एक Contract है। इस दस्तावेज़ की शर्तें सामान्य भारतीय मानकों के अनुरूप प्रतीत होती हैं।"
    },
    deadlines: [
      {
        id: "doc_free_002_dl_0",
        document_id: "doc_free_002",
        document_title: "Freelance Services Agreement (TechVentures)",
        label: "Milestone 1 Payment Due (Net-15 Window)",
        target_date: formatDate(paymentTarget),
        days_remaining: 4,
        status: "urgent",
        source_quote: "paid within 15 calendar days"
      },
      {
        id: "doc_free_002_dl_1",
        document_id: "doc_free_002",
        document_title: "Freelance Services Agreement (TechVentures)",
        label: "Design Deliverable Handover Review",
        target_date: formatDate(reviewTarget),
        days_remaining: 18,
        status: "upcoming",
        source_quote: "deliver UI/UX wireframes and prototype specifications"
      }
    ],
    checklist: [
      "Acknowledge receipt and request clarification on 'Payment Due Window'.",
      "Review payment milestones and ensure clause specifies Net-15 or Net-30 payment terms."
    ],
    questions_for_lawyer: [
      "How does Section 27 of the Indian Contract Act protect me against post-contract client non-compete restrictions?"
    ]
  };
}

export const SEEDED_LEASE = createSeededLease();
export const SEEDED_FREELANCE = createSeededFreelance();

// In-memory global store across serverless requests in warm container
const globalStore: Map<string, DocumentRecord> = new Map([
  [SEEDED_LEASE.id, SEEDED_LEASE],
  [SEEDED_FREELANCE.id, SEEDED_FREELANCE],
]);

export function getDocuments(): DocumentRecord[] {
  return Array.from(globalStore.values()).sort((a, b) => b.upload_date.localeCompare(a.upload_date));
}

export function getDocumentById(id: string): DocumentRecord | undefined {
  return globalStore.get(id);
}

export function saveDocument(doc: DocumentRecord) {
  globalStore.set(doc.id, doc);
}

export function resetStore() {
  globalStore.clear();
  const lease = createSeededLease();
  const freelance = createSeededFreelance();
  globalStore.set(lease.id, lease);
  globalStore.set(freelance.id, freelance);
}

export function getAllDeadlines(): ComputedDeadline[] {
  const deadlines: ComputedDeadline[] = [];
  for (const doc of globalStore.values()) {
    deadlines.push(...doc.deadlines);
  }
  return deadlines.sort((a, b) => {
    if (a.days_remaining === null) return 1;
    if (b.days_remaining === null) return -1;
    return a.days_remaining - b.days_remaining;
  });
}
