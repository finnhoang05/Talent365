from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_match_score(
    cv_text: str,
    cv_keywords: list[str],
    job_description: str,
    job_keywords: list[str]
) -> float:
    """
    Calculate match score between a candidate and a job using TF-IDF cosine similarity.
    Returns a score from 0 to 100.
    """
    # Build combined text representations
    candidate_text = f"{cv_text} {' '.join(cv_keywords)}"
    job_text = f"{job_description} {' '.join(job_keywords)}"
    
    if not candidate_text.strip() or not job_text.strip():
        return 0.0
    
    try:
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1
        )
        
        tfidf_matrix = vectorizer.fit_transform([candidate_text, job_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        
        # Convert to percentage (0-100)
        score = float(similarity[0][0]) * 100
        
        # Boost score if there are direct keyword matches
        cv_keywords_lower = set(k.lower() for k in cv_keywords)
        job_keywords_lower = set(k.lower() for k in job_keywords)
        
        if cv_keywords_lower and job_keywords_lower:
            overlap = cv_keywords_lower & job_keywords_lower
            overlap_bonus = len(overlap) * 2  # 2% bonus per matching keyword
            score = min(score + overlap_bonus, 100)
        
        return round(score, 1)
        
    except Exception as e:
        print(f"Match score calculation error: {e}")
        return 0.0


def get_top_matches_for_candidate(
    candidate_cv_text: str,
    candidate_keywords: list[str],
    jobs: list[dict],
    top_n: int = 10
) -> list[dict]:
    """
    Given a candidate, return the top N matching jobs sorted by match score.
    """
    scored_jobs = []
    
    for job in jobs:
        score = calculate_match_score(
            cv_text=candidate_cv_text,
            cv_keywords=candidate_keywords,
            job_description=job.get("description", ""),
            job_keywords=job.get("keywords", [])
        )
        
        job_with_score = {**job, "match_score": score}
        scored_jobs.append(job_with_score)
    
    # Sort by match score descending
    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    
    return scored_jobs[:top_n]


def get_top_matches_for_job(
    job_description: str,
    job_keywords: list[str],
    candidates: list[dict],
    top_n: int = 10
) -> list[dict]:
    """
    Given a job, return the top N matching candidates sorted by match score.
    """
    scored_candidates = []
    
    for candidate in candidates:
        score = calculate_match_score(
            cv_text=candidate.get("cv_text", ""),
            cv_keywords=candidate.get("cv_keywords", []),
            job_description=job_description,
            job_keywords=job_keywords
        )
        
        candidate_with_score = {**candidate, "match_score": score}
        scored_candidates.append(candidate_with_score)
    
    # Sort by match score descending
    scored_candidates.sort(key=lambda x: x["match_score"], reverse=True)
    
    return scored_candidates[:top_n]
