from fastapi import APIRouter, Depends
from app.database import get_supabase
from app.routers.profiles import get_current_user_id
from app.services.matching import get_top_matches_for_candidate, get_top_matches_for_job
from app.models.job import JobWithMatch
from app.models.profile import CandidateProfile

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/jobs", response_model=list[JobWithMatch])
async def get_recommended_jobs(
    user_id: str = Depends(get_current_user_id),
    limit: int = 10
):
    """
    Get top N job recommendations for the current candidate.
    Jobs are ranked by match score based on CV and keywords.
    """
    db = get_supabase()
    
    # Get candidate profile
    profile = db.table("profiles").select("*").eq("id", user_id).execute()
    if not profile.data:
        return []
    
    candidate = profile.data[0]
    
    # Get all active jobs
    jobs_result = db.table("jobs").select(
        "*, profiles!jobs_employer_id_fkey(company_name)"
    ).eq("is_active", True).execute()
    
    if not jobs_result.data:
        return []
    
    # Flatten job data
    jobs = []
    for job in jobs_result.data:
        profile_data = job.pop("profiles", {}) or {}
        job["company_name"] = profile_data.get("company_name")
        jobs.append(job)
    
    # Get top matches
    top_jobs = get_top_matches_for_candidate(
        candidate_cv_text=candidate.get("cv_text") or "",
        candidate_keywords=candidate.get("cv_keywords") or [],
        jobs=jobs,
        top_n=limit
    )
    
    return top_jobs


@router.get("/candidates/{job_id}", response_model=list[CandidateProfile])
async def get_recommended_candidates(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    limit: int = 10
):
    """
    Get top N candidate recommendations for a job posting.
    Candidates are ranked by match score.
    """
    db = get_supabase()
    
    # Verify employer owns the job
    job = db.table("jobs").select("*").eq("id", job_id).execute()
    if not job.data:
        return []
    
    job_data = job.data[0]
    
    # For demo, allow anyone to view (in production, check employer_id)
    # if job_data["employer_id"] != user_id:
    #     return []
    
    # Get all candidates
    candidates_result = db.table("profiles").select("*").eq("role", "candidate").execute()
    
    if not candidates_result.data:
        return []
    
    # Get top matches
    top_candidates = get_top_matches_for_job(
        job_description=job_data.get("description") or "",
        job_keywords=job_data.get("keywords") or [],
        candidates=candidates_result.data,
        top_n=limit
    )
    
    # Enrich with application data if exists
    for candidate in top_candidates:
        app = db.table("applications").select(
            "trust_score, verified_skills, flagged_skills"
        ).eq("job_id", job_id).eq("candidate_id", candidate["id"]).execute()
        
        if app.data:
            candidate["trust_score"] = app.data[0].get("trust_score")
            candidate["verified_skills"] = app.data[0].get("verified_skills")
            candidate["flagged_skills"] = app.data[0].get("flagged_skills")
    
    return top_candidates
