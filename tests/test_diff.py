import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.timeline.compare import compare_documents, extract_numeric_rupees
from app.models.schemas import StructuredExtraction, DocumentType, AmountItem, KeyDate, FlaggedClause, RiskLevel

class TestDocumentDiffEngine(unittest.TestCase):
    def test_extract_numeric_rupees(self):
        self.assertEqual(extract_numeric_rupees("₹25,000"), 25000)
        self.assertEqual(extract_numeric_rupees("INR 29,500"), 29500)
        self.assertEqual(extract_numeric_rupees("Rs. 1,50,000"), 150000)

    def test_plain_code_rent_and_notice_diff(self):
        prior = StructuredExtraction(
            document_type=DocumentType.AGREEMENT,
            confidence=0.95,
            amounts=[AmountItem(label="Monthly Rent", value="₹25,000", source_quote="rent of ₹25,000")],
            key_dates=[KeyDate(label="Notice Period", date="within 30 calendar days", source_quote="30 days notice")],
            flagged_clauses=[]
        )

        target = StructuredExtraction(
            document_type=DocumentType.NOTICE,
            confidence=0.98,
            amounts=[AmountItem(label="Monthly Rent", value="₹29,500", source_quote="revised rent of ₹29,500")],
            key_dates=[KeyDate(label="Notice Period", date="within 15 calendar days", source_quote="15 days notice")],
            flagged_clauses=[
                FlaggedClause(
                    clause_text="Unilateral 7 days notice right",
                    risk_level=RiskLevel.HIGH,
                    reason="Unilateral eviction imbalance",
                    compared_to="Fair Contracting"
                )
            ]
        )

        diff = compare_documents("new_doc", "Renewal", target, "old_doc", "Original", prior)
        self.assertGreaterEqual(len(diff.differences), 2)
        rent_diff = next((d for d in diff.differences if d.field_name == "Monthly Rent"), None)
        self.assertIsNotNone(rent_diff)
        self.assertIn("+18.0%", rent_diff.plain_language_explanation)

if __name__ == '__main__':
    unittest.main()
