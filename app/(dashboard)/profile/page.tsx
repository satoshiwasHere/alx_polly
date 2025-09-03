"use client";

import { useAuth } from "@/app/contexts/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <pre className="mt-4 bg-muted p-4 rounded-md">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
