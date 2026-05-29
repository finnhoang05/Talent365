from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Query
from app.database import get_supabase
from app.models.job import JobCreate, JobUpdate, JobResponse, JobWithMatch
from app.routers.profiles import get_current_user_id
from app.services.cv_parser import extract_keywords
from typing import Literal

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/", response_model=JobResponse)
async def create_job(
    job: JobCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new job posting (employer only)."""
    db = get_supabase()
    
    # Verify user is an employer
    profile = db.table("profiles").select("role").eq("id", user_id).execute()
    if not profile.data or profile.data[0]["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can create jobs")
    
    # Extract keywords from job description
    keywords = extract_keywords(job.description)
    
    data = {
        "employer_id": user_id,
        "title": job.title,
        "description": job.description,
        "keywords": keywords,
        "location": job.location,
        "mode": job.mode,
        "job_type": job.job_type,
        "industry": job.industry,
        "experience_level": job.experience_level,
        "salary_range": job.salary_range,
    }
    
    result = db.table("jobs").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create job")
    
    return result.data[0]


@router.get("/", response_model=list[JobWithMatch])
async def list_jobs(
    location: str | None = None,
    mode: Literal["Remote", "Hybrid", "On-site"] | None = None,
    job_type: Literal["Full time", "Part time", "Casual", "Volunteer"] | None = None,
    experience_level: Literal["Entry", "Mid", "Expert"] | None = None,
    industry: str | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=100),
):
    """
    List all active jobs with optional filters.
    Returns jobs with employer company name.
    """
    db = get_supabase()
    
    query = db.table("jobs").select(
        "*, profiles!jobs_employer_id_fkey(company_name)"
    ).eq("is_active", True)
    
    if location:
        query = query.ilike("location", f"%{location}%")
    if mode:
        query = query.eq("mode", mode)
    if job_type:
        query = query.eq("job_type", job_type)
    if experience_level:
        query = query.eq("experience_level", experience_level)
    if industry:
        query = query.ilike("industry", f"%{industry}%")
    if search:
        query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    
    # Flatten the nested profile data
    jobs = []
    for job in result.data or []:
        profile_data = job.pop("profiles", {}) or {}
        job["company_name"] = profile_data.get("company_name")
        jobs.append(job)
    
    return jobs


@router.get("/{job_id}", response_model=JobWithMatch)
async def get_job(job_id: str):
    """Get a specific job by ID."""
    db = get_supabase()
    
    result = db.table("jobs").select(
        "*, profiles!jobs_employer_id_fkey(company_name)"
    ).eq("id", job_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = result.data[0]
    profile_data = job.pop("profiles", {}) or {}
    job["company_name"] = profile_data.get("company_name")
    
    # Get applicant count
    apps = db.table("applications").select("id", count="exact").eq("job_id", job_id).execute()
    job["applicant_count"] = apps.count or 0
    
    return job


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job: JobUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a job posting (owner only)."""
    db = get_supabase()
    
    # Verify ownership
    existing = db.table("jobs").select("employer_id").eq("id", job_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")
    if existing.data[0]["employer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")
    
    # Filter out None values
    update_data = {k: v for k, v in job.model_dump().items() if v is not None}
    
    # Re-extract keywords if description changed
    if "description" in update_data:
        update_data["keywords"] = extract_keywords(update_data["description"])
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = db.table("jobs").update(update_data).eq("id", job_id).execute()
    
    return result.data[0]


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a job posting (owner only). Actually sets is_active=False."""
    db = get_supabase()
    
    # Verify ownership
    existing = db.table("jobs").select("employer_id").eq("id", job_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")
    if existing.data[0]["employer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
    
    # Soft delete
    db.table("jobs").update({"is_active": False}).eq("id", job_id).execute()
    
    return {"message": "Job deleted"}


@router.post("/{job_id}/video")
async def upload_job_video(
    job_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload a video for a job posting."""
    db = get_supabase()
    
    # Verify ownership
    existing = db.table("jobs").select("employer_id").eq("id", job_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")
    if existing.data[0]["employer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate file type
    allowed_types = ["video/mp4", "video/webm", "video/quicktime"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")
    
    content = await file.read()
    
    # Limit file size (50MB)
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    
    storage_path = f"{job_id}/video.mp4"
    
    try:
        db.storage.from_("videos").upload(
            storage_path,
            content,
            {"content-type": file.content_type, "upsert": "true"}
        )
        
        # Get public URL
        video_url = db.storage.from_("videos").get_public_url(storage_path)
        
        # Update job with video URL
        db.table("jobs").update({"video_url": video_url}).eq("id", job_id).execute()
        
        return {"message": "Video uploaded", "video_url": video_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/employer/mine", response_model=list[JobResponse])
async def get_my_jobs(user_id: str = Depends(get_current_user_id)):
    """Get all jobs posted by the current employer."""
    db = get_supabase()
    
    result = db.table("jobs").select("*").eq("employer_id", user_id).order("created_at", desc=True).execute()
    
    return result.data or []
