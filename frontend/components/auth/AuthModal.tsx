"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AuthModalProps {
  mode: "login" | "signup";
  role: "candidate" | "employer";
  onClose: () => void;
  onSuccess: () => void;
  onSwitchMode: (mode: "login" | "signup") => void;
  onSwitchRole: (role: "candidate" | "employer") => void;
}

export function AuthModal({
  mode,
  role,
  onClose,
  onSuccess,
  onSwitchMode,
  onSwitchRole,
}: AuthModalProps) {
  const { login, signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      if (mode === "login") {
        await login(email);
      } else {
        await signup({
          email,
          full_name: formData.get("full_name") as string,
          role,
          company_name: role === "employer" ? (formData.get("company_name") as string) : undefined,
          github_url: role === "candidate" ? (formData.get("github_url") as string) : undefined,
          education: role === "candidate" ? (formData.get("education") as string) : undefined,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button">×</button>
        
        <div className="modal-header">
          <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <div className="role-tabs">
            <button
              className={role === "candidate" ? "active" : ""}
              onClick={() => onSwitchRole("candidate")}
              type="button"
            >
              Candidate
            </button>
            <button
              className={role === "employer" ? "active" : ""}
              onClick={() => onSwitchRole("employer")}
              type="button"
            >
              Employer
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <label>
              Full name
              <input name="full_name" required placeholder="John Doe" />
            </label>
          )}

          <label>
            Email
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>

          {mode === "signup" && role === "employer" && (
            <label>
              Company name
              <input name="company_name" required placeholder="Acme Inc." />
            </label>
          )}

          {mode === "signup" && role === "candidate" && (
            <>
              <label>
                Education
                <input name="education" placeholder="Bachelor of Computer Science" />
              </label>
              <label>
                GitHub URL
                <input name="github_url" placeholder="https://github.com/username" />
              </label>
            </>
          )}

          {error && <p className="error-note">{error}</p>}

          <button className="primary-action" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={18} /> : null}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => onSwitchMode("signup")}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => onSwitchMode("login")}>Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
