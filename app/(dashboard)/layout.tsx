"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold">
            ALx Polly
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/polls" className="hover:underline">
              Polls
            </Link>
            <Link href="/polls/new" className="hover:underline">
              New Poll
            </Link>
            <Link href="/profile" className="hover:underline">
              Profile
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}


