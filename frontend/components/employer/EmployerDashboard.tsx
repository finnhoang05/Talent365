"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Link2,
  Loader2,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMembership } from "@/lib/membership-context";
import {
  Job,
  jobsApi,
  JobType,
  WorkMode,
  ExperienceLevel,
} from "@/lib/api";
import { useEmployerJobs, useRecommendedCandidates } from "@/lib/hooks";
import { CandidateCard } from "./CandidateCard";

const JOB_TYPE_OPTIONS: JobType[] = ["Full time", "Part time", "Casual", "Volunteer"];
const EXPERIENCE_OPTIONS: ExperienceLevel[] = ["Entry", "Mid", "Expert"];

export function EmployerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { openMembership } = useMembership();
  const isMember = Boolean(user?.is_member);
  const { jobs: myJobs, isLoading: jobsLoading, refetch: refetchJobs } = useEmployerJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { candidates, isLoading: candidatesLoading, limit: candidateLimit } =
    useRecommendedCandidates(selectedJob?.id || null, isMember);

  useEffect(() => {
    if (myJobs.length > 0 && !selectedJob) {
      setSelectedJob(myJobs[0]);
    }
  }, [myJobs, selectedJob]);

  async function handlePostJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated || user?.role !== "employer") {
      setMessage({ type: "error", text: "Please sign in as an employer" });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    setPosting(true);
    setMessage(null);

    try {
      const youtubeUrl = formData.get("youtube_url") as string;
      
      const newJob = await jobsApi.create({
        title: formData.get("job_title") as string,
        description: formData.get("job_description") as string,
        location: formData.get("job_location") as string,
        mode: formData.get("work_mode") as WorkMode,
        job_type: formData.get("job_type") as JobType,
        industry: formData.get("industry") as string,
        experience_level: formData.get("experience_level") as ExperienceLevel,
        youtube_url: youtubeUrl || undefined,
      });

      const videoFile = formData.get("video_file") as File;
      if (videoFile && videoFile.size > 0) {
        try {
          await jobsApi.uploadVideo(newJob.id, videoFile);
        } catch (e) {
          console.warn("Video upload failed:", e);
        }
      }

      await refetchJobs();
      setSelectedJob(newJob);
      setMessage({ type: "success", text: "Job posted successfully!" });
      form.reset();
    } catch (error) {
      console.error("Post failed:", error);
      setMessage({ type: "error", text: "Failed to post job" });
    } finally {
      setPosting(false);
    }
  }

  if (!isAuthenticated || user?.role !== "employer") {
    return (
      <div className="employer-layout">
        <div className="empty-feed">
          <BriefcaseBusiness size={48} />
          <strong>Sign in as an employer</strong>
          <p>Post jobs and find top candidates with AI-powered matching.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employer-layout">
      <form className="job-composer" onSubmit={handlePostJob}>
        <div className="section-heading">
          <BriefcaseBusiness size={20} />
          <h2>Post a role</h2>
        </div>
        <label>
          Job title
          <input name="job_title" required placeholder="e.g. Frontend Engineer" />
        </label>
        <label>
          Job description
          <textarea
            name="job_description"
            required
            placeholder="Describe the role, responsibilities, and requirements..."
            rows={4}
          />
        </label>
        <div className="two-column">
          <label>
            Work mode
            <select name="work_mode" defaultValue="Hybrid">
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </label>
          <label>
            Location
            <input name="job_location" placeholder="e.g. Sydney, NSW" />
          </label>
        </div>
        <div className="two-column">
          <label>
            Job type
            <select name="job_type" defaultValue="Full time">
              {JOB_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Experience level
            <select name="experience_level" defaultValue="Entry">
              {EXPERIENCE_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Industry
          <input name="industry" placeholder="e.g. Technology, Finance" />
        </label>
        <div className="video-input-group">
          <label>
            <span className="label-with-badge">
              Short video pitch
              <span className="badge">Max 30 sec</span>
            </span>
            <span className="upload-control">
              <Video size={18} />
              <input accept="video/mp4,video/webm,video/quicktime" name="video_file" type="file" />
            </span>
            <small className="input-hint">Upload a short video that auto-plays in the feed</small>
          </label>
          <label>
            YouTube link (optional)
            <div className="url-input">
              <Link2 size={18} />
              <input
                name="youtube_url"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <small className="input-hint">Link to full video for candidates to watch</small>
          </label>
        </div>
        <button className="primary-action" type="submit" disabled={posting}>
          {posting ? <Loader2 className="spinner" size={18} /> : <Upload size={18} />}
          Post job
        </button>
        {message && (
          <p className={message.type === "success" ? "success-note" : "error-note"}>
            {message.text}
          </p>
        )}
      </form>

      <section className="candidate-board">
        {!isMember && (
          <div className="membership-feed-notice">
            <span>
              <strong>Free plan:</strong> top {candidateLimit} AI-matched candidates per job
            </span>
            <button type="button" onClick={openMembership}>
              <Sparkles size={14} />
              Upgrade for unlimited
            </button>
          </div>
        )}
        <div className="board-toolbar">
          <div>
            <p className="eyebrow">
              {isMember ? "AI recommendations" : `Top ${candidateLimit} recommendations`}
            </p>
            <h2>{selectedJob?.title || "Select a job"}</h2>
          </div>
          <select
            aria-label="Select job"
            onChange={(event) => {
              const nextJob = myJobs.find((job) => job.id === event.target.value);
              if (nextJob) setSelectedJob(nextJob);
            }}
            value={selectedJob?.id || ""}
          >
            {jobsLoading && <option>Loading...</option>}
            {myJobs.length === 0 && !jobsLoading && <option>No jobs posted yet</option>}
            {myJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div className="candidate-grid">
          {candidatesLoading && (
            <div className="loading-card">
              <Loader2 className="spinner" size={24} />
              <span>Finding matches...</span>
            </div>
          )}

          {!candidatesLoading && candidates.length === 0 && (
            <div className="empty-card">
              <p>No candidates found. Post a job to see matches!</p>
            </div>
          )}

          {candidates.map((candidate) => (
            <CandidateCard candidate={candidate} key={candidate.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
