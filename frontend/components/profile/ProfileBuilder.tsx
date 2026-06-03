"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Briefcase,
  FileText,
  Github,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { profilesApi, WorkExperience, WorkMode } from "@/lib/api";

const EMPTY_EXP: WorkExperience = {
  role: "",
  company: "",
  start_date: "",
  end_date: null,
  description: null,
};

export function ProfileBuilder() {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    education: "",
    years_experience: 0,
    github_url: "",
    skills: "",
    preferred_mode: "" as WorkMode | "",
    preferred_location: "",
  });
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        education: user.education || "",
        years_experience: user.years_experience || 0,
        github_url: user.github_url || "",
        skills: (user.skills || []).join(", "),
        preferred_mode: (user.preferred_mode as WorkMode) || "",
        preferred_location: user.preferred_location || "",
      });
      setWorkExperience(user.work_experience || []);
    }
  }, [user]);

  function updateExp(index: number, field: keyof WorkExperience, value: string | null) {
    setWorkExperience(prev =>
      prev.map((exp, i) => i === index ? { ...exp, [field]: value } : exp)
    );
  }

  function addExp() {
    setWorkExperience(prev => [...prev, { ...EMPTY_EXP }]);
  }

  function removeExp(index: number) {
    setWorkExperience(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      setMessage({ type: "error", text: "Please sign in first" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await profilesApi.updateMe({
        full_name: formData.full_name,
        email: formData.email,
        education: formData.education,
        years_experience: formData.years_experience,
        github_url: formData.github_url,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        work_experience: workExperience.filter(e => e.role && e.company),
        preferred_mode: formData.preferred_mode as WorkMode || undefined,
        preferred_location: formData.preferred_location || undefined,
      });
      await refreshUser();
      setMessage({ type: "success", text: "Profile saved!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCvUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !isAuthenticated) return;
    setUploading(true);
    setMessage(null);
    try {
      const result = await profilesApi.uploadCv(file);
      await refreshUser();
      setMessage({ type: "success", text: `CV uploaded! Extracted ${result.keywords?.length || 0} keywords.` });
    } catch {
      setMessage({ type: "error", text: "Failed to upload CV" });
    } finally {
      setUploading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <UserRound size={48} />
          <h2>Sign in to manage your profile</h2>
          <p>Create a profile to get personalized job matches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>My Profile</h1>
      </header>

      <form onSubmit={handleSubmit} className="profile-sections">
        {/* Basic Info */}
        <section className="profile-card">
          <div className="section-heading">
            <UserRound size={20} />
            <h2>Basic Details</h2>
          </div>
          <div className="two-column">
            <label>
              Full name
              <input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
            </label>
            <label>
              Email
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </label>
          </div>
          <div className="two-column">
            <label>
              Education
              <input value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} placeholder="Bachelor of Computer Science" />
            </label>
            <label>
              Years of experience
              <input type="number" min="0" value={formData.years_experience}
                onChange={e => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })} />
            </label>
          </div>
        </section>

        {/* Preferences */}
        <section className="profile-card">
          <div className="section-heading">
            <MapPin size={20} />
            <h2>Work Preferences</h2>
          </div>
          <div className="two-column">
            <label>
              Preferred working mode
              <select value={formData.preferred_mode} onChange={e => setFormData({ ...formData, preferred_mode: e.target.value as WorkMode | "" })}>
                <option value="">No preference</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </label>
            <label>
              Preferred location
              <input value={formData.preferred_location} onChange={e => setFormData({ ...formData, preferred_location: e.target.value })}
                placeholder="e.g. Sydney, NSW" />
            </label>
          </div>
        </section>

        {/* Work Experience */}
        <section className="profile-card">
          <div className="section-heading">
            <Briefcase size={20} />
            <h2>Work Experience</h2>
          </div>

          {workExperience.length === 0 && (
            <p className="muted" style={{ fontSize: "0.9rem" }}>No work experience added yet.</p>
          )}

          <div className="experience-list">
            {workExperience.map((exp, i) => (
              <div key={i} className="experience-entry">
                <div className="two-column">
                  <label>
                    Job title
                    <input value={exp.role} onChange={e => updateExp(i, "role", e.target.value)} placeholder="Software Engineer" required />
                  </label>
                  <label>
                    Company
                    <input value={exp.company} onChange={e => updateExp(i, "company", e.target.value)} placeholder="Google" required />
                  </label>
                </div>
                <div className="two-column">
                  <label>
                    Start date
                    <input type="month" value={exp.start_date} onChange={e => updateExp(i, "start_date", e.target.value)} required />
                  </label>
                  <label>
                    End date
                    <input type="month" value={exp.end_date || ""} onChange={e => updateExp(i, "end_date", e.target.value || null)}
                      placeholder="Leave empty if current" />
                    {!exp.end_date && <small className="muted">Current role</small>}
                  </label>
                </div>
                <label>
                  Description (optional)
                  <textarea rows={2} value={exp.description || ""}
                    onChange={e => updateExp(i, "description", e.target.value || null)}
                    placeholder="Briefly describe responsibilities..." />
                </label>
                <button type="button" className="remove-exp-btn" onClick={() => removeExp(i)}>
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="add-exp-btn" onClick={addExp}>
            <Plus size={16} /> Add experience
          </button>
        </section>

        {/* Skills & CV */}
        <section className="profile-card">
          <div className="section-heading">
            <Github size={20} />
            <h2>Skills & Verification</h2>
          </div>
          <label>
            GitHub profile URL
            <input value={formData.github_url} onChange={e => setFormData({ ...formData, github_url: e.target.value })}
              placeholder="https://github.com/username" />
          </label>
          <label>
            Skills (comma-separated)
            <textarea value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })}
              placeholder="React, TypeScript, Python..." rows={2} />
          </label>
          <label>
            CV / Resume (PDF)
            <span className="upload-control">
              {uploading ? <Loader2 className="spinner" size={18} /> : <Upload size={18} />}
              <input accept="application/pdf" type="file" onChange={handleCvUpload} disabled={uploading} />
            </span>
            {user?.cv_url && <small className="success-note">CV uploaded ✓</small>}
          </label>
          {user?.cv_keywords && user.cv_keywords.length > 0 && (
            <div className="extracted-keywords">
              <strong>Extracted from CV:</strong>
              <div className="skill-list compact">
                {user.cv_keywords.slice(0, 10).map(kw => <span key={kw}>{kw}</span>)}
              </div>
            </div>
          )}
        </section>

        <div className="form-actions">
          <button className="primary-action" type="submit" disabled={saving}>
            {saving ? <Loader2 className="spinner" size={18} /> : <FileText size={18} />}
            Save Profile
          </button>
          {message && (
            <p className={message.type === "success" ? "success-note" : "error-note"}>
              {message.text}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
