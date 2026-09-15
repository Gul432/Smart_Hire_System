from app.ai.model_loader import SpacyModelLoader

# A baseline dictionary of skills. 
# In a full production app, this would be queried from the database's `jobs` table
# or a master skills taxonomy database.
INDUSTRY_SKILLS = [
    "python", "java", "javascript", "c++", "c#", "ruby", "php", "go",
    "react", "angular", "vue", "fastapi", "django", "flask", "spring",
    "sql", "postgresql", "mysql", "mongodb", "redis",
    "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd",
    "machine learning", "nlp", "data science", "artificial intelligence",
    "surgery", "patient care", "radiology", "pediatrics", "diagnosis",
    "seo", "digital marketing", "content writing", "google analytics"
]

import re

class ResumeParser:
    """
    Uses spaCy for Named Entity Recognition (NER) to extract skills,
    emails, and deeply extracts education and experience metrics.
    """
    def __init__(self):
        self.nlp = SpacyModelLoader.get_model()
        
        # Add a custom EntityRuler to spaCy's pipeline to explicitly look for our skills
        if "entity_ruler" not in self.nlp.pipe_names:
            ruler = self.nlp.add_pipe("entity_ruler", before="ner")
            
            # Format patterns for spaCy
            patterns = [
                {"label": "SKILL", "pattern": [{"LOWER": word} for word in skill.split()]} 
                for skill in INDUSTRY_SKILLS
            ]
            ruler.add_patterns(patterns)

    def extract_education(self, text: str) -> str:
        """Finds the highest education level mentioned."""
        text_lower = text.lower()
        if re.search(r'\b(phd|ph\.d|doctorate)\b', text_lower): return "Ph.D / Doctorate"
        if re.search(r'\b(master|masters|m\.s|ms|m\.a|ma|mba|m\.sc|msc)\b', text_lower): return "Masters Degree"
        if re.search(r'\b(bachelor|bachelors|b\.s|bs|b\.a|ba|b\.sc|bsc|btech|b\.e|be)\b', text_lower): return "Bachelors Degree"
        if re.search(r'\b(associate|associates|a\.s|a\.a)\b', text_lower): return "Associates Degree"
        return "High School / Unspecified"

    def extract_experience(self, text: str) -> int:
        """Calculates total years of experience using date math and explicit mentions."""
        text_lower = text.lower()
        
        # Check for explicit "X years of experience" with optional words in between
        explicit_match = re.search(r'(\d+)\+?\s*years?(?:\s+\w+){0,3}\s+experience', text_lower)
        if explicit_match:
            return int(explicit_match.group(1))
            
        # Try to isolate the experience section to avoid counting education dates
        exp_idx = text_lower.find("experience")
        if exp_idx == -1:
            exp_idx = text_lower.find("employment")
        if exp_idx == -1:
            exp_idx = text_lower.find("work history")
            
        if exp_idx != -1:
            # Find the next major section to bound the search
            next_sections = []
            for keyword in ["education", "projects", "skills", "certifications", "languages"]:
                idx = text_lower.find(keyword, exp_idx + 10)
                if idx != -1:
                    next_sections.append(idx)
            end_idx = min(next_sections) if next_sections else len(text_lower)
            search_text = text_lower[exp_idx:end_idx]
        else:
            search_text = text_lower

        # Find date ranges (e.g., 2018 - 2022, Jan 2018 - Feb 2022)
        years = re.findall(r'\b(19\d{2}|20\d{2})\b.{0,15}?(?:-|to|–|—).{0,15}?\b(19\d{2}|20\d{2}|present|current)\b', search_text)
        
        if not years:
            return 0
            
        intervals = []
        from datetime import datetime
        current_year = datetime.now().year
        
        for start, end in years:
            start_yr = int(start)
            end_yr = current_year if end in ['present', 'current'] else int(end)
            if start_yr <= end_yr and start_yr >= 1950 and end_yr <= current_year:
                intervals.append([start_yr, end_yr])
                
        if not intervals:
            return 0
            
        # Merge overlapping intervals to avoid double counting concurrent jobs
        intervals.sort(key=lambda x: x[0])
        merged = [intervals[0]]
        for current in intervals[1:]:
            previous = merged[-1]
            if current[0] <= previous[1]:
                previous[1] = max(previous[1], current[1])
            else:
                merged.append(current)
                
        total_years = sum(end - start for start, end in merged)
        return min(total_years, 40)

    def extract_entities(self, text: str) -> dict:
        """
        Parses raw text and returns deeply extracted entities.
        """
        doc = self.nlp(text[:100000]) 
        
        skills = set()
        emails = []
        
        # 1. Extract Custom Skills and Built-in Entities
        for ent in doc.ents:
            if ent.label_ == "SKILL":
                skills.add(ent.text.lower())
                
        # 2. Extract standard regex-like tokens (Emails)
        for token in doc:
            if token.like_email:
                emails.append(token.text)
                
        # 3. Deep Extraction (Education & Experience)
        education_level = self.extract_education(text)
        years_experience = self.extract_experience(text)
                
        return {
            "skills": list(skills),
            "emails": emails,
            "education": [{"level": education_level}],
            "experience": [{"total_years": years_experience}]
        }
