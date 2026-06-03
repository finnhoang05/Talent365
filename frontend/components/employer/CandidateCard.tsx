"use client";

import { ArrowUpRight, ChevronUp, Github } from "lucide-react";
import { Candidate } from "@/lib/api";
import { ScoreBar } from "@/components/ui";

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <article className="candidate-card">
      <div className="candidate-header">
        <div>
          <h3>{candidate.full_name || "Anonymous"}</h3>
          <p>{candidate.education || "—"}</p>
        </div>
        <ArrowUpRight size={18} />
      </div>
      <span>{candidate.years_experience || 0} years experience</span>
      <div className="score-row">
        <ScoreBar label="Match" value={candidate.match_score || 0} />
        <ScoreBar label="Trust" value={candidate.trust_score || 0} />
      </div>
      <div className="skill-list compact">
        {(candidate.verified_skills || candidate.skills || []).slice(0, 4).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      {candidate.flagged_skills && candidate.flagged_skills.length > 0 && (
        <div className="flagged">
          <ChevronUp size={15} />
          Needs evidence: {candidate.flagged_skills.join(", ")}
        </div>
      )}
      {candidate.github_url && (
        <a
          href={candidate.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="secondary-action"
        >
          <Github size={17} />
          View GitHub
        </a>
      )}
    </article>
  );
}
