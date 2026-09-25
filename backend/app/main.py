import os
import uuid
from datetime import datetime, date
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.models.schemas import (
    DocumentRecord, ComputedDeadline, DocumentComparisonResult,
    QAResponse, StructuredExtraction
)
from app.ingestion.ocr import extract_text_from_pdf_bytes, extract_text_from_image_bytes
from app.extraction.extract_fields import extract_structured_fields
from app.timeline.deadlines import compute_deadlines_from_dates
from app.timeline.compare import compare_documents
from app.qa.answer import answer_legal_question, sanitize_legal_text
from app.translate.translate import generate_checklist_and_questions, generate_bilingual_summaries
from app.db.models import db_store
from app.db.seed import seed_database

app = FastAPI(
    title="NyayaTrack — GenAI-Powered Legal Accessibility & Assistance",
    description="GenAI-powered solution making legal information and assistance accessible, understandable, and actionable across 7 core use cases.",
    version="1.0.0"
)

# Enterprise Security: Restrict CORS to authorized frontend origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://nyaya-track-azure.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

class QARequest(BaseModel):
    document_id: str
    question: str

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NyayaTrack Backend API",
        "timestamp": datetime.now().isoformat(),
        "today_benchmark": "2026-09-16"
    }

@app.get("/api/documents", response_model=List[DocumentRecord])
def list_documents(response: Response):
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return db_store.get_all_documents()

@app.get("/api/documents/{doc_id}", response_model=DocumentRecord)
def get_document_detail(doc_id: str):
    doc = db_store.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@app.get("/api/deadlines", response_model=List[ComputedDeadline])
def get_deadlines(response: Response):
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return db_store.get_all_deadlines()

@app.post("/api/documents/intake", response_model=DocumentRecord)
async def intake_document(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    title: Optional[str] = Form(None)
):
    extracted_text = ""
    ingestion_method = "direct_text"
    filename = None
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".md"]

    if file:
        filename = file.filename
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File size exceeds maximum permitted limit of 10 MB.")

        lower_name = (filename or "").lower()
        if not any(lower_name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF, image (.png, .jpg, .webp), or text document.")

        if lower_name.endswith(".pdf"):
            extracted_text, ingestion_method = extract_text_from_pdf_bytes(content)
        elif any(lower_name.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]):
            extracted_text, ingestion_method = extract_text_from_image_bytes(content)
        else:
            extracted_text = content.decode("utf-8", errors="ignore")
            ingestion_method = "plain_text_file"
    elif raw_text:
        extracted_text = raw_text.strip()
        ingestion_method = "pasted_text"
    else:
        raise HTTPException(status_code=400, detail="Either a file or raw_text must be provided.")

    if not extracted_text or len(extracted_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Could not extract legible text from document. Please provide a clear PDF, image, or text.")

    # Sanitize document input to neutralize prompt injection payloads
    extracted_text = sanitize_legal_text(extracted_text)

    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    doc_title = title or (filename if filename else "Uploaded Document")

    # Step 2 & 3: Classify & Extract Structured Fields (with verbatim quote checks)
    extraction: StructuredExtraction = extract_structured_fields(extracted_text)

    # Step 4: Compute plain-code deadlines
    deadlines = compute_deadlines_from_dates(doc_id, doc_title, extraction.key_dates)

    # Step 5: Checklist & Lawyer Questions
    checklist, questions = generate_checklist_and_questions(extraction, deadlines)

    # Step 6: English & Hindi Summaries
    en_sum, hi_sum = generate_bilingual_summaries(doc_title, extraction)
    extraction.raw_summary = en_sum
    extraction.summary_hi = hi_sum

    # Save to store
    record = DocumentRecord(
        id=doc_id,
        title=doc_title,
        filename=filename,
        upload_date=date(2026, 9, 16).isoformat(),
        content_text=extracted_text,
        extraction=extraction,
        deadlines=deadlines,
        checklist=checklist,
        questions_for_lawyer=questions
    )
    db_store.save_document(record)
    return record

@app.get("/api/compare/{target_id}/{prior_id}", response_model=DocumentComparisonResult)
def compare_two_documents(target_id: str, prior_id: str):
    target_doc = db_store.get_document(target_id)
    prior_doc = db_store.get_document(prior_id)
    if not target_doc:
        raise HTTPException(status_code=404, detail=f"Target document '{target_id}' not found")
    if not prior_doc:
        raise HTTPException(status_code=404, detail=f"Prior document '{prior_id}' not found")

    result = compare_documents(
        target_doc_id=target_doc.id,
        target_doc_title=target_doc.title,
        target_extraction=target_doc.extraction,
        prior_doc_id=prior_doc.id,
        prior_doc_title=prior_doc.title,
        prior_extraction=prior_doc.extraction
    )
    return result

@app.post("/api/qa", response_model=QAResponse)
def ask_question_on_document(req: QARequest):
    doc = db_store.get_document(req.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{req.document_id}' not found")

    return answer_legal_question(
        question=req.question,
        document_text=doc.content_text,
        document_title=doc.title
    )

@app.post("/api/reset-seed")
def reset_seed():
    db_store._documents.clear()
    seed_database()
    return {"message": "Database reset to seeded state successfully", "count": len(db_store._documents)}
