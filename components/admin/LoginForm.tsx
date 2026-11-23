"use client";

import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (!password) {
      setError("Enter the admin password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (res.ok && data?.ok) {
        window.location.reload();
        return;
      }
      setError(data?.message ?? "Sign-in failed. Please try again.");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16 sm:py-24">
      <h1 className="text-4xl">Admin sign-in</h1>
      <p className="mt-3 text-ink-soft">Sign in to change the announcement popup on the homepage.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5 border border-gilt bg-paper p-6">
        {error ? (
          <p role="alert" className="border-l-4 border-danger bg-vellum p-3 font-bold text-danger">
            {error}
          </p>
        ) : null}
        <div>
          <label htmlFor="admin-password" className="field-label">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
            aria-invalid={error ? true : undefined}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
