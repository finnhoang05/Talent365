"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Application, applicationsApi } from "@/lib/api";

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow", label: "Pending" },
  reviewed: { icon: AlertCircle, color: "text-blue", label: "Reviewed" },
  accepted: { icon: CheckCircle, color: "text-green", label: "Accepted" },
  rejected: { icon: XCircle, color: "text-red", label: "Rejected" },
};

export function ApplicationHistory() {
  const { isAuthenticated, user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchApplications() {
      try {
        const data = await applicationsApi.getMyApplications();
        setApplications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load applications");
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [isAuthenticated]);

  if (!isAuthenticated || user?.role !== "candidate") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <FileText size={48} />
          <h2>Sign in as a candidate</h2>
          <p>View your job application history and track your progress.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <Loader2 className="spinner" size={32} />
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>My Applications</h1>
        <p className="muted">{applications.length} application{applications.length !== 1 ? "s" : ""}</p>
      </header>

      {applications.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h2>No applications yet</h2>
          <p>Start applying to jobs from the feed to track them here.</p>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app) => {
            const status = statusConfig[app.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            
            return (
              <article key={app.id} className="application-card">
                <div className="application-main">
                  <div className="application-info">
                    <h3>{app.job_title || "Job Position"}</h3>
                    <p className="company-name">{app.company_name || "Company"}</p>
                    <time className="muted">
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </time>
                  </div>
                  <div className={`application-status ${status.color}`}>
                    <StatusIcon size={18} />
                    <span>{status.label}</span>
                  </div>
                </div>

                <div className="application-scores">
                  {app.match_score !== null && (
                    <div className="score-pill">
                      <span>Match</span>
                      <strong>{Math.round(app.match_score)}%</strong>
                    </div>
                  )}
                  {app.trust_score !== null && (
                    <div className="score-pill">
                      <span>Trust</span>
                      <strong>{Math.round(app.trust_score)}%</strong>
                    </div>
                  )}
                </div>

                {app.verified_skills && app.verified_skills.length > 0 && (
                  <div className="verified-skills">
                    <span className="label">Verified:</span>
                    <div className="skill-list compact">
                      {app.verified_skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="verified">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
