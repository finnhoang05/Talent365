const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================
// Types
// ============================================

export type JobType = "Full time" | "Part time" | "Casual" | "Volunteer";
export type WorkMode = "Remote" | "Hybrid" | "On-site";
export type ExperienceLevel = "Entry" | "Mid" | "Expert";
export type UserRole = "candidate" | "employer";

export interface WorkExperience {
  role: string;
  company: string;
  start_date: string;   // "YYYY-MM"
  end_date: string | null;
  description: string | null;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  github_url: string | null;
  cv_url: string | null;
  cv_keywords: string[] | null;
  education: string | null;
  years_experience: number | null;
  skills: string[] | null;
  work_experience: WorkExperience[] | null;
  preferred_mode: WorkMode | null;
  preferred_location: string | null;
  company_name: string | null;
  is_member: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  keywords: string[] | null;
  video_url: string | null;       // Short uploaded video (max 30s)
  youtube_url: string | null;     // Link to full YouTube video
  location: string | null;
  mode: WorkMode | null;
  job_type: JobType | null;
  industry: string | null;
  experience_level: ExperienceLevel | null;
  salary_range: string | null;
  is_active: boolean;
  created_at: string;
  company_name?: string | null;
  match_score?: number | null;
  applicant_count?: number | null;
}

export interface Candidate extends Profile {
  match_score?: number | null;
  trust_score?: number | null;
  verified_skills?: string[] | null;
  flagged_skills?: string[] | null;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  match_score: number | null;
  trust_score: number | null;
  verified_skills: string[] | null;
  flagged_skills: string[] | null;
  status: string;
  applied_at: string;
  job_title?: string | null;
  company_name?: string | null;
  candidate_name?: string | null;
  candidate_email?: string | null;
}

// ============================================
// Auth API
// ============================================

export function setAuthToken(userId: string) {
  localStorage.setItem("auth_token", userId);
}

export function clearAuthToken() {
  localStorage.removeItem("auth_token");
}

export function getAuthToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
}

// ============================================
// Profiles API
// ============================================

export const profilesApi = {
  create: (data: {
    role: UserRole;
    full_name?: string;
    email?: string;
    github_url?: string;
    education?: string;
    years_experience?: number;
    skills?: string[];
    company_name?: string;
  }) => request<Profile>("/profiles/", { method: "POST", body: JSON.stringify(data) }),

  getMe: () => request<Profile>("/profiles/me/"),

  updateMe: (data: Partial<{
    full_name: string;
    email: string;
    github_url: string;
    education: string;
    years_experience: number;
    skills: string[];
    work_experience: WorkExperience[];
    preferred_mode: WorkMode;
    preferred_location: string;
    company_name: string;
  }>) => request<Profile>("/profiles/me/", { method: "PATCH", body: JSON.stringify(data) }),

  upgradeMembership: () =>
    request<{ message: string; is_member: boolean }>("/profiles/me/membership", { method: "POST" }),

  cancelMembership: () =>
    request<{ message: string; is_member: boolean }>("/profiles/me/membership", { method: "DELETE" }),

  searchCandidates: (params: {
    q?: string;
    skills?: string;
    preferred_mode?: string;
    preferred_location?: string;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") searchParams.append(k, String(v));
    });
    return request<Profile[]>(`/profiles/search/candidates?${searchParams.toString()}`);
  },

  uploadCv: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/profiles/me/cv`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new ApiError(response.status, error.detail);
    }

    return response.json();
  },

  getById: (id: string) => request<Profile>(`/profiles/${id}`),

  listCandidates: (limit = 50) =>
    request<Profile[]>(`/profiles/?role=candidate&limit=${limit}`),
};

// ============================================
// Jobs API
// ============================================

export const jobsApi = {
  create: (data: {
    title: string;
    description: string;
    location?: string;
    mode?: WorkMode;
    job_type?: JobType;
    industry?: string;
    experience_level?: ExperienceLevel;
    salary_range?: string;
    youtube_url?: string;  // Link to full YouTube video
  }) => request<Job>("/jobs/", { method: "POST", body: JSON.stringify(data) }),

  list: (params?: {
    location?: string;
    mode?: WorkMode;
    job_type?: JobType;
    experience_level?: ExperienceLevel;
    industry?: string;
    salary_range?: string;
    search?: string;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return request<Job[]>(`/jobs/${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => request<Job>(`/jobs/${id}`),

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    location: string;
    mode: WorkMode;
    job_type: JobType;
    industry: string;
    experience_level: ExperienceLevel;
    salary_range: string;
    is_active: boolean;
  }>) => request<Job>(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) => request<{ message: string }>(`/jobs/${id}`, { method: "DELETE" }),

  uploadVideo: async (jobId: string, file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/jobs/${jobId}/video`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new ApiError(response.status, error.detail);
    }

    return response.json();
  },

  getMyJobs: () => request<Job[]>("/jobs/employer/mine"),
};

// ============================================
// Applications API
// ============================================

export const applicationsApi = {
  apply: (jobId: string) =>
    request<Application>("/applications/", { method: "POST", body: JSON.stringify({ job_id: jobId }) }),

  getMyApplications: () => request<Application[]>("/applications/mine"),

  getJobApplications: (jobId: string) => request<Application[]>(`/applications/job/${jobId}`),

  updateStatus: (applicationId: string, status: string) =>
    request<{ message: string }>(`/applications/${applicationId}/status?status=${status}`, { method: "PATCH" }),
};

// ============================================
// Recommendations API
// ============================================

export const recommendationsApi = {
  getJobsForCandidate: (limit = 10) =>
    request<Job[]>(`/recommendations/jobs?limit=${limit}`),

  getCandidatesForJob: (jobId: string, limit = 10) =>
    request<Candidate[]>(`/recommendations/candidates/${jobId}?limit=${limit}`),
};
