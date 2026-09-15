class IndustryScorer:
    """
    Applies the Industry-Based Hiring logic requested in the project requirements.
    Combines strict skill matching with AI semantic matching.
    """
    
    @staticmethod
    def calculate_final_score(job, candidate, semantic_score: float) -> dict:
        # 1. Exact Skill Matching (Jaccard Similarity)
        job_skills = set([s.lower() for s in job.required_skills]) if job.required_skills else set()
        cand_skills = set([s.lower() for s in candidate.skills]) if candidate.skills else set()
        
        if not job_skills:
            skill_score = 1.0 # If no skills required, they theoretically match 100% of requirements
        else:
            matched = job_skills.intersection(cand_skills)
            skill_score = len(matched) / len(job_skills)
            
        missing_skills = list(job_skills - cand_skills)
        matched_skills = list(job_skills.intersection(cand_skills))
        
        # 2. Industry Weights
        # If HR hasn't defined custom weights, we use a 50/50 fallback
        weights = job.scoring_weights or {"skills": 0.5, "semantic": 0.5}
        
        # 3. Final Calculation
        final_score = (skill_score * weights.get("skills", 0.5)) + \
                      (semantic_score * weights.get("semantic", 0.5))
                      
        return {
            "final_score": round(final_score * 100, 2),
            "semantic_score": round(semantic_score * 100, 2),
            "skill_score": round(skill_score * 100, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        }
