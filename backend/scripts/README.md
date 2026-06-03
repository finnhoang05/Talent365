# Database seeding

## 20 demo jobs (text + YouTube links)

1. Sign up / sign in as an **employer** in the app.
2. Copy your user id (browser DevTools → Application → Local Storage → auth token, or Supabase `profiles.id`).
3. From `backend/` with venv active:

```bash
source venv/bin/activate
python scripts/seed_jobs.py --employer-id PASTE-YOUR-UUID-HERE
```

Preview without writing:

```bash
python scripts/seed_jobs.py --employer-id PASTE-YOUR-UUID-HERE --dry-run
```

## Feed videos (uploaded clips)

The feed requires an **uploaded** short video per job (not YouTube). Fastest approach for a demo:

1. Download **one** royalty-free vertical clip (10–30s) from [Pexels](https://www.pexels.com/search/videos/office/) or [Coverr](https://coverr.co/).
2. Re-run seed with the same file for all jobs:

```bash
python scripts/seed_jobs.py --employer-id PASTE-YOUR-UUID-HERE --sample-video ./sample.mp4
```

To add videos to jobs you already created, use the employer dashboard upload UI per job, or run the script again on a fresh employer account.

Ensure Supabase Storage bucket `videos` exists and is public (or signed URLs configured).
