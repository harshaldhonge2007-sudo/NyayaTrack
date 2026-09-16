from app.models.schemas import (
    DocumentRecord, StructuredExtraction, DocumentType,
    KeyDate, AmountItem, ObligationItem, FlaggedClause, RiskLevel
)
from app.timeline.deadlines import compute_deadlines_from_dates
from app.translate.translate import generate_checklist_and_questions, generate_bilingual_summaries
from app.db.models import db_store

SEEDED_LEASE_TEXT = """
RESIDENTIAL TENANCY AGREEMENT

This Tenancy Agreement is entered into on 15th March 2026 by and between:
Landlord: Rajesh Sharma, residing at #42 Indiranagar, Bengaluru (hereinafter called the 'Landlord')
AND
Tenant: Priya Sharma, residing at Flat 304, Green Glen Layout, Bellandur, Bengaluru (hereinafter called the 'Tenant').

1. PREMISES & TERM: The Landlord leases to the Tenant residential Flat 304 for a term of 11 months commencing from 1st April 2026.
2. MONTHLY RENT: The Tenant agrees to pay a monthly rent of ₹25,000 on or before the 5th day of each calendar month.
3. SECURITY DEPOSIT: The Tenant has paid a refundable interest-free security deposit of ₹1,50,000.
4. TERMINATION & NOTICE PERIOD: Either party may terminate this agreement by providing at least thirty (30) calendar days prior written notice to the counter-party.
5. MAINTENANCE CHARGES: Monthly society maintenance charges of ₹2,000 shall be paid directly by the Tenant.
6. FAIR WEAR AND TEAR: The deposit shall be refunded upon handover subject only to legitimate deductions for unpaid utilities or structural damages, excluding normal fair wear and tear.

IN WITNESS WHEREOF the parties have set their hands on 15th March 2026.
Signed by:
Landlord: Rajesh Sharma
Tenant: Priya Sharma
"""

SEEDED_FREELANCE_TEXT = """
INDEPENDENT CONSULTING AGREEMENT

This Agreement is made on 10th May 2026 between:
Client: TechVentures Solutions Pvt Ltd, Koramangala, Bengaluru (hereinafter 'Client')
AND
Consultant: Priya Sharma, Independent Product Designer (hereinafter 'Consultant').

1. SCOPE OF SERVICES: The Consultant shall deliver UI/UX wireframes and prototype specifications for the client web portal.
2. PROFESSIONAL FEES: The Client shall pay a consulting fee of ₹65,000 upon successful milestone completion.
3. INVOICE PAYMENT TIMELINE: All approved invoices must be paid within 15 calendar days from the invoice submission date.
4. TERMINATION: Either party may terminate this project engagement by serving fifteen (15) days written notice without penalty.
5. INTELLECTUAL PROPERTY & RESTRAINT: Upon receipt of full payment, copyright vests in the Client. The Consultant retains the right to display non-confidential screenshots in their portfolio. No post-termination non-compete restraint shall apply.

Signed:
Client: TechVentures Solutions Pvt Ltd
Consultant: Priya Sharma
"""

