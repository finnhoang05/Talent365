"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (user.role === "employer") {
        router.replace("/employer/dashboard");
      } else {
        router.replace("/candidate/feed");
      }
    } else {
      router.replace("/candidate/feed");
    }
  }, [isAuthenticated, user, isLoading, router]);

  return null;
}
