# Talent365 Frontend

Next.js frontend for the Talent365 project. It implements the main demo screens from the specification:

- Candidate video job feed with keyword search and Top Match chips
- Candidate profile form with CV upload and GitHub URL fields
- Employer job posting form with video upload field
- Employer dashboard with candidate recommendations, Match %, Trust %, verified skills, and flagged skills

## Requirements

- Node.js 20 LTS or newer
- npm
- git

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Backend Endpoints Expected Later

- `GET /jobs?q=keyword`
- `POST /jobs`
- `GET /jobs/recommendations/{candidate_id}`
- `POST /candidates/profile`
- `GET /candidates`
- `GET /candidates/recommendations/{job_id}`
- `POST /applications/{job_id}`
- `GET /applications/job/{job_id}`
