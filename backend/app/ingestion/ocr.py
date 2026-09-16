import io
from typing import Tuple
from pypdf import PdfReader
import pytesseract
from PIL import Image

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> Tuple[str, str]:
    """
    Extracts text from PDF bytes. Returns (extracted_text, method_used).
    Attempts pypdf direct text extraction first.
    If extracted text is empty or very short (< 40 characters), flags for OCR fallback.
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_text = []
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages_text.append(f"--- Page {page_idx + 1} ---\n" + text.strip())

        full_text = "\n\n".join(pages_text).strip()
        if len(full_text) >= 40:
            return full_text, "pdf_direct"
    except Exception as e:
        pass

    # If direct extraction was empty or failed, attempt OCR
    try:
        # Fallback: extract images from PDF pages and run tesseract
        reader = PdfReader(io.BytesIO(pdf_bytes))
        ocr_texts = []
        for page_idx, page in enumerate(reader.pages):
            for img_file in page.images:
                try:
                    img = Image.open(io.BytesIO(img_file.data))
                    txt = pytesseract.image_to_string(img)
                    if txt.strip():
                        ocr_texts.append(f"--- Page {page_idx + 1} (OCR) ---\n" + txt.strip())
                except Exception:
                    continue
        if ocr_texts:
            return "\n\n".join(ocr_texts).strip(), "pdf_ocr"
    except Exception:
        pass

    return full_text if 'full_text' in locals() and full_text else "", "pdf_failed"

def extract_text_from_image_bytes(image_bytes: bytes) -> Tuple[str, str]:
    """
    Extracts text from image bytes using pytesseract.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(img)
        return text.strip(), "image_ocr"
    except Exception as e:
        return f"Error executing OCR: {str(e)}", "ocr_error"
