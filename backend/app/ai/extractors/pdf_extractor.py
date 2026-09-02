import pdfplumber
from .base import ExtractionStrategy

class PDFExtractor(ExtractionStrategy):
    """
    Extracts text from PDF files using pdfplumber.
    """
    def extract_text(self, file_path: str) -> str:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return text.strip()
