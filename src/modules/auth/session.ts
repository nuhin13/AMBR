import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { requestMeta } from "@/lib/request";

export const SESSION_COOKIE = "ambr_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
};

/** Creates a DB-backed session. Only the SHA-256 of the token is stored. Call from actions/route handlers. */
export async function createSession(userId: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const meta = await requestMeta();
  await db.session.create({ data: { id: sha256(token), userId, expiresAt, ip: meta.ip, userAgent: meta.userAgent } });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Revokes every session of a user (used after password reset or when staff are disabled). */
export const revokeAllSessions = (userId: string) => db.session.deleteMany({ where: { userId } });

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true, phone: true, role: true, status: true } } },
  });
  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") return null;
  const { id, name, email, phone, role } = session.user;
  return { id, name, email, phone, role };
});

/** Account pages: sends signed-out visitors to the sign-in page of their language. */
export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) {
    const { getLocale } = await import("@/i18n/server");
    const { localePath } = await import("@/i18n/config");
    const locale = await getLocale();
    redirect(`${localePath(locale, "/login")}?next=${encodeURIComponent(localePath(locale, next))}`);
  }
  return user;
}
