"use client";

import { useEffect, useState } from "react";
import { Building2, Github, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Profile, profilesApi, WorkMode } from "@/lib/api";
import { ScoreBar } from "@/components/ui";

export function CandidateSearch() {
  const { isAuthenticated, user } = useAuth();
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [preferredMode, setPreferredMode] = useState<WorkMode | "">("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch() {
    setLoading(true);
    setSearched(true);
    try {
      const data = await profilesApi.searchCandidates({
        q: searchInput || undefined,
        preferred_mode: preferredMode || undefined,
        preferred_location: preferredLocation || undefined,
        limit: 50,
      });
      setCandidates(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setSearchInput("");
    setPreferredMode("");
    setPreferredLocation("");
    setCandidates([]);
    setSearched(false);
  }

  if (!isAuthenticated || user?.role !== "employer") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <Building2 size={48} />
          <h2>Sign in as an employer</h2>
          <p>Search and find top candidates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Find Candidates</h1>
          <p className="muted">Search across all candidate profiles</p>
        </div>
      </header>

      <div className="candidate-search-bar">
        <div className="search-input-wrap">
          <Search size={18} />
          <input
            placeholder='e.g. "React developer" or "data analyst"'
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runSearch()}
          />
          {searchInput && (
            <button type="button" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
          type="button"
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
        <button className="primary-action" onClick={runSearch} disabled={loading}>
          {loading ? <Loader2 className="spinner" size={18} /> : <Search size={18} />}
          Search
        </button>
      </div>

      {showFilters && (
        <div className="feed-filters-panel">
          <div className="filters-grid">
            <label>
              Preferred mode
              <select value={preferredMode} onChange={e => setPreferredMode(e.target.value as WorkMode | "")}>
                <option value="">Any</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </label>
            <label>
              Preferred location
              <input placeholder="e.g. Sydney" value={preferredLocation}
                onChange={e => setPreferredLocation(e.target.value)} />
            </label>
          </div>
          <button className="clear-filters-btn" type="button" onClick={clearSearch}>
            <X size={14} /> Clear all
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <Loader2 className="spinner" size={32} />
          <p>Searching candidates...</p>
        </div>
      )}

      {!loading && searched && candidates.length === 0 && (
        <div className="empty-state">
          <Search size={48} />
          <h2>No candidates found</h2>
          <p>Try different keywords or remove filters.</p>
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <>
          <p className="muted">{candidates.length} candidate{candidates.length !== 1 ? "s" : ""} found</p>
          <div className="candidate-search-grid">
            {candidates.map(candidate => (
              <article key={candidate.id} className="candidate-search-card">
                <div className="candidate-card-top">
                  <div>
                    <h3>{candidate.full_name || "Anonymous"}</h3>
                    <p className="muted">{candidate.education || "—"}</p>
                  </div>
                  <div className="candidate-badges">
                    {candidate.preferred_mode && (
                      <span className="tag">{candidate.preferred_mode}</span>
                    )}
                    {candidate.preferred_location && (
                      <span className="tag">{candidate.preferred_location}</span>
                    )}
                  </div>
                </div>

                {candidate.years_experience !== null && (
                  <p className="muted" style={{ fontSize: "0.85rem" }}>
                    {candidate.years_experience} yr{candidate.years_experience !== 1 ? "s" : ""} experience
                  </p>
                )}

                {candidate.work_experience && candidate.work_experience.length > 0 && (
                  <div className="mini-experience">
                    {candidate.work_experience.slice(0, 2).map((exp, i) => (
                      <div key={i} className="mini-exp-entry">
                        <strong>{exp.role}</strong>
                        <span className="muted"> @ {exp.company}</span>
                        <small className="muted">
                          {" · "}{exp.start_date} – {exp.end_date || "Present"}
                        </small>
                      </div>
                    ))}
                  </div>
                )}

                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="skill-list compact">
                    {candidate.skills.slice(0, 5).map(skill => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                )}

                {candidate.github_url && (
                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                    className="secondary-action">
                    <Github size={16} />
                    GitHub
                  </a>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
