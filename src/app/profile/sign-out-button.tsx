"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full rounded-lg border border-border p-3 text-center text-sm text-destructive hover:bg-destructive/10 transition-colors"
    >
      Sign Out
    </button>
  );
}
