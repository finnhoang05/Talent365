"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronUp,
  FileText,
  Github,
  LayoutDashboard,
  MapPin,
  Play,
  Search,
  Send,
  SlidersHorizontal,
  Upload,
  UserRound
} from "lucide-react";
import type { ElementType, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { candidates, jobs, type Candidate, type Job } from "@/lib/mock-data";

type View = "feed" | "profile" | "employer";
type WorkModeFilter = "All" | Job["mode"];

const navItems: Array<{ id: View; label: string; icon: ElementType }> = [
  { id: "feed", label: "Candidate Feed", icon: Play },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "employer", label: "Employer", icon: LayoutDashboard }
];

export default function Home() {
  const [view, setView] = useState<View>("feed");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [selectedJobTypes, setSelectedJobTypes] = useState<Job["jobType"][]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<Job["industry"][]>([]);
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState<Job["experienceLevel"][]>([]);
  const [modeFilter, setModeFilter] = useState<WorkModeFilter>("All");
  const [minimumMatch, setMinimumMatch] = useState(0);
  const [selectedJob, setSelectedJob] = useState(jobs[0]);
  const [applied, setApplied] = useState<string[]>([]);

  const roleOptions = useMemo(() => jobs.map((job) => job.title).sort(), []);
  const locationOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.location))).sort(),
    []
  );
  const jobTypeOptions = useMemo<Job["jobType"][]>(
    () => ["Full time", "Part time", "Casual", "Volunteer"],
    []
  );
  const industryOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.industry))).sort(),
    []
  );
  const experienceOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.experienceLevel))).sort(),
    []
  );
  const filteredJobs = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery =
        !normalisedQuery ||
        [
          job.title,
          job.company,
          job.summary,
          job.location,
          job.jobType,
          job.industry,
          job.experienceLevel,
          job.mode,
          ...job.skills
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalisedQuery);
      const matchesRole = roleFilter === "All" || job.title === roleFilter;
      const matchesLocation = locationFilter === "All" || job.location === locationFilter;
      const matchesJobType =
        selectedJobTypes.length === 0 || selectedJobTypes.includes(job.jobType);
      const matchesIndustry =
        selectedIndustries.length === 0 || selectedIndustries.includes(job.industry);
      const matchesExperience =
        selectedExperienceLevels.length === 0 ||
        selectedExperienceLevels.includes(job.experienceLevel);
      const matchesMode = modeFilter === "All" || job.mode === modeFilter;
      const matchesScore = job.match >= minimumMatch;

      return (
        matchesQuery &&
        matchesRole &&
        matchesLocation &&
        matchesJobType &&
        matchesIndustry &&
        matchesExperience &&
        matchesMode &&
        matchesScore
      );
    });
  }, [
    locationFilter,
    minimumMatch,
    modeFilter,
    query,
    roleFilter,
    selectedExperienceLevels,
    selectedIndustries,
    selectedJobTypes
  ]);

  useEffect(() => {
    if (filteredJobs.length > 0 && !filteredJobs.some((job) => job.id === selectedJob.id)) {
      setSelectedJob(filteredJobs[0]);
    }
  }, [filteredJobs, selectedJob.id]);

  function applyForJob(job: Job) {
    setApplied((current) => (current.includes(job.id) ? current : [...current, job.id]));
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-logo" aria-label="Talent365">
            <span>Talent</span>
            <strong>365</strong>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={view === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="auth-actions" aria-label="Sign in options">
          <button className="employer-login" type="button">
            Sign in as employer
          </button>
          <button className="candidate-login" type="button">
            Sign in as candidate
          </button>
        </div>
      </aside>

      <section className="workspace">
        {view === "feed" && (
          <CandidateFeed
            applied={applied}
            filteredJobs={filteredJobs}
            experienceOptions={experienceOptions}
            industryOptions={industryOptions}
            jobTypeOptions={jobTypeOptions}
            locationFilter={locationFilter}
            locationOptions={locationOptions}
            minimumMatch={minimumMatch}
            modeFilter={modeFilter}
            onApply={applyForJob}
            query={query}
            roleFilter={roleFilter}
            roleOptions={roleOptions}
            selectedJob={selectedJob}
            selectedExperienceLevels={selectedExperienceLevels}
            selectedIndustries={selectedIndustries}
            selectedJobTypes={selectedJobTypes}
            setLocationFilter={setLocationFilter}
            setMinimumMatch={setMinimumMatch}
            setModeFilter={setModeFilter}
            setQuery={setQuery}
            setRoleFilter={setRoleFilter}
            setSelectedExperienceLevels={setSelectedExperienceLevels}
            setSelectedIndustries={setSelectedIndustries}
            setSelectedJobTypes={setSelectedJobTypes}
            setSelectedJob={setSelectedJob}
          />
        )}

        {view === "profile" && <ProfileBuilder />}

        {view === "employer" && (
          <EmployerDashboard
            jobs={jobs}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
          />
        )}
      </section>
    </main>
  );
}

