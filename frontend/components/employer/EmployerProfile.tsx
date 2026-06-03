"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Loader2, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { profilesApi } from "@/lib/api";

export function EmployerProfile() {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company_name: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        company_name: user.company_name || "",
      });
    }
  }, [user]);

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
        company_name: formData.company_name,
      });
      await refreshUser();
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } catch (error) {
      console.error("Save failed:", error);
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated || user?.role !== "employer") {
    return (
      <div className="page-container">
        <div className="empty-state">
          <Building2 size={48} />
          <h2>Sign in as an employer</h2>
          <p>Manage your company profile and settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Company Profile</h1>
      </header>

      <form className="profile-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="section-heading">
            <Building2 size={20} />
            <h2>Company Information</h2>
          </div>

          <label>
            Company name
            <input
              name="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Acme Inc."
            />
          </label>

          <label>
            Contact person
            <input
              name="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </label>

          <label>
            Contact email
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="hr@company.com"
            />
          </label>

          <button className="primary-action" type="submit" disabled={saving}>
            {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
            Save Profile
          </button>

          {message && (
            <p className={message.type === "success" ? "success-note" : "error-note"}>
              {message.text}
            </p>
          )}
        </section>
      </form>
    </div>
  );
}