def seed_database():
    # 1. Seed Residential Lease
    lease_extraction = StructuredExtraction(
        document_type=DocumentType.AGREEMENT,
        confidence=0.96,
        parties=["Rajesh Sharma (Landlord)", "Priya Sharma (Tenant)"],
        key_dates=[
            KeyDate(label="Execution Date", date="15th March 2026", source_quote="This Tenancy Agreement is entered into on 15th March 2026", is_grounded=True),
            KeyDate(label="Commencement Date", date="1st April 2026", source_quote="commencing from 1st April 2026", is_grounded=True),
            KeyDate(label="Notice Period", date="within 30 calendar days", source_quote="providing at least thirty (30) calendar days prior written notice", is_grounded=True)
        ],
        amounts=[
            AmountItem(label="Monthly Rent", value="₹25,000", source_quote="monthly rent of ₹25,000", is_grounded=True),
            AmountItem(label="Security Deposit", value="₹1,50,000", source_quote="security deposit of ₹1,50,000", is_grounded=True),
            AmountItem(label="Maintenance Charge", value="₹2,000", source_quote="maintenance charges of ₹2,000", is_grounded=True)
        ],
        obligations=[
            ObligationItem(party="Tenant", obligation="Pay monthly rent of ₹25,000 on or before 5th day of each calendar month.", source_quote="monthly rent of ₹25,000 on or before the 5th day of each calendar month", is_grounded=True),
            ObligationItem(party="Both Parties", obligation="Provide thirty (30) days notice prior to termination.", source_quote="Either party may terminate this agreement by providing at least thirty (30) calendar days prior written notice", is_grounded=True)
        ],
        flagged_clauses=[],
        grounding_ok=True
    )
    
    lease_deadlines = compute_deadlines_from_dates("doc_lease_001", "Original Tenancy Agreement (Flat 304)", lease_extraction.key_dates)
    lease_checklist, lease_questions = generate_checklist_and_questions(lease_extraction, lease_deadlines)
    en_sum, hi_sum = generate_bilingual_summaries("Original Tenancy Agreement", lease_extraction)
    lease_extraction.raw_summary = en_sum
    lease_extraction.summary_hi = hi_sum

    doc1 = DocumentRecord(
        id="doc_lease_001",
        title="Residential Tenancy Agreement (Flat 304, Green Glen Layout)",
        filename="tenancy_agreement_2026.pdf",
        upload_date="2026-03-15",
        content_text=SEEDED_LEASE_TEXT.strip(),
        extraction=lease_extraction,
        deadlines=lease_deadlines,
        checklist=lease_checklist,
        questions_for_lawyer=lease_questions
    )
    db_store.save_document(doc1)

    # 2. Seed Freelance Contract
    freelance_extraction = StructuredExtraction(
        document_type=DocumentType.CONTRACT,
        confidence=0.94,
        parties=["TechVentures Solutions Pvt Ltd (Client)", "Priya Sharma (Consultant)"],
        key_dates=[
            KeyDate(label="Execution Date", date="10th May 2026", source_quote="This Agreement is made on 10th May 2026", is_grounded=True),
            KeyDate(label="Payment Due Window", date="within 15 calendar days", source_quote="paid within 15 calendar days from the invoice submission date", is_grounded=True)
        ],
        amounts=[
            AmountItem(label="Consulting Fee", value="₹65,000", source_quote="consulting fee of ₹65,000", is_grounded=True)
        ],
        obligations=[
            ObligationItem(party="Client", obligation="Pay all approved invoices within 15 calendar days of submission.", source_quote="All approved invoices must be paid within 15 calendar days from the invoice submission date", is_grounded=True),
            ObligationItem(party="Consultant", obligation="Deliver UI/UX wireframes and prototype specifications for client portal.", source_quote="deliver UI/UX wireframes and prototype specifications", is_grounded=True)
        ],
        flagged_clauses=[],
        grounding_ok=True
    )

    freelance_deadlines = compute_deadlines_from_dates("doc_free_002", "Freelance Services Agreement (TechVentures)", freelance_extraction.key_dates)
    free_checklist, free_questions = generate_checklist_and_questions(freelance_extraction, freelance_deadlines)
    en_sum_f, hi_sum_f = generate_bilingual_summaries("Freelance Services Agreement", freelance_extraction)
    freelance_extraction.raw_summary = en_sum_f
    freelance_extraction.summary_hi = hi_sum_f

    doc2 = DocumentRecord(
        id="doc_free_002",
        title="Freelance Services Agreement (TechVentures Solutions)",
        filename="freelance_contract_techventures.pdf",
        upload_date="2026-05-10",
        content_text=SEEDED_FREELANCE_TEXT.strip(),
        extraction=freelance_extraction,
        deadlines=freelance_deadlines,
        checklist=free_checklist,
        questions_for_lawyer=free_questions
    )
    db_store.save_document(doc2)

seed_database()