function CandidateFeed({
  applied,
  filteredJobs,
  experienceOptions,
  industryOptions,
  jobTypeOptions,
  locationFilter,
  locationOptions,
  minimumMatch,
  modeFilter,
  onApply,
  query,
  roleFilter,
  roleOptions,
  selectedJob,
  selectedExperienceLevels,
  selectedIndustries,
  selectedJobTypes,
  setLocationFilter,
  setMinimumMatch,
  setModeFilter,
  setQuery,
  setRoleFilter,
  setSelectedExperienceLevels,
  setSelectedIndustries,
  setSelectedJobTypes,
  setSelectedJob
}: {
  applied: string[];
  filteredJobs: Job[];
  experienceOptions: Job["experienceLevel"][];
  industryOptions: Job["industry"][];
  jobTypeOptions: Job["jobType"][];
  locationFilter: string;
  locationOptions: string[];
  minimumMatch: number;
  modeFilter: WorkModeFilter;
  onApply: (job: Job) => void;
  query: string;
  roleFilter: string;
  roleOptions: string[];
  selectedJob: Job;
  selectedExperienceLevels: Job["experienceLevel"][];
  selectedIndustries: Job["industry"][];
  selectedJobTypes: Job["jobType"][];
  setLocationFilter: (locationFilter: string) => void;
  setMinimumMatch: (minimumMatch: number) => void;
  setModeFilter: (modeFilter: WorkModeFilter) => void;
  setQuery: (query: string) => void;
  setRoleFilter: (roleFilter: string) => void;
  setSelectedExperienceLevels: (experienceLevels: Job["experienceLevel"][]) => void;
  setSelectedIndustries: (industries: Job["industry"][]) => void;
  setSelectedJobTypes: (jobTypes: Job["jobType"][]) => void;
  setSelectedJob: (job: Job) => void;
}) {
  function clearFilters() {
    setQuery("");
    setRoleFilter("All");
    setLocationFilter("All");
    setSelectedJobTypes([]);
    setSelectedIndustries([]);
    setSelectedExperienceLevels([]);
    setModeFilter("All");
    setMinimumMatch(0);
  }

  function toggleOption<T extends string>(value: T, values: T[], setValues: (next: T[]) => void) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <div className="feed-layout">
      <div className="search-row">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search jobs"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by skill, role, or company"
            value={query}
          />
        </div>
        <div className="location-picker">
          <MapPin size={17} />
          <select
            aria-label="Choose location"
            onChange={(event) => setLocationFilter(event.target.value)}
            value={locationFilter}
          >
            <option value="All">All</option>
            {locationOptions.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </select>
        </div>
      </div>

      <aside className="feed-help" aria-label="Feed filters and status">
        <div className="filter-summary">
          <Metric label="Jobs shown" value={String(filteredJobs.length)} />
          <Metric label="Applied" value={String(applied.length)} />
          <Metric label="Current match" value={`${selectedJob.match}%`} />
        </div>

        <div className="filter-panel" aria-label="Job filters">
          <div className="panel-heading">
            <SlidersHorizontal size={18} />
            <strong>Filters</strong>
            <button onClick={clearFilters} type="button">
              Clear all
            </button>
          </div>
          <FilterGroup title="Job Type">
            {jobTypeOptions.map((jobType) => (
              <CheckboxFilter
                checked={selectedJobTypes.includes(jobType)}
                key={jobType}
                label={jobType}
                onChange={() => toggleOption(jobType, selectedJobTypes, setSelectedJobTypes)}
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Industry & Roles">
            {industryOptions.map((industry) => (
              <CheckboxFilter
                checked={selectedIndustries.includes(industry)}
                key={industry}
                label={industry}
                onChange={() => toggleOption(industry, selectedIndustries, setSelectedIndustries)}
              />
            ))}
            <label>
              Role
              <select onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}>
                <option>All</option>
                {roleOptions.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
          </FilterGroup>
          <FilterGroup title="Experience Level">
            {experienceOptions.map((experience) => (
              <CheckboxFilter
                checked={selectedExperienceLevels.includes(experience)}
                key={experience}
                label={experience}
                onChange={() =>
                  toggleOption(experience, selectedExperienceLevels, setSelectedExperienceLevels)
                }
              />
            ))}
          </FilterGroup>
          <label>
            Work mode
            <select
              onChange={(event) => setModeFilter(event.target.value as WorkModeFilter)}
              value={modeFilter}
            >
              <option>All</option>
              <option>Remote</option>
              <option>Hybrid</option>
              <option>On-site</option>
            </select>
          </label>
          <label>
            Min match
            <input
              max="100"
              min="0"
              onChange={(event) => setMinimumMatch(Number(event.target.value))}
              type="range"
              value={minimumMatch}
            />
            <span>{minimumMatch}%+</span>
          </label>
        </div>
      </aside>

      <section className="feed-column" aria-label="Video job feed">
        <div className="video-stack">
          {filteredJobs.length === 0 && (
            <div className="empty-feed">
              <strong>No jobs match these filters</strong>
              <button className="primary-action" onClick={clearFilters} type="button">
                Clear filters
              </button>
            </div>
          )}

          {filteredJobs.map((job) => (
            <article
              className={selectedJob.id === job.id ? "video-card selected" : "video-card"}
              key={job.id}
              onClick={() => setSelectedJob(job)}
            >
              <div className={`video-visual ${job.accent}`}>
                <div className="play-button">
                  <Play size={22} fill="currentColor" />
                </div>
                <div className="company-badge">
                  <Building2 size={15} />
                  {job.company}
                </div>
              </div>

              <div className="video-copy">
                <div>
                  <p>{job.posted}</p>
                  <h2>{job.title}</h2>
                  <span>
                    {job.location} / {job.jobType} / {job.mode}
                  </span>
                  <small>{job.summary}</small>
                </div>
                <div className="video-card-footer">
                  <div className="skill-list compact">
                    {job.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                  <div className="card-actions">
                    <strong>{job.match}% match</strong>
                    <button
                      className="primary-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        onApply(job);
                      }}
                      type="button"
                    >
                      {applied.includes(job.id) ? <Check size={18} /> : <Send size={18} />}
                      {applied.includes(job.id) ? "Application sent" : "Apply"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="top-match-panel" aria-label="Top matches">
        <strong>Top matches</strong>
        <div className="recommendation-strip">
          {jobs.slice(0, 3).map((job) => (
            <button key={job.id} onClick={() => setSelectedJob(job)} type="button">
              <span>{job.match}%</span>
              {job.company}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function FilterGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="filter-group">
      <div className="filter-group-heading">
        <strong>{title}</strong>
      </div>
      <div className="filter-options">{children}</div>
    </section>
  );
}

function CheckboxFilter({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="checkbox-filter">
      <input checked={checked} onChange={onChange} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function ProfileBuilder() {
  const [saved, setSaved] = useState(false);

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <form className="form-grid" onSubmit={submitProfile}>
      <section className="form-section">
        <div className="section-heading">
          <UserRound size={20} />
          <h2>Candidate details</h2>
        </div>
        <label>
          Full name
          <input defaultValue="Maya Chen" name="full_name" />
        </label>
        <label>
          Contact email
          <input defaultValue="maya.chen@example.com" name="email" type="email" />
        </label>
        <label>
          Education
          <input defaultValue="Bachelor of Computer Science, UOW" name="education" />
        </label>
        <label>
          Years of experience
          <input defaultValue="1" min="0" name="years_experience" type="number" />
        </label>
      </section>

      <section className="form-section">
        <div className="section-heading">
          <Github size={20} />
          <h2>Verification inputs</h2>
        </div>
        <label>
          GitHub profile URL
          <input defaultValue="https://github.com/mayacodes" name="github_url" />
        </label>
        <label>
          CV PDF
          <span className="upload-control">
            <Upload size={18} />
            <input accept="application/pdf" name="cv_file" type="file" />
          </span>
        </label>
        <label>
          Highlight skills
          <textarea defaultValue="React, TypeScript, accessibility testing, REST APIs" name="skills" />
        </label>
        <button className="primary-action" type="submit">
          <FileText size={18} />
          Save profile
        </button>
        {saved && <p className="success-note">Profile saved locally for the demo.</p>}
      </section>
    </form>
  );
}

function EmployerDashboard({
  jobs,
  selectedJob,
  setSelectedJob
}: {
  jobs: Job[];
  selectedJob: Job;
  setSelectedJob: (job: Job) => void;
}) {
  const [posted, setPosted] = useState(false);

  function submitJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPosted(true);
  }

  return (
    <div className="employer-layout">
      <form className="job-composer" onSubmit={submitJob}>
        <div className="section-heading">
          <BriefcaseBusiness size={20} />
          <h2>Post a role</h2>
        </div>
        <label>
          Job title
          <input defaultValue="Frontend Engineer Intern" name="job_title" />
        </label>
        <label>
          Job description
          <textarea
            defaultValue="Build accessible React interfaces, write tests, and collaborate with product designers."
            name="job_description"
          />
        </label>
        <div className="two-column">
          <label>
            Work mode
            <select defaultValue="Hybrid" name="work_mode">
              <option>Remote</option>
              <option>Hybrid</option>
              <option>On-site</option>
            </select>
          </label>
          <label>
            Location
            <input defaultValue="Sydney, NSW" name="job_location" />
          </label>
        </div>
        <label>
          Video pitch
          <span className="upload-control">
            <Upload size={18} />
            <input accept="video/*" name="video_file" type="file" />
          </span>
        </label>
        <button className="primary-action" type="submit">
          <Upload size={18} />
          Post job
        </button>
        {posted && <p className="success-note">Job saved locally for the demo.</p>}
      </form>

      <section className="candidate-board">
        <div className="board-toolbar">
          <div>
            <p className="eyebrow">Top-10 recommendations</p>
            <h2>{selectedJob.title}</h2>
          </div>
          <select
            aria-label="Select job"
            onChange={(event) => {
              const nextJob = jobs.find((job) => job.id === event.target.value);
              if (nextJob) setSelectedJob(nextJob);
            }}
            value={selectedJob.id}
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div className="candidate-grid">
          {candidates.map((candidate) => (
            <CandidateCard candidate={candidate} key={candidate.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <article className="candidate-card">
      <div className="candidate-header">
        <div>
          <h3>{candidate.name}</h3>
          <p>{candidate.role}</p>
        </div>
        <ArrowUpRight size={18} />
      </div>
      <span>{candidate.education}</span>
      <div className="score-row">
        <ScoreBar label="Match" value={candidate.match} />
        <ScoreBar label="Trust" value={candidate.trust} />
      </div>
      <div className="skill-list compact">
        {candidate.verifiedSkills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <div className="flagged">
        <ChevronUp size={15} />
        Needs evidence: {candidate.flaggedSkills.join(", ")}
      </div>
      <button className="secondary-action" type="button">
        <Github size={17} />
        Verify GitHub
      </button>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="bar">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
