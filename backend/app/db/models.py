from typing import Dict, List, Optional
from app.models.schemas import DocumentRecord, ComputedDeadline

class DocumentStore:
    def __init__(self):
        self._documents: Dict[str, DocumentRecord] = {}

    def get_all_documents(self) -> List[DocumentRecord]:
        # Return sorted by upload date descending
        docs = list(self._documents.values())
        docs.sort(key=lambda d: d.upload_date, reverse=True)
        return docs

    def get_document(self, doc_id: str) -> Optional[DocumentRecord]:
        return self._documents.get(doc_id)

    def save_document(self, doc: DocumentRecord):
        self._documents[doc.id] = doc

    def get_all_deadlines(self) -> List[ComputedDeadline]:
        deadlines = []
        for doc in self._documents.values():
            deadlines.extend(doc.deadlines)
        # Sort deadlines: urgent first
        def sort_key(d: ComputedDeadline):
            if d.days_remaining is None:
                return 9999
            if d.days_remaining >= 0:
                return d.days_remaining
            return 10000 + abs(d.days_remaining)
        deadlines.sort(key=sort_key)
        return deadlines

db_store = DocumentStore()
