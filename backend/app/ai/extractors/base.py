from abc import ABC, abstractmethod

class ExtractionStrategy(ABC):
    """
    Abstract base class for all document extractors.
    Every new file type we support must implement the extract_text method.
    """
    @abstractmethod
    def extract_text(self, file_path: str) -> str:
        pass
