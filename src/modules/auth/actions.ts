"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { randomToken, sha256 } from "@/lib/crypto";
import { normalizeBDPhone, isValidBDPhone } from "@/lib/phone";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import type { ActionResult } from "@/lib/action-result";
import { LocalizedError } from "@/lib/i18n-errors";
import { localePath } from "@/i18n/config";
import { getDictionary, getRequestLocale } from "@/i18n/server";
import { localizedAction } from "@/i18n/actions";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession, getCurrentUser, revokeAllSessions } from "./session";
import { isStaff } from "./rbac";
import { mergeGuestCart } from "@/modules/cart/service";
import { sendEmail } from "@/modules/notifications/email";
import { passwordResetEmail } from "@/modules/notifications/templates";

const password = z.string().min(8, "validation.password").max(128);

const safeNext = (next: unknown, fallback: string) =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;

const accountHome = async () => localePath(await getRequestLocale(), "/account");

const registerSchema = z.object({
  name: z.string().trim().min(2, "validation.name").max(80),
  email: z.string().trim().toLowerCase().email("validation.email").max(120),
  phone: z.union([z.literal(""), z.string().trim().refine(isValidBDPhone, "validation.phone")]).optional(),
  password,
  marketingOptIn: z.boolean().optional(),
});

export async function registerAction(raw: unknown, next?: string): Promise<ActionResult<{ redirectTo: string }>> {
  return localizedAction(async () => {
    const { ip } = await requestMeta();
    await enforceRateLimit(`register:${ip}`, 5, 3600);
    const input = registerSchema.parse(raw);
    const phone = input.phone ? normalizeBDPhone(input.phone) : null;
    const clash = await db.user.findFirst({ where: { OR: [{ email: input.email }, ...(phone ? [{ phone }] : [])] } });
    if (clash) throw new LocalizedError("errors.accountExists");
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone,
        passwordHash: await hashPassword(input.password),
        profile: { create: { marketingOptIn: input.marketingOptIn ?? false } },
      },
    });
    // Link earlier guest orders placed with the same phone number.
    if (phone) await db.order.updateMany({ where: { phone, userId: null }, data: { userId: user.id } });
    await createSession(user.id);
    await mergeGuestCart(user.id);
    return { ok: true as const, data: { redirectTo: safeNext(next, await accountHome()) } };
  });
}

const loginSchema = z.object({ identifier: z.string().trim().min(3, "validation.identifier").max(120), password: z.string().min(1, "validation.enterPassword").max(128) });

export async function loginAction(raw: unknown, next?: string): Promise<ActionResult<{ redirectTo: string }>> {
  return localizedAction(async () => {
    const input = loginSchema.parse(raw);
    const { ip } = await requestMeta();
    await enforceRateLimit(`login:${ip}`, 10, 900);
    await enforceRateLimit(`login:${input.identifier.toLowerCase()}`, 8, 900);
    const phone = normalizeBDPhone(input.identifier);
    const user = await db.user.findFirst({ where: phone ? { phone } : { email: input.identifier.toLowerCase() } });
    const valid = user?.passwordHash ? await verifyPassword(user.passwordHash, input.password) : false;
    if (!user || !valid) throw new LocalizedError("errors.badLogin");
    if (user.status !== "ACTIVE") throw new LocalizedError("errors.accountDisabled");
    await createSession(user.id);
    await mergeGuestCart(user.id);
    return { ok: true as const, data: { redirectTo: safeNext(next, isStaff(user.role) ? "/admin" : await accountHome()) } };
  });
}

export async function logoutAction() {
  await destroySession();
  redirect(localePath(await getRequestLocale(), "/"));
}

export async function forgotPasswordAction(raw: unknown): Promise<ActionResult> {
  return localizedAction(async () => {
    const locale = await getRequestLocale();
    const { email } = z.object({ email: z.string().trim().toLowerCase().email("validation.email") }).parse(raw);
    const { ip } = await requestMeta();
    await enforceRateLimit(`forgot:${ip}`, 5, 3600);
    await enforceRateLimit(`forgot:${email}`, 3, 3600);
    const user = await db.user.findUnique({ where: { email } });
    if (user && user.status === "ACTIVE") {
      const token = randomToken(32);
      await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3600_000) } });
      const mail = passwordResetEmail(user.name, `${siteUrl}${localePath(locale, `/reset-password/${token}`)}`, locale);
      await sendEmail({ to: email, ...mail });
    }
    // Same response either way, so the form can't be used to discover accounts.
    return { ok: true as const, message: getDictionary(locale).errors.resetSent };
  });
}

export async function resetPasswordAction(token: string, raw: unknown): Promise<ActionResult> {
  return localizedAction(async () => {
    const { password: pw } = z.object({ password }).parse(raw);
    const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) throw new LocalizedError("errors.resetExpired");
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(pw) } }),
      db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    await revokeAllSessions(record.userId);
    return { ok: true as const, message: getDictionary(await getRequestLocale()).errors.passwordChanged };
  });
}

export async function changePasswordAction(raw: unknown): Promise<ActionResult> {
  return localizedAction(async () => {
    const me = await getCurrentUser();
    if (!me) throw new LocalizedError("errors.signInAgain");
    const input = z.object({ current: z.string().min(1, "validation.enterPassword"), next: password }).parse(raw);
    const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
    if (!user.passwordHash || !(await verifyPassword(user.passwordHash, input.current))) throw new LocalizedError("errors.wrongPassword");
    await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(input.next) } });
    await revokeAllSessions(me.id);
    await createSession(me.id);
    return { ok: true as const, message: getDictionary(await getRequestLocale()).errors.passwordUpdated };
  });
}
