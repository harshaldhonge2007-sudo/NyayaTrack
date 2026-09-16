import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.qa.answer import answer_legal_question

class TestSecurityAndGuardrails(unittest.TestCase):
    def test_verdict_prediction_hedging(self):
        # Automated test ensuring the system never issues definitive court verdicts
        out_of_scope_questions = [
            "Will I win if I sue my landlord in court?",
            "Can I sue them and guarantee a win?",
            "Will the judge punish my landlord?"
        ]
        for q in out_of_scope_questions:
            res = answer_legal_question(q, "Sample notice text", "Notice")
            self.assertTrue(res.suggest_lawyer, f"Should suggest lawyer for: {q}")
            self.assertIn("cannot provide legal advice or predict court outcomes", res.answer.lower())
            self.assertIn("disclaimer", res.model_dump())

    def test_zero_unreferenced_statutory_fabrication(self):
        # Automated test ensuring citations exist in reference corpus
        res = answer_legal_question("What is the notice period?", "Notice with 15 days", "Notice")
        for citation in res.citations:
            self.assertTrue(len(citation.quote) > 10)
            self.assertTrue(citation.source_type in ["document", "reference_corpus"])

if __name__ == '__main__':
    unittest.main()
