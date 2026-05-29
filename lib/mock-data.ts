export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: "Full time" | "Part time" | "Casual" | "Volunteer";
  industry: "Technology" | "Data & AI" | "Product & Design" | "Cloud & DevOps";
  experienceLevel: "Entry" | "Mid" | "Expert";
  mode: "Remote" | "Hybrid" | "On-site";
  salary: string;
  match: number;
  applicants: number;
  posted: string;
  summary: string;
  skills: string[];
  accent: string;
};

export type Candidate = {
  id: string;
  name: string;
  role: string;
  education: string;
  experience: number;
  match: number;
  trust: number;
  github: string;
  verifiedSkills: string[];
  flaggedSkills: string[];
};

export const jobs: Job[] = [
  {
    id: "job-1",
    title: "Frontend Engineer Intern",
    company: "Northstar Labs",
    location: "Sydney, NSW",
    jobType: "Part time",
    industry: "Product & Design",
    experienceLevel: "Entry",
    mode: "Hybrid",
    salary: "$75k package",
    match: 94,
    applicants: 18,
    posted: "2h ago",
    summary:
      "Build accessible React interfaces for an analytics product used by research teams.",
    skills: ["React", "TypeScript", "Accessibility", "Testing"],
    accent: "teal"
  },
  {
    id: "job-2",
    title: "Junior Full Stack Developer",
    company: "BrightLedger",
    location: "Melbourne, VIC",
    jobType: "Full time",
    industry: "Technology",
    experienceLevel: "Mid",
    mode: "Remote",
    salary: "$82k package",
    match: 88,
    applicants: 25,
    posted: "1d ago",
    summary:
      "Ship FastAPI and PostgreSQL features for a finance workflow tool with a small product team.",
    skills: ["FastAPI", "PostgreSQL", "React", "Docker"],
    accent: "blue"
  },
  {
    id: "job-3",
    title: "Graduate AI Engineer",
    company: "SignalWorks",
    location: "Wollongong, NSW",
    jobType: "Casual",
    industry: "Data & AI",
    experienceLevel: "Entry",
    mode: "On-site",
    salary: "$78k package",
    match: 83,
    applicants: 12,
    posted: "3d ago",
    summary:
      "Prototype keyword extraction and matching services for document-heavy recruitment workflows.",
    skills: ["Python", "NLP", "scikit-learn", "APIs"],
    accent: "green"
  },
  {
    id: "job-4",
    title: "Software Engineer",
    company: "Harbour Cloud",
    location: "Brisbane, QLD",
    jobType: "Full time",
    industry: "Cloud & DevOps",
    experienceLevel: "Expert",
    mode: "Hybrid",
    salary: "$92k package",
    match: 79,
    applicants: 34,
    posted: "4d ago",
    summary:
      "Own dashboard features, background jobs, and integration work across a cloud operations platform.",
    skills: ["Next.js", "Node", "PostgreSQL", "CI/CD"],
    accent: "violet"
  }
];

export const candidates: Candidate[] = [
  {
    id: "cand-1",
    name: "Maya Chen",
    role: "React and TypeScript graduate",
    education: "BCompSci, UOW",
    experience: 1,
    match: 93,
    trust: 91,
    github: "github.com/mayacodes",
    verifiedSkills: ["React", "TypeScript", "Jest", "CSS"],
    flaggedSkills: ["GraphQL"]
  },
  {
    id: "cand-2",
    name: "Arjun Patel",
    role: "Full stack developer",
    education: "MIT, Software Engineering",
    experience: 2,
    match: 89,
    trust: 86,
    github: "github.com/arjunp",
    verifiedSkills: ["FastAPI", "PostgreSQL", "Docker"],
    flaggedSkills: ["Kubernetes"]
  },
  {
    id: "cand-3",
    name: "Elena Morris",
    role: "AI and data intern",
    education: "BDataSci, UTS",
    experience: 1,
    match: 84,
    trust: 78,
    github: "github.com/elenaml",
    verifiedSkills: ["Python", "NLP", "pandas"],
    flaggedSkills: ["AWS"]
  },
  {
    id: "cand-4",
    name: "Noah Williams",
    role: "Backend-focused graduate",
    education: "BEng, UNSW",
    experience: 3,
    match: 81,
    trust: 73,
    github: "github.com/noahwdev",
    verifiedSkills: ["Node", "SQL", "REST"],
    flaggedSkills: ["React Native"]
  }
];
