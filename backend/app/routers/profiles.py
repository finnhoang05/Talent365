from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Header
from app.database import get_supabase
from app.models.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.cv_parser import extract_text_from_pdf, extract_keywords
from typing import Annotated
import uuid

router = APIRouter(prefix="/profiles", tags=["profiles"])


async def get_current_user_id(authorization: Annotated[str | None, Header()] = None) -> str:
    """
    Extract user ID from Supabase JWT token.
    For demo purposes, also accepts a simple user_id header.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # For demo: accept "Bearer <user_id>" format
    # In production, decode the actual JWT
    token = authorization.replace("Bearer ", "")
    
    # If it looks like a UUID, use it directly (demo mode)
    try:
        uuid.UUID(token)
        return token
    except ValueError:
        # TODO: Decode actual Supabase JWT
        raise HTTPException(status_code=401, detail="Invalid token format")


@router.post("/", response_model=ProfileResponse)
async def create_profile(
    profile: ProfileCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new user profile (candidate or employer)."""
    db = get_supabase()
    
    data = {
        "id": user_id,
        "role": profile.role,
        "full_name": profile.full_name,
        "email": profile.email,
        "github_url": profile.github_url,
        "education": profile.education,
        "years_experience": profile.years_experience,
        "skills": profile.skills,
        "company_name": profile.company_name,
    }
    
    result = db.table("profiles").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create profile")
    
    return result.data[0]


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: str):
    """Get a profile by ID."""
    db = get_supabase()
    
    result = db.table("profiles").select("*").eq("id", profile_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return result.data[0]


@router.get("/me/", response_model=ProfileResponse)
async def get_my_profile(user_id: str = Depends(get_current_user_id)):
    """Get the current user's profile."""
    db = get_supabase()
    
    result = db.table("profiles").select("*").eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return result.data[0]


@router.patch("/me/", response_model=ProfileResponse)
async def update_my_profile(
    profile: ProfileUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update the current user's profile."""
    db = get_supabase()
    
    # Filter out None values
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = db.table("profiles").update(update_data).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return result.data[0]


@router.post("/me/cv")
async def upload_cv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """
    Upload a CV (PDF), extract text and keywords.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    db = get_supabase()
    
    # Read file content
    content = await file.read()
    
    # Upload to Supabase Storage
    storage_path = f"{user_id}/cv.pdf"
    
    try:
        db.storage.from_("cvs").upload(
            storage_path,
            content,
            {"content-type": "application/pdf", "upsert": "true"}
        )
    except Exception as e:
        # If bucket doesn't exist or upload fails, continue with text extraction
        print(f"Storage upload warning: {e}")
    
    # Extract text from PDF
    cv_text = extract_text_from_pdf(content)
    
    if not cv_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    # Extract keywords
    keywords = extract_keywords(cv_text)
    
    # Update profile with CV data
    update_data = {
        "cv_url": storage_path,
        "cv_text": cv_text[:10000],  # Limit stored text
        "cv_keywords": keywords,
    }
    
    result = db.table("profiles").update(update_data).eq("id", user_id).execute()
    
    return {
        "message": "CV uploaded and processed",
        "keywords": keywords,
        "text_length": len(cv_text),
    }


@router.post("/me/membership")
async def upgrade_membership(user_id: str = Depends(get_current_user_id)):
    """Upgrade a user's membership (fake payment - just sets is_member=True)."""
    db = get_supabase()
    result = db.table("profiles").update({"is_member": True}).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Membership activated", "is_member": True}


@router.delete("/me/membership")
async def cancel_membership(user_id: str = Depends(get_current_user_id)):
    """Cancel membership."""
    db = get_supabase()
    db.table("profiles").update({"is_member": False}).eq("id", user_id).execute()
    return {"message": "Membership cancelled", "is_member": False}


@router.get("/search/candidates", response_model=list[ProfileResponse])
async def search_candidates(
    q: str | None = None,
    skills: str | None = None,
    preferred_mode: str | None = None,
    preferred_location: str | None = None,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
):
    """Search candidates with fuzzy matching. Employer-only."""
    from thefuzz import fuzz
    db = get_supabase()

    # Verify employer
    profile = db.table("profiles").select("role").eq("id", user_id).execute()
    if not profile.data or profile.data[0]["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can search candidates")

    result = db.table("profiles").select("*").eq("role", "candidate").execute()
    candidates = result.data or []

    if preferred_mode:
        candidates = [c for c in candidates if c.get("preferred_mode") == preferred_mode]
    if preferred_location:
        candidates = [
            c for c in candidates
            if c.get("preferred_location") and
            preferred_location.lower() in c["preferred_location"].lower()
        ]

    if q:
        query_lower = q.lower()

        def score(c: dict) -> int:
            targets = [
                c.get("full_name") or "",
                c.get("education") or "",
                c.get("preferred_location") or "",
                " ".join(c.get("skills") or []),
                " ".join(c.get("cv_keywords") or []),
                # Flatten work_experience text
                " ".join(
                    f"{e.get('role','')} {e.get('company','')}"
                    for e in (c.get("work_experience") or [])
                ),
            ]
            combined = " ".join(targets)
            return fuzz.partial_ratio(query_lower, combined.lower())

        candidates = [(c, score(c)) for c in candidates]
        candidates = [(c, s) for c, s in candidates if s >= 40]
        candidates.sort(key=lambda x: x[1], reverse=True)
        candidates = [c for c, _ in candidates]

    return candidates[:limit]


@router.get("/", response_model=list[ProfileResponse])
async def list_candidates(
    role: str = "candidate",
    limit: int = 50
):
    """List all profiles (filtered by role)."""
    db = get_supabase()
    result = db.table("profiles").select("*").eq("role", role).limit(limit).execute()
    return result.data or []
