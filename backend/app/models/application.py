from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class ApplicationCreate(BaseModel):
    job_id: str


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    match_score: float | None = None
    trust_score: float | None = None
    verified_skills: list[str] | None = None
    flagged_skills: list[str] | None = None
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True


class ApplicationWithScores(ApplicationResponse):
    job_title: str | None = None
    company_name: str | None = None
    candidate_name: str | None = None
    candidate_email: str | None = None
