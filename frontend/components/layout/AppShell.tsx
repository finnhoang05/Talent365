"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "./Sidebar";
import { AuthModal } from "../auth/AuthModal";
import { MembershipModal } from "../membership/MembershipModal";
import { MembershipProvider } from "@/lib/membership-context";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    mode: "login" | "signup";
    role: "candidate" | "employer";
  } | null>(null);
  const [membershipOpen, setMembershipOpen] = useState(false);

  const handleAuthSuccess = (role: "candidate" | "employer") => {
    setAuthModal(null);
    if (role === "employer") {
      router.push("/employer/dashboard");
    } else {
      router.push("/candidate/feed");
    }
  };

  if (authLoading) {
    return (
      <main className="shell">
        <div className="loading-screen">
          <Loader2 className="spinner" size={32} />
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <Sidebar
        onOpenAuth={(role) => setAuthModal({ open: true, mode: "login", role })}
        onOpenMembership={() => setMembershipOpen(true)}
      />

      <section className="workspace">
        <MembershipProvider openMembership={() => setMembershipOpen(true)}>
          {children}
        </MembershipProvider>
      </section>

      {authModal && (
        <AuthModal
          mode={authModal.mode}
          role={authModal.role}
          onClose={() => setAuthModal(null)}
          onSuccess={() => handleAuthSuccess(authModal.role)}
          onSwitchMode={(mode) => setAuthModal({ ...authModal, mode })}
          onSwitchRole={(role) => setAuthModal({ ...authModal, role })}
        />
      )}
      {membershipOpen && (
        <MembershipModal onClose={() => setMembershipOpen(false)} />
      )}
    </main>
  );
}
