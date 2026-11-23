import "server-only";
import { cookies } from "next/headers";
import { SESSION_SECONDS, createSessionToken, verifySessionToken } from "@/lib/session-token";

export const SESSION_COOKIE = "smsg_admin";

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return !!token && verifySessionToken(token);
}

/** Sets the signed, HttpOnly session cookie. Returns false if admin sign-in isn't configured. */
export async function startAdminSession(): Promise<boolean> {
  const token = createSessionToken();
  if (!token) return false;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return true;
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
