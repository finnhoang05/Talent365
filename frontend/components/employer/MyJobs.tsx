"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Calendar,
  Edit,
  Eye,
  Loader2,
  MapPin,
  MoreVertical,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Job, jobsApi } from "@/lib/api";
import { useEmployerJobs } from "@/lib/hooks";

export function MyJobs() {
  const { isAuthenticated, user } = useAuth();
  const { jobs, isLoading, error, refetch } = useEmployerJobs();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(jobId: string) {
    if (!confirm("Are you sure you want to delete this job?")) return;
    
    setDeletingId(jobId);
    try {
      await jobsApi.delete(jobId);
      await refetch();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  }

  if (!isAuthenticated || user?.role !== "employer") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <BriefcaseBusiness size={48} />
          <h2>Sign in as an employer</h2>
          <p>View and manage your job postings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <Loader2 className="spinner" size={32} />
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <p>{error.message}</p>
          <button className="primary-action" onClick={refetch}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>My Job Postings</h1>
          <p className="muted">{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p>
        </div>
        <Link href="/employer/dashboard" className="primary-action">
          <BriefcaseBusiness size={18} />
          Post New Job
        </Link>
      </header>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <BriefcaseBusiness size={48} />
          <h2>No jobs posted yet</h2>
          <p>Create your first job posting to start finding candidates.</p>
          <Link href="/employer/dashboard" className="primary-action">
            Post a Job
          </Link>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <article key={job.id} className="job-card">
              <div className="job-card-header">
                <div>
                  <h3>{job.title}</h3>
                  <div className="job-meta">
                    <span><MapPin size={14} /> {job.location || "Remote"}</span>
                    <span><Calendar size={14} /> {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="job-actions">
                  <button
                    className="icon-btn"
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingId === job.id}
                    title="Delete job"
                  >
                    {deletingId === job.id ? (
                      <Loader2 className="spinner" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              <p className="job-description">{job.description?.slice(0, 150)}...</p>

              <div className="job-tags">
                <span className="tag">{job.job_type || "Full time"}</span>
                <span className="tag">{job.mode || "Flexible"}</span>
                <span className="tag">{job.experience_level || "Any"}</span>
              </div>

              {job.keywords && job.keywords.length > 0 && (
                <div className="skill-list compact">
                  {job.keywords.slice(0, 4).map((kw) => (
                    <span key={kw}>{kw}</span>
                  ))}
                </div>
              )}

              <div className="job-card-footer">
                <span className={`status-badge ${job.is_active ? "active" : "inactive"}`}>
                  {job.is_active ? "Active" : "Inactive"}
                </span>
                <Link href={`/employer/dashboard?job=${job.id}`} className="secondary-action">
                  <Users size={16} />
                  View Candidates
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
