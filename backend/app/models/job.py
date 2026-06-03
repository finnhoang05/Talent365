from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class JobBase(BaseModel):
    title: str
    description: str
    location: str | None = None
    mode: Literal["Remote", "Hybrid", "On-site"] | None = None
    job_type: Literal["Full time", "Part time", "Casual", "Volunteer"] | None = None
    industry: str | None = None
    experience_level: Literal["Entry", "Mid", "Expert"] | None = None
    salary_range: str | None = None


class JobCreate(JobBase):
    youtube_url: str | None = None  # Link to full YouTube video


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    mode: Literal["Remote", "Hybrid", "On-site"] | None = None
    job_type: Literal["Full time", "Part time", "Casual", "Volunteer"] | None = None
    industry: str | None = None
    experience_level: Literal["Entry", "Mid", "Expert"] | None = None
    salary_range: str | None = None
    youtube_url: str | None = None
    is_active: bool | None = None


class JobResponse(JobBase):
    id: str
    employer_id: str
    keywords: list[str] | None = None
    video_url: str | None = None      # Short uploaded video (max 30s)
    youtube_url: str | None = None    # Link to full YouTube video
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class JobWithMatch(JobResponse):
    match_score: float | None = None
    company_name: str | None = None
    applicant_count: int | None = None
