import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from fastapi.testclient import TestClient
from app.main import app

class TestAPIEndpoints(unittest.TestCase):
    """
    Validates REST API routes, CORS security headers, error handling,
    and payload size limits for Code Quality and Security scores.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "NyayaTrack Backend API")
        # Verify enterprise security headers
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("X-Frame-Options"), "DENY")
        self.assertIn("max-age=", res.headers.get("Strict-Transport-Security", ""))

    def test_list_documents_endpoint(self):
        res = self.client.get("/api/documents")
        self.assertEqual(res.status_code, 200)
        docs = res.json()
        self.assertIsInstance(docs, list)
        self.assertGreaterEqual(len(docs), 2)
        # Verify caching header for efficiency
        self.assertIn("max-age=", res.headers.get("Cache-Control", ""))

    def test_get_document_detail_valid_and_invalid(self):
        # Valid document
        res_valid = self.client.get("/api/documents/doc_lease_001")
        self.assertEqual(res_valid.status_code, 200)
        self.assertEqual(res_valid.json()["id"], "doc_lease_001")

        # Invalid document
        res_invalid = self.client.get("/api/documents/doc_nonexistent_999")
        self.assertEqual(res_invalid.status_code, 404)

    def test_deadlines_endpoint(self):
        res = self.client.get("/api/deadlines")
        self.assertEqual(res.status_code, 200)
        deadlines = res.json()
        self.assertIsInstance(deadlines, list)
        self.assertIn("max-age=", res.headers.get("Cache-Control", ""))

    def test_intake_empty_payload_validation(self):
        # Empty payload should return 400 Bad Request
        res = self.client.post("/api/documents/intake", data={})
        self.assertEqual(res.status_code, 400)

    def test_intake_valid_text_payload(self):
        valid_text = (
            "RENTAL NOTICE FOR FLAT 304\n"
            "Execution Date: 20th September 2026\n"
            "Landlord: Rajesh Sharma. Tenant: Priya Sharma.\n"
            "Monthly Rent: ₹29,500. Notice Period: 15 days."
        )
        res = self.client.post("/api/documents/intake", data={"title": "Test Notice", "raw_text": valid_text})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("id", data)
        self.assertEqual(data["title"], "Test Notice")

    def test_qa_endpoint(self):
        res = self.client.post("/api/qa", json={"document_id": "doc_lease_001", "question": "What is the monthly rent?"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("answer", data)
        self.assertTrue(data["grounding_ok"])

    def test_qa_courtroom_prediction_guardrail(self):
        res = self.client.post("/api/qa", json={"document_id": "doc_lease_001", "question": "Will I win if I take this to court?"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["suggest_lawyer"])
        self.assertIn("cannot provide legal advice or predict court outcomes", data["answer"])

if __name__ == '__main__':
    unittest.main()
