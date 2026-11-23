import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { PopupEditor } from "@/components/admin/PopupEditor";
import { isAdmin } from "@/lib/auth";
import { getPopup, storageMode } from "@/lib/popup-store";
import { isAdminConfigured } from "@/lib/session-token";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// The page shell is static; the session check and the saved popup stream in at request time.
export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8" role="status">
          <p className="text-xl text-ink-soft">Loading the admin screen…</p>
        </div>
      }
    >
      <AdminGate />
    </Suspense>
  );
}

async function AdminGate() {
  // Everything here must run per request: the password and storage settings are read from the
  // live environment, never baked into the prerendered shell at build time.
  await connection();

  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-16 sm:py-24">
        <h1 className="text-4xl">Admin isn&rsquo;t set up yet</h1>
        <p className="mt-4 text-lg">
          To turn on sign-in, add an <code>ADMIN_PASSWORD</code> environment variable in the hosting settings and redeploy.
          Pick a long password that you don&rsquo;t use anywhere else.
        </p>
      </div>
    );
  }

  if (!(await isAdmin())) return <LoginForm />;

  let initial;
  let loadError: string | undefined;
  try {
    initial = await getPopup({ strict: true });
  } catch {
    initial = await getPopup();
    loadError = "We couldn't read the saved popup from storage. What you see below may be out of date. Reload to try again.";
  }

  return <PopupEditor initial={initial} storage={storageMode()} loadError={loadError} />;
}
