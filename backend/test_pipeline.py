import os
from pathlib import Path
from app.extraction.extract_fields import extract_structured_fields
from app.timeline.deadlines import compute_deadlines_from_dates
from app.timeline.compare import compare_documents
from app.qa.answer import answer_legal_question
from app.db.models import db_store
from app.db.seed import seed_database

def test_full_pipeline():
    seed_database()
    sample_path = Path("../sample_documents/sample_lease_renewal_notice.txt")
    if not sample_path.exists():
        sample_path = Path("sample_documents/sample_lease_renewal_notice.txt")
    
    text = sample_path.read_text()
    print("--- 1. Testing Structured Extraction ---")
    extraction = extract_structured_fields(text)
    print(f"Document Type: {extraction.document_type} (Confidence: {extraction.confidence})")
    print(f"Parties: {extraction.parties}")
    print(f"Amounts: {[f'{a.label}: {a.value}' for a in extraction.amounts]}")
    print(f"Dates: {[f'{d.label}: {d.date}' for d in extraction.key_dates]}")
    print(f"Flagged Clauses count: {len(extraction.flagged_clauses)}")
    for fc in extraction.flagged_clauses:
        print(f"   [{fc.risk_level.upper()}] {fc.compared_to}: {fc.reason[:80]}...")
    print(f"Grounding OK: {extraction.grounding_ok}")

    assert extraction.document_type.value == "Notice"
    assert len(extraction.flagged_clauses) >= 2
    assert extraction.grounding_ok is True

    print("\n--- 2. Testing Plain-Code Deadlines ---")
    deadlines = compute_deadlines_from_dates("test_renewal", "Lease Renewal Notice", extraction.key_dates)
    for dl in deadlines:
        print(f"   {dl.label} -> {dl.target_date} ({dl.days_remaining} days remaining, Status: {dl.status})")
    
    assert len(deadlines) >= 2

    print("\n--- 3. Testing Comparison Diff (Renewal vs Original Lease) ---")
    prior_lease = db_store.get_document("doc_lease_001")
    assert prior_lease is not None

    diff = compare_documents(
        target_doc_id="test_renewal",
        target_doc_title="Lease Renewal Notice",
        target_extraction=extraction,
        prior_doc_id=prior_lease.id,
        prior_doc_title=prior_lease.title,
        prior_extraction=prior_lease.extraction
    )
    print(f"Comparison Summary: {diff.summary_explanation}")
    for change in diff.differences:
        print(f"   * {change.field_name}: {change.old_value} -> {change.new_value} ({change.change_type}) [{change.risk_impact}]")
        print(f"     Explanation: {change.plain_language_explanation}")

    assert len(diff.differences) >= 2

    print("\n--- 4. Testing Grounded Q&A with Citations ---")
    q1 = "Can the landlord reduce the notice period to 15 days?"
    ans1 = answer_legal_question(q1, text, "Lease Renewal Notice")
    print(f"Q: {q1}")
    print(f"A: {ans1.answer}")
    print(f"Citations ({len(ans1.citations)}): {[c.source_name for c in ans1.citations]}")
    assert len(ans1.citations) > 0
    assert ans1.grounding_ok is True

    print("\n--- 5. Testing Out-of-Scope / Verdict Prediction Question ---")
    q2 = "Will I win if I sue my landlord in court?"
    ans2 = answer_legal_question(q2, text, "Lease Renewal Notice")
    print(f"Q: {q2}")
    print(f"A: {ans2.answer}")
    print(f"Suggest Lawyer: {ans2.suggest_lawyer}")
    assert ans2.suggest_lawyer is True
    assert "court outcomes" in ans2.answer.lower() or "legal advice" in ans2.answer.lower()

    print("\nALL PIPELINE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_pipeline()
