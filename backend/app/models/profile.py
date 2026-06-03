from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Literal


class WorkExperience(BaseModel):
    role: str
    company: str
    start_date: str          # e.g. "2022-01"
    end_date: str | None = None   # None = current
    description: str | None = None


class ProfileBase(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class ProfileCreate(ProfileBase):
    role: Literal["candidate", "employer"]
    # Candidate fields
    github_url: str | None = None
    education: str | None = None
    years_experience: int | None = 0
    skills: list[str] | None = None
    work_experience: list[WorkExperience] | None = None
    preferred_mode: Literal["Remote", "Hybrid", "On-site"] | None = None
    preferred_location: str | None = None
    # Employer fields
    company_name: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    github_url: str | None = None
    education: str | None = None
    years_experience: int | None = None
    skills: list[str] | None = None
    work_experience: list[WorkExperience] | None = None
    preferred_mode: Literal["Remote", "Hybrid", "On-site"] | None = None
    preferred_location: str | None = None
    company_name: str | None = None


class ProfileResponse(ProfileBase):
    id: str
    role: str
    github_url: str | None = None
    cv_url: str | None = None
    cv_keywords: list[str] | None = None
    education: str | None = None
    years_experience: int | None = None
    skills: list[str] | None = None
    work_experience: list[WorkExperience] | None = None
    preferred_mode: str | None = None
    preferred_location: str | None = None
    company_name: str | None = None
    is_member: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateProfile(ProfileResponse):
    match_score: float | None = None
    trust_score: float | None = None
    verified_skills: list[str] | None = None
    flagged_skills: list[str] | None = None


class EmployerProfile(ProfileResponse):
    job_count: int | None = None
