"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Play,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
}

const candidateNavItems: NavItem[] = [
  { href: "/candidate/feed", label: "Job Feed", icon: Play },
  { href: "/candidate/applications", label: "Applications", icon: FileText },
  { href: "/candidate/profile", label: "My Profile", icon: UserRound },
];

const employerNavItems: NavItem[] = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs", label: "My Jobs", icon: BriefcaseBusiness },
  { href: "/employer/candidates", label: "Find Candidates", icon: Search },
  { href: "/employer/profile", label: "Company Profile", icon: Building2 },
];

const guestNavItems: NavItem[] = [
  { href: "/candidate/feed", label: "Browse Jobs", icon: Play },
];

interface SidebarProps {
  onOpenAuth: (role: "candidate" | "employer") => void;
  onOpenMembership?: () => void;
}

export function Sidebar({ onOpenAuth, onOpenMembership }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = isAuthenticated
    ? user?.role === "employer"
      ? employerNavItems
      : candidateNavItems
    : guestNavItems;

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (pathname === "/" && href === "/candidate/feed") return true;
    if (pathname.startsWith(href) && href !== "/") return true;
    return false;
  };

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand">
        <Link href="/" className="brand-logo" aria-label="Talent365">
          <span>Talent</span>
          <strong>365</strong>
        </Link>
      </div>

      {isAuthenticated && (
        <div className="role-badge">
          {user?.role === "employer" ? (
            <>
              <Building2 size={14} />
              <span>Employer</span>
            </>
          ) : (
            <>
              <UserRound size={14} />
              <span>Candidate</span>
            </>
          )}
        </div>
      )}

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className={isActive(item.href) ? "nav-item active" : "nav-item"}
              href={item.href}
              key={item.href}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="auth-actions" aria-label="Sign in options">
        {isAuthenticated ? (
          <>
            <div className="user-info">
              <span>{user?.full_name || user?.company_name || "User"}</span>
              <small>{user?.email}</small>
            </div>
            {user?.is_member ? (
              <div className="member-badge">
                <Sparkles size={14} />
                Member
              </div>
            ) : (
              <button className="upgrade-btn" onClick={onOpenMembership} type="button">
                <Sparkles size={14} />
                Upgrade
              </button>
            )}
            <button className="logout-btn" onClick={logout} type="button">
              <LogOut size={16} />
              Sign out
            </button>
          </>
        ) : (
          <>
            <button
              className="employer-login"
              onClick={() => onOpenAuth("employer")}
              type="button"
            >
              Employer Login
            </button>
            <button
              className="candidate-login"
              onClick={() => onOpenAuth("candidate")}
              type="button"
            >
              Candidate Login
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
