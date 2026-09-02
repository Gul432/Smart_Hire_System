import docx
from .base import ExtractionStrategy

class DOCXExtractor(ExtractionStrategy):
    """
    Extracts text from DOCX (Microsoft Word) files using python-docx.
    """
    def extract_text(self, file_path: str) -> str:
        doc = docx.Document(file_path)
        full_text = [para.text for para in doc.paragraphs if para.text.strip()]
        return '\n'.join(full_text)
