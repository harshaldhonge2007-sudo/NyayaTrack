import unittest
import sys
import os
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.timeline.deadlines import parse_date_str, compute_deadlines_from_dates, TODAY
from app.models.schemas import KeyDate, DeadlineStatus

class TestDeadlineCalculations(unittest.TestCase):
    def test_parse_iso_date(self):
        d = parse_date_str("2026-09-26")
        self.assertEqual(d, date(2026, 9, 26))

    def test_parse_natural_indian_date(self):
        d = parse_date_str("30th September 2026")
        self.assertEqual(d, date(2026, 9, 30))

    def test_parse_relative_window(self):
        d = parse_date_str("within 10 days of receipt")
        self.assertIsNotNone(d)
        self.assertEqual((d - TODAY).days, 10)

    def test_deadline_status_and_sorting(self):
        key_dates = [
            KeyDate(label="Cutoff", date="2026-09-20", source_quote="before 2026-09-20"),
            KeyDate(label="Next Month", date="2026-10-15", source_quote="by 2026-10-15"),
            KeyDate(label="Old Notice", date="2026-08-01", source_quote="dated 2026-08-01")
        ]
        deadlines = compute_deadlines_from_dates("doc_test", "Test Doc", key_dates)
        self.assertEqual(len(deadlines), 3)
        self.assertEqual(deadlines[0].status, DeadlineStatus.URGENT) # 4 days left
        self.assertEqual(deadlines[1].status, DeadlineStatus.UPCOMING) # 29 days left
        self.assertEqual(deadlines[2].status, DeadlineStatus.EXPIRED) # past date

if __name__ == '__main__':
    unittest.main()
