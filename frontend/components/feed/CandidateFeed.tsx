"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  X,
  Youtube,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMembership } from "@/lib/membership-context";
import {
  Job,
  applicationsApi,
  jobsApi,
  recommendationsApi,
  JobType,
  WorkMode,
  ExperienceLevel,
} from "@/lib/api";
import { JobVideoVisual } from "./JobVideoVisual";

const NON_MEMBER_JOB_LIMIT = 10;
const MEMBER_JOB_LIMIT = 50;
const accentColors = ["teal", "blue", "green", "violet", "orange"];

function filterJobsLocally(jobs: Job[], filters: Filters): Job[] {
  return jobs.filter((job) => {
    if (filters.location) {
      const loc = (job.location || "").toLowerCase();
      if (!loc.includes(filters.location.toLowerCase())) return false;
    }
    if (filters.mode && job.mode !== filters.mode) return false;
    if (filters.job_type && job.job_type !== filters.job_type) return false;
    if (filters.experience_level && job.experience_level !== filters.experience_level) return false;
    if (filters.salary_range) {
      const salary = (job.salary_range || "").toLowerCase();
      if (!salary.includes(filters.salary_range.toLowerCase())) return false;
    }
    if (filters.search) {
      const hay = [
        job.title,
        job.description,
        job.company_name,
        job.industry,
        ...(job.keywords || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(filters.search.toLowerCase())) return false;
    }
    return true;
  });
}

interface Filters {
  search: string;
  location: string;
  mode: WorkMode | "";
  job_type: JobType | "";
  experience_level: ExperienceLevel | "";
  salary_range: string;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  location: "",
  mode: "",
  job_type: "",
  experience_level: "",
  salary_range: "",
};

export function CandidateFeed() {
  const { user, isAuthenticated } = useAuth();
  const { openMembership } = useMembership();
  const isMember = Boolean(user?.is_member);
  const isCandidate = isAuthenticated && user?.role === "candidate";
  const recommendationLimit = isMember ? MEMBER_JOB_LIMIT : NON_MEMBER_JOB_LIMIT;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const feedRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== "").length;

  // Load jobs: AI recommendations for candidates (top 10 free / unlimited for members)
  useEffect(() => {
    async function loadJobs() {
      try {
        setIsLoading(true);
        setCurrentIndex(0);
        let data: Job[];

        if (isCandidate) {
          data = await recommendationsApi.getJobsForCandidate(recommendationLimit);
          data = filterJobsLocally(data, filters);
        } else {
          const params = {
            search: filters.search || undefined,
            location: filters.location || undefined,
            mode: filters.mode as WorkMode || undefined,
            job_type: filters.job_type as JobType || undefined,
            experience_level: filters.experience_level as ExperienceLevel || undefined,
            salary_range: filters.salary_range || undefined,
            limit: NON_MEMBER_JOB_LIMIT,
          };
          data = await jobsApi.list(params);
        }

        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load"));
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, [filters, isCandidate, recommendationLimit]);

  // Intersection Observer to detect current visible card
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const jobId = entry.target.getAttribute("data-job-id");
            const index = jobs.findIndex(j => j.id === jobId);
            if (index !== -1) {
              setCurrentIndex(index);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    cardRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [jobs]);

  // Navigate to specific card
  const scrollToCard = useCallback((index: number) => {
    const job = jobs[index];
    if (!job) return;
    
    const element = cardRefs.current.get(job.id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [jobs]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        if (currentIndex < jobs.length - 1) {
          scrollToCard(currentIndex + 1);
        }
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        if (currentIndex > 0) {
          scrollToCard(currentIndex - 1);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, jobs.length, scrollToCard]);

  async function applyForJob(job: Job) {
    if (!isAuthenticated) {
      alert("Please sign in as a candidate to apply");
      return;
    }
    if (user?.role !== "candidate") {
      alert("Only candidates can apply for jobs");
      return;
    }
    setApplyingId(job.id);
    try {
      await applicationsApi.apply(job.id);
      setAppliedIds((prev) => new Set(prev).add(job.id));
    } catch (error) {
      console.error("Apply failed:", error);
      alert("Failed to apply. Please try again.");
    } finally {
      setApplyingId(null);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Debounced search
  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilter("search", value);
    }, 400);
  }

  if (isLoading) {
    return (
      <div className="tiktok-feed">
        <div className="feed-stage">
          <div className="tiktok-phone-frame tiktok-phone-frame--empty">
            <div className="tiktok-loading">
              <Loader2 className="spinner" size={40} />
              <p>Loading jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tiktok-feed">
        <div className="feed-stage">
          <div className="tiktok-phone-frame tiktok-phone-frame--empty">
            <div className="tiktok-loading">
              <p>Failed to load jobs</p>
              <button className="primary-action" onClick={() => window.location.reload()}>Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tiktok-feed">
      {/* Search + filter bar */}
      <div className="feed-search-bar">
        <div className="feed-search-field">
          <Search size={16} />
          <input
            placeholder="Search jobs, roles, companies... (fuzzy)"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(""); setFilter("search", ""); }}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters(v => !v)}
          type="button"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
        </button>
      </div>

      {isCandidate && !isMember && (
        <div className="membership-feed-notice">
          <span>
            <strong>Free plan:</strong> showing your top {NON_MEMBER_JOB_LIMIT} AI-matched jobs
          </span>
          <button type="button" onClick={openMembership}>
            <Sparkles size={14} />
            Upgrade for unlimited
          </button>
        </div>
      )}

      {isCandidate && isMember && (
        <div className="membership-feed-notice membership-feed-notice--member">
          <Sparkles size={14} />
          <span>Member — unlimited AI recommendations</span>
        </div>
      )}

      {showFilters && (
        <div className="feed-filters-panel">
          <div className="filters-grid">
            <label>
              Location
              <input placeholder="e.g. Sydney" value={filters.location}
                onChange={e => setFilter("location", e.target.value)} />
            </label>
            <label>
              Work mode
              <select value={filters.mode} onChange={e => setFilter("mode", e.target.value as WorkMode | "")}>
                <option value="">Any</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </label>
            <label>
              Job type
              <select value={filters.job_type} onChange={e => setFilter("job_type", e.target.value as JobType | "")}>
                <option value="">Any</option>
                <option value="Full time">Full time</option>
                <option value="Part time">Part time</option>
                <option value="Casual">Casual</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </label>
            <label>
              Experience
              <select value={filters.experience_level} onChange={e => setFilter("experience_level", e.target.value as ExperienceLevel | "")}>
                <option value="">Any</option>
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Expert">Expert</option>
              </select>
            </label>
            <label>
              Salary range
              <input placeholder="e.g. 80000" value={filters.salary_range}
                onChange={e => setFilter("salary_range", e.target.value)} />
            </label>
          </div>
          <button className="clear-filters-btn" type="button"
            onClick={() => { setFilters(DEFAULT_FILTERS); setSearchInput(""); }}>
            <X size={14} /> Clear all filters
          </button>
        </div>
      )}

      <div className="feed-stage">
      {jobs.length === 0 && !isLoading && (
        <div className="tiktok-phone-frame tiktok-phone-frame--empty">
          <div className="tiktok-loading">
            <p>No jobs match your search</p>
            <button className="primary-action" onClick={() => { setFilters(DEFAULT_FILTERS); setSearchInput(""); }}>
              Clear filters
            </button>
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="tiktok-phone-frame">
      <div className="feed-position-badge" aria-live="polite">
        {currentIndex + 1} / {jobs.length}
      </div>
      <div className="tiktok-scroll-container" ref={feedRef}>
        {jobs.map((job, index) => (
          <article
            key={job.id}
            data-job-id={job.id}
            ref={(el) => {
              if (el) cardRefs.current.set(job.id, el);
              else cardRefs.current.delete(job.id);
            }}
            className={`tiktok-card ${currentIndex === index ? "active" : ""}`}
          >
            {/* Video background */}
            <JobVideoVisual
              videoUrl={job.video_url}
              companyName={job.company_name}
              accentColor={accentColors[index % accentColors.length]}
              isSelected={currentIndex === index}
            />

            {/* Side actions (TikTok-style) */}
            <div className="tiktok-side-actions">
              {job.youtube_url && (
                <a
                  href={job.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="side-action youtube-link"
                  title="Watch full video"
                >
                  <Youtube size={28} />
                  <span>Full</span>
                </a>
              )}
              <button
                className="side-action apply-action"
                onClick={() => applyForJob(job)}
                disabled={applyingId === job.id || appliedIds.has(job.id)}
                title={appliedIds.has(job.id) ? "Applied" : "Apply now"}
              >
                {applyingId === job.id ? (
                  <Loader2 className="spinner" size={28} />
                ) : appliedIds.has(job.id) ? (
                  <Check size={28} />
                ) : (
                  <Send size={28} />
                )}
                <span>{appliedIds.has(job.id) ? "Applied" : "Apply"}</span>
              </button>
              {job.match_score !== null && job.match_score !== undefined && (
                <div className="side-action match-indicator">
                  <strong>{Math.round(job.match_score)}%</strong>
                  <span>Match</span>
                </div>
              )}
            </div>

            {/* Bottom overlay with job info */}
            <div className="tiktok-info-overlay">
              <div className="tiktok-job-header">
                <span className="post-time">{formatDate(job.created_at)}</span>
                <h1>{job.title}</h1>
                <p className="company-location">
                  @{job.company_name || "Company"} · {job.location || "Remote"}
                </p>
              </div>

              <div className="tiktok-job-details">
                <div className="job-badges">
                  <span className="badge">{job.job_type || "Full time"}</span>
                  <span className="badge">{job.mode || "Flexible"}</span>
                  <span className="badge">{job.experience_level || "Any level"}</span>
                </div>
                
                <p className="job-description">{job.description?.slice(0, 150)}...</p>

                {job.keywords && job.keywords.length > 0 && (
                  <div className="skill-tags">
                    {job.keywords.slice(0, 5).map((skill) => (
                      <span key={skill} className="skill-tag">#{skill}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}

      </div>
      </div>
      )}
      </div>
    </div>
  );
}
