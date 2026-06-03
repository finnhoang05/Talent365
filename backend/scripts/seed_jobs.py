#!/usr/bin/env python3
"""
Seed 20 demo jobs into Supabase for TalentLens.

Usage (from backend/, with venv active):
  python scripts/seed_jobs.py --employer-id YOUR_EMPLOYER_UUID
  python scripts/seed_jobs.py --employer-id YOUR_EMPLOYER_UUID --sample-video ./sample.mp4

Get employer UUID: sign in as employer in the app, copy user id from localStorage
(auth token) or Supabase profiles table where role = 'employer'.
"""

from __future__ import annotations

import argparse
import sys
import uuid
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(BACKEND_ROOT))
sys.path.insert(0, str(SCRIPT_DIR))

from app.database import get_supabase
from app.services.cv_parser import extract_keywords
from app.services.video_processor import trim_video_to_duration
from seed_jobs_data import SEED_JOBS


def ensure_employer(db, employer_id: str) -> None:
    result = db.table("profiles").select("id, role, company_name").eq("id", employer_id).execute()
    if not result.data:
        raise SystemExit(f"No profile found for id {employer_id}. Sign up as employer first.")
    profile = result.data[0]
    if profile.get("role") != "employer":
        raise SystemExit(f"Profile {employer_id} is role={profile.get('role')}, not employer.")


def upload_video(db, job_id: str, video_bytes: bytes) -> str:
    trimmed = trim_video_to_duration(video_bytes, max_duration=30)
    storage_path = f"{job_id}/video.mp4"
    db.storage.from_("videos").upload(
        storage_path,
        trimmed,
        {"content-type": "video/mp4", "upsert": "true"},
    )
    return db.storage.from_("videos").get_public_url(storage_path)


def seed_jobs(employer_id: str, sample_video: Path | None, dry_run: bool) -> None:
    db = get_supabase()
    ensure_employer(db, employer_id)

    video_bytes: bytes | None = None
    if sample_video:
        if not sample_video.is_file():
            raise SystemExit(f"Video file not found: {sample_video}")
        video_bytes = sample_video.read_bytes()
        print(f"Loaded sample video ({len(video_bytes) / 1024 / 1024:.1f} MB) — will attach to each job.")

    created_ids: list[str] = []

    for i, job in enumerate(SEED_JOBS, start=1):
        payload = {
            "employer_id": employer_id,
            "title": job["title"],
            "description": job["description"],
            "keywords": extract_keywords(job["description"]),
            "location": job["location"],
            "mode": job["mode"],
            "job_type": job["job_type"],
            "industry": job["industry"],
            "experience_level": job["experience_level"],
            "salary_range": job["salary_range"],
            "youtube_url": job.get("youtube_url"),
            "is_active": True,
        }

        if dry_run:
            print(f"[dry-run] Would create: {job['title']}")
            continue

        result = db.table("jobs").insert(payload).execute()
        if not result.data:
            print(f"Failed to insert job {i}: {job['title']}", file=sys.stderr)
            continue

        job_id = result.data[0]["id"]
        created_ids.append(job_id)
        print(f"✓ {i}/20 — {job['title']}")

        if video_bytes:
            try:
                video_url = upload_video(db, job_id, video_bytes)
                db.table("jobs").update({"video_url": video_url}).eq("id", job_id).execute()
                print(f"    video attached")
            except Exception as e:
                print(f"    video upload failed: {e}", file=sys.stderr)

    if not dry_run:
        print(f"\nDone. Created {len(created_ids)} jobs for employer {employer_id}.")
        if not video_bytes:
            print(
                "No feed videos yet. Re-run with --sample-video path/to/short.mp4 "
                "(one clip is fine for all jobs), or upload via employer dashboard."
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed 20 demo jobs")
    parser.add_argument(
        "--employer-id",
        required=True,
        help="UUID of an existing employer profile (Bearer token / profiles.id)",
    )
    parser.add_argument(
        "--sample-video",
        type=Path,
        help="Optional MP4/WebM to upload as the 30s feed clip for every job",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print jobs without inserting")
    args = parser.parse_args()

    try:
        uuid.UUID(args.employer_id)
    except ValueError:
        raise SystemExit("--employer-id must be a valid UUID")

    seed_jobs(args.employer_id, args.sample_video, args.dry_run)


if __name__ == "__main__":
    main()
