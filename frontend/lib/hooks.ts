"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Job,
  Candidate,
  Application,
  jobsApi,
  applicationsApi,
  recommendationsApi,
  JobType,
  WorkMode,
  ExperienceLevel,
} from "./api";

interface UseJobsOptions {
  location?: string;
  mode?: WorkMode;
  job_type?: JobType;
  experience_level?: ExperienceLevel;
  industry?: string;
  search?: string;
}

export function useJobs(options: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await jobsApi.list(options);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch jobs"));
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(options)]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, isLoading, error, refetch: fetchJobs };
}

export function useRecommendedJobs(enabled = true, isMember = false) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const limit = isMember ? 50 : 10;

  const fetchJobs = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await recommendationsApi.getJobsForCandidate(limit);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch recommendations"));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, limit]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, isLoading, error, refetch: fetchJobs, limit };
}

export function useRecommendedCandidates(jobId: string | null, isMember = false) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const limit = isMember ? 50 : 10;

  const fetchCandidates = useCallback(async () => {
    if (!jobId) {
      setCandidates([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await recommendationsApi.getCandidatesForJob(jobId, limit);
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch candidates"));
    } finally {
      setIsLoading(false);
    }
  }, [jobId, limit]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return { candidates, isLoading, error, refetch: fetchCandidates, limit };
}

export function useMyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.getMyApplications();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch applications"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, isLoading, error, refetch: fetchApplications };
}

export function useJobApplications(jobId: string | null) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!jobId) {
      setApplications([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.getJobApplications(jobId);
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch applications"));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, isLoading, error, refetch: fetchApplications };
}

export function useEmployerJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await jobsApi.getMyJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch jobs"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, isLoading, error, refetch: fetchJobs };
}
