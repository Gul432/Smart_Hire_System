import os
from .base import ExtractionStrategy
from .pdf_extractor import PDFExtractor
from .docx_extractor import DOCXExtractor

class ExtractorFactory:
    """
    Factory Pattern: Returns the correct extractor strategy based on the file extension.
    """
    @staticmethod
    def get_extractor(file_path: str) -> ExtractionStrategy:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            return PDFExtractor()
        elif ext in ['.docx', '.doc']:
            return DOCXExtractor()
        else:
            raise ValueError(f"Unsupported file format: {ext}. Only PDF and DOCX are allowed.")
