from fastapi import APIRouter, Depends
from app.database import get_supabase
from app.routers.profiles import get_current_user_id
from app.services.matching import get_top_matches_for_candidate, get_top_matches_for_job
from app.models.job import JobWithMatch
from app.models.profile import CandidateProfile

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

NON_MEMBER_LIMIT = 10


def _effective_limit(requested: int, is_member: bool) -> int:
    """Members get unlimited (capped at requested). Non-members get max 10."""
    if is_member:
        return requested
    return min(requested, NON_MEMBER_LIMIT)


@router.get("/jobs", response_model=list[JobWithMatch])
async def get_recommended_jobs(
    user_id: str = Depends(get_current_user_id),
    limit: int = 50,
):
    """
    Get top job recommendations for the current candidate.
    Members get unlimited results; non-members are capped at 10.
    """
    db = get_supabase()

    profile = db.table("profiles").select("*").eq("id", user_id).execute()
    if not profile.data:
        return []

    candidate = profile.data[0]
    is_member = candidate.get("is_member", False)
    effective = _effective_limit(limit, is_member)

    jobs_result = db.table("jobs").select(
        "*, profiles!jobs_employer_id_fkey(company_name)"
    ).eq("is_active", True).execute()

    if not jobs_result.data:
        return []

    jobs = []
    for job in jobs_result.data:
        profile_data = job.pop("profiles", {}) or {}
        job["company_name"] = profile_data.get("company_name")
        jobs.append(job)

    # Include preferred mode/location in candidate text for better matching
    candidate_text_extras = " ".join(filter(None, [
        candidate.get("preferred_mode"),
        candidate.get("preferred_location"),
        " ".join(
            f"{e.get('role','')} {e.get('company','')}"
            for e in (candidate.get("work_experience") or [])
        ),
    ]))

    top_jobs = get_top_matches_for_candidate(
        candidate_cv_text=(candidate.get("cv_text") or "") + " " + candidate_text_extras,
        candidate_keywords=candidate.get("cv_keywords") or [],
        jobs=jobs,
        top_n=effective,
    )

    return top_jobs


@router.get("/candidates/{job_id}", response_model=list[CandidateProfile])
async def get_recommended_candidates(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    limit: int = 50,
):
    """
    Get top candidate recommendations for a job posting.
    Members get unlimited results; non-members are capped at 10.
    """
    db = get_supabase()

    employer_profile = db.table("profiles").select("is_member").eq("id", user_id).execute()
    is_member = employer_profile.data[0].get("is_member", False) if employer_profile.data else False
    effective = _effective_limit(limit, is_member)

    job = db.table("jobs").select("*").eq("id", job_id).execute()
    if not job.data:
        return []

    job_data = job.data[0]

    candidates_result = db.table("profiles").select("*").eq("role", "candidate").execute()
    if not candidates_result.data:
        return []

    top_candidates = get_top_matches_for_job(
        job_description=job_data.get("description") or "",
        job_keywords=job_data.get("keywords") or [],
        candidates=candidates_result.data,
        top_n=effective,
    )

    for candidate in top_candidates:
        app = db.table("applications").select(
            "trust_score, verified_skills, flagged_skills"
        ).eq("job_id", job_id).eq("candidate_id", candidate["id"]).execute()

        if app.data:
            candidate["trust_score"] = app.data[0].get("trust_score")
            candidate["verified_skills"] = app.data[0].get("verified_skills")
            candidate["flagged_skills"] = app.data[0].get("flagged_skills")

    return top_candidates
