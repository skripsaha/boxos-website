"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: fd.get("username"),
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      router.push("/account");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="field-label" htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" required pattern="[a-zA-Z0-9_-]{3,24}" className="field-input" />
        <p className="field-hint">3–24 chars · letters, numbers, underscore, hyphen.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="email">Email <span className="text-[color:var(--color-ink-3)]">(optional)</span></label>
        <input id="email" name="email" type="email" autoComplete="email" className="field-input" />
        <p className="field-hint">Used only for sign-in recovery. Not displayed publicly.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="field-input" />
        <p className="field-hint">At least 8 characters. Stored hashed (bcrypt).</p>
      </div>
      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
