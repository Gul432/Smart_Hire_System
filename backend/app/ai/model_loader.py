import spacy
import spacy.cli
import logging

logger = logging.getLogger(__name__)

class SpacyModelLoader:
    """
    Singleton Pattern: Ensures the heavy spaCy NLP model is loaded only once
    into memory during the application lifecycle.
    """
    _instance = None

    @classmethod
    def get_model(cls):
        if cls._instance is None:
            logger.info("Loading spaCy model 'en_core_web_sm' into memory...")
            try:
                cls._instance = spacy.load("en_core_web_sm")
            except OSError:
                logger.error("spaCy model not found. Downloading...")
                spacy.cli.download("en_core_web_sm")
                cls._instance = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded successfully.")
        return cls._instance
