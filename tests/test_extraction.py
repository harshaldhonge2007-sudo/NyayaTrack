import unittest
from pathlib import Path
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.extraction.extract_fields import extract_structured_fields, verify_source_quote
from app.extraction.clause_risk import analyze_clause_risks
from app.models.schemas import DocumentType, RiskLevel

class TestStructuredExtraction(unittest.TestCase):
    def test_verbatim_quote_verification(self):
        doc_text = "The Tenant agrees to pay a monthly rent of ₹25,000 on or before the 5th day."
        self.assertTrue(verify_source_quote("monthly rent of ₹25,000", doc_text))
        self.assertFalse(verify_source_quote("monthly rent of ₹99,999", doc_text))

    def test_clause_risk_analyzer(self):
        risky_text = "Landlord reserves sole discretion to terminate upon 7 days notice. Entire deposit of ₹1,50,000 shall be forfeited."
        risks = analyze_clause_risks(risky_text)
        self.assertGreaterEqual(len(risks), 2)
        unilateral = [r for r in risks if "unilateral" in r.compared_to.lower() or "fair contracting" in r.compared_to.lower()]
        self.assertTrue(len(unilateral) > 0)
        self.assertEqual(unilateral[0].risk_level, RiskLevel.HIGH)

    def test_full_document_extraction(self):
        sample = """
        LEGAL NOTICE & TENANCY REVISION
        From: Rajesh Sharma (Landlord)
        To: Priya Sharma (Tenant)
        Effective from 1st October 2026, revised monthly rent shall be ₹29,500.
        You must vacate the premises by 30th September 2026 within 10 days of receipt.
        """
        result = extract_structured_fields(sample)
        self.assertEqual(result.document_type, DocumentType.NOTICE)
        self.assertTrue(result.grounding_ok)
        self.assertGreater(len(result.amounts), 0)

if __name__ == '__main__':
    unittest.main()
