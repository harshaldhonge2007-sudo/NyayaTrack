import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.extraction.extract_fields import extract_structured_fields
from app.extraction.clause_risk import analyze_clause_risks
from app.timeline.compare import compare_documents
from app.timeline.deadlines import compute_deadlines_from_dates
from app.qa.answer import answer_legal_question
from app.translate.translate import generate_checklist_and_questions, generate_bilingual_summaries
from app.models.schemas import DocumentRecord, StructuredExtraction

class TestGenAILegalAccessibilityUseCases(unittest.TestCase):
    """
    Validates all 7 Core Use Cases defined in the official challenge problem statement:
    'GenAI-Powered Legal Accessibility & Assistance'
    """

    def setUp(self):
        self.sample_lease = (
            "RESIDENTIAL TENANCY AGREEMENT\n"
            "This Tenancy Agreement is entered into on 15th March 2026.\n"
            "Landlord: Rajesh Sharma, residing at #42 Indiranagar, Bengaluru.\n"
            "Tenant: Priya Sharma, residing at Flat 304, Green Glen Layout, Bengaluru.\n"
            "1. PREMISES & TERM: Leases Flat 304 for 11 months commencing from 1st April 2026.\n"
            "2. MONTHLY RENT: Tenant agrees to pay monthly rent of ₹25,000 on or before the 5th.\n"
            "3. NOTICE PERIOD: Either party may terminate by providing thirty (30) days notice.\n"
            "4. SECURITY DEPOSIT: Refundable security deposit of ₹1,50,000."
        )
        self.sample_revision_notice = (
            "REVISION OF RENT & NOTICE TO VACATE\n"
            "Date: 20th September 2026\n"
            "To: Priya Sharma (Tenant), Flat 304, Green Glen Layout, Bengaluru\n"
            "From: Rajesh Sharma (Landlord)\n"
            "Dear Tenant,\n"
            "1. REVISED RENT: Monthly rent shall increase to ₹29,500 effective from 1st November 2026.\n"
            "2. NOTICE PERIOD: The notice period for vacating is reduced to fifteen (15) days.\n"
            "3. TERMINATION: The Landlord reserves the unilateral right to terminate on 7 days notice.\n"
            "4. SECURITY DEPOSIT: The security deposit of ₹1,50,000 shall be forfeited upon dispute.\n"
            "5. RESPONSE DEADLINE: Confirm acceptance within 10 days, by 30th September 2026."
        )

    # Use Case 1: Legal Document Simplification
    def test_use_case_1_legal_document_simplification(self):
        extraction = extract_structured_fields(self.sample_lease)
        en_summary, hi_summary = generate_bilingual_summaries("Residential Lease", extraction)
        self.assertTrue(len(en_summary) > 20, "Should generate clear English simplification")
        self.assertTrue(len(hi_summary) > 20, "Should generate Devanagari Hindi translation")
        self.assertTrue("Rajesh Sharma" in en_summary or "Tenant" in en_summary or "Priya" in en_summary)
        self.assertTrue(any('\u0900' <= char <= '\u097f' for char in hi_summary), "Should contain Hindi Devanagari script")

    # Use Case 2: Document & Contract Comparison
    def test_use_case_2_document_contract_comparison(self):
        ext_base = extract_structured_fields(self.sample_lease)
        ext_target = extract_structured_fields(self.sample_revision_notice)
        
        diff = compare_documents(
            "doc_target", "Revision Notice", ext_target,
            "doc_base", "Base Lease", ext_base
        )
        self.assertTrue(len(diff.differences) >= 1, "Must identify meaningful changes in terms")
        rent_diff = next((d for d in diff.differences if "rent" in d.field_name.lower()), None)
        self.assertIsNotNone(rent_diff, "Must identify financial variation")
        self.assertIn("29,500", rent_diff.new_value)

    # Use Case 3: Risk & Clause Detection
    def test_use_case_3_risk_clause_detection(self):
        clauses_text = (
            "The Landlord reserves the unilateral right to terminate on 7 days notice. "
            "The security deposit of ₹1,50,000 shall be forfeited upon dispute."
        )
        flagged = analyze_clause_risks(clauses_text)
        self.assertTrue(len(flagged) >= 1, "Must detect risky, unusual, and unfair clauses")
        high_risk = [f for f in flagged if f.risk_level.value == "high" or f.risk_level == "high"]
        self.assertTrue(len(high_risk) >= 1, "Must classify compressed termination or forfeiture as high risk")

    # Use Case 4: Document-Based Legal Q&A
    def test_use_case_4_document_based_legal_qa(self):
        qa = answer_legal_question("doc_lease_001", "What is the notice period required to terminate?", self.sample_lease)
        self.assertTrue(qa.grounding_ok, "Q&A must be grounded in source document")
        self.assertTrue(len(qa.citations) > 0, "Must provide verifiable citations with quotes")
        self.assertIn("30", qa.answer, "Answer must reference 30 days notice")

    # Use Case 5: Options & Next-Step Guidance
    def test_use_case_5_options_and_next_step_guidance(self):
        extraction = extract_structured_fields(self.sample_revision_notice)
        deadlines = compute_deadlines_from_dates("doc_target", "Revision Notice", extraction.key_dates)
        self.assertTrue(len(deadlines) > 0, "Must compute upcoming deadlines")
        checklist, _ = generate_checklist_and_questions(extraction, deadlines)
        self.assertTrue(len(checklist) > 0, "Must guide user with next steps before response window expires")

    # Use Case 6: Actionable Outputs
    def test_use_case_6_actionable_outputs(self):
        extraction = extract_structured_fields(self.sample_revision_notice)
        deadlines = compute_deadlines_from_dates("doc_target", "Revision Notice", extraction.key_dates)
        checklist, _ = generate_checklist_and_questions(extraction, deadlines)
        self.assertTrue(any("deadline" in item.lower() or "response" in item.lower() or "written" in item.lower() for item in checklist), "Checklist must contain actionable response items")

    # Use Case 7: Legal Professional Preparation
    def test_use_case_7_legal_professional_preparation(self):
        extraction = extract_structured_fields(self.sample_revision_notice)
        deadlines = compute_deadlines_from_dates("doc_target", "Revision Notice", extraction.key_dates)
        _, lawyer_questions = generate_checklist_and_questions(extraction, deadlines)
        self.assertTrue(len(lawyer_questions) >= 1, "Must generate structured questions to prepare for lawyer consultation")

if __name__ == '__main__':
    unittest.main()
