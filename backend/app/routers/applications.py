from fastapi import APIRouter, HTTPException, Depends
from app.database import get_supabase
from app.models.application import ApplicationCreate, ApplicationResponse, ApplicationWithScores
from app.routers.profiles import get_current_user_id
from app.services.matching import calculate_match_score
from app.services.github_verify import verify_github_skills

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("/", response_model=ApplicationWithScores)
async def apply_for_job(
    application: ApplicationCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Apply for a job. Automatically calculates match score and trust score.
    """
    db = get_supabase()
    
    # Get candidate profile
    profile = db.table("profiles").select("*").eq("id", user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    candidate = profile.data[0]
    if candidate["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can apply for jobs")
    
    # Get job
    job = db.table("jobs").select("*, profiles!jobs_employer_id_fkey(company_name)").eq("id", application.job_id).execute()
    if not job.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = job.data[0]
    
    # Check for existing application
    existing = db.table("applications").select("id").eq("job_id", application.job_id).eq("candidate_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Already applied for this job")
    
    # Calculate match score
    match_score = calculate_match_score(
        cv_text=candidate.get("cv_text") or "",
        cv_keywords=candidate.get("cv_keywords") or [],
        job_description=job_data.get("description") or "",
        job_keywords=job_data.get("keywords") or []
    )
    
    # Calculate trust score via GitHub verification
    trust_result = {"trust_score": 0, "verified_skills": [], "flagged_skills": []}
    
    github_url = candidate.get("github_url")
    claimed_skills = candidate.get("skills") or candidate.get("cv_keywords") or []
    
    if github_url and claimed_skills:
        try:
            trust_result = await verify_github_skills(github_url, claimed_skills)
        except Exception as e:
            print(f"GitHub verification failed: {e}")
    
    # Create application
    app_data = {
        "job_id": application.job_id,
        "candidate_id": user_id,
        "match_score": match_score,
        "trust_score": trust_result["trust_score"],
        "verified_skills": trust_result["verified_skills"],
        "flagged_skills": trust_result["flagged_skills"],
        "status": "pending",
    }
    
    result = db.table("applications").insert(app_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create application")
    
    # Build response with extra info
    app_response = result.data[0]
    profile_data = job_data.pop("profiles", {}) or {}
    app_response["job_title"] = job_data.get("title")
    app_response["company_name"] = profile_data.get("company_name")
    app_response["candidate_name"] = candidate.get("full_name")
    app_response["candidate_email"] = candidate.get("email")
    
    return app_response


@router.get("/mine", response_model=list[ApplicationWithScores])
async def get_my_applications(user_id: str = Depends(get_current_user_id)):
    """Get all applications submitted by the current candidate."""
    db = get_supabase()
    
    result = db.table("applications").select(
        "*, jobs(title, profiles!jobs_employer_id_fkey(company_name))"
    ).eq("candidate_id", user_id).order("applied_at", desc=True).execute()
    
    # Flatten nested data
    apps = []
    for app in result.data or []:
        job_data = app.pop("jobs", {}) or {}
        profile_data = job_data.pop("profiles", {}) if isinstance(job_data.get("profiles"), dict) else {}
        app["job_title"] = job_data.get("title")
        app["company_name"] = profile_data.get("company_name") if profile_data else None
        apps.append(app)
    
    return apps


@router.get("/job/{job_id}", response_model=list[ApplicationWithScores])
async def get_job_applications(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get all applications for a job (employer only)."""
    db = get_supabase()
    
    # Verify user owns this job
    job = db.table("jobs").select("employer_id, title").eq("id", job_id).execute()
    if not job.data:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.data[0]["employer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = db.table("applications").select(
        "*, profiles!applications_candidate_id_fkey(full_name, email)"
    ).eq("job_id", job_id).order("match_score", desc=True).execute()
    
    # Flatten nested data
    apps = []
    for app in result.data or []:
        profile_data = app.pop("profiles", {}) or {}
        app["job_title"] = job.data[0].get("title")
        app["candidate_name"] = profile_data.get("full_name")
        app["candidate_email"] = profile_data.get("email")
        apps.append(app)
    
    return apps


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: str,
    status: str,
    user_id: str = Depends(get_current_user_id)
):
    """Update application status (employer only)."""
    db = get_supabase()
    
    if status not in ["pending", "reviewed", "accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Get application and verify ownership through job
    app = db.table("applications").select("job_id").eq("id", application_id).execute()
    if not app.data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    job = db.table("jobs").select("employer_id").eq("id", app.data[0]["job_id"]).execute()
    if not job.data or job.data[0]["employer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.table("applications").update({"status": status}).eq("id", application_id).execute()
    
    return {"message": f"Application status updated to {status}"}
