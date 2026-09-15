import logging
from sentence_transformers import SentenceTransformer, util

logger = logging.getLogger(__name__)

class SemanticMatcher:
    """
    Singleton Pattern for the Sentence Transformer model.
    Loads the model once into memory to calculate semantic similarity between Resumes and Job Descriptions.
    """
    _instance = None

    @classmethod
    def get_model(cls):
        if cls._instance is None:
            logger.info("Loading SentenceTransformer 'all-MiniLM-L6-v2'...")
            # all-MiniLM-L6-v2 is extremely fast and perfect for sentence comparisons
            cls._instance = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._instance

    @staticmethod
    def calculate_similarity(text1: str, text2: str) -> float:
        """
        Calculates the Cosine Similarity between two blocks of text.
        Returns a float between 0.0 and 1.0.
        """
        model = SemanticMatcher.get_model()
        
        # Truncate texts to avoid token limit errors
        emb1 = model.encode(text1[:5000], convert_to_tensor=True)
        emb2 = model.encode(text2[:5000], convert_to_tensor=True)
        
        # Compute cosine similarity
        cosine_score = util.cos_sim(emb1, emb2)
        return float(cosine_score.item())
