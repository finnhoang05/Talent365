from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.database import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr


class LoginResponse(BaseModel):
    user_id: str
    role: str
    full_name: str | None


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login by email. Returns user_id if profile exists.
    """
    db = get_supabase()
    
    result = db.table("profiles").select("id, role, full_name").eq("email", request.email).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="No account found with this email. Please sign up first.")
    
    profile = result.data[0]
    
    return {
        "user_id": profile["id"],
        "role": profile["role"],
        "full_name": profile.get("full_name"),
    }


@router.get("/check-email/{email}")
async def check_email(email: str):
    """Check if an email is already registered."""
    db = get_supabase()
    
    result = db.table("profiles").select("id").eq("email", email).execute()
    
    return {"exists": len(result.data) > 0}
