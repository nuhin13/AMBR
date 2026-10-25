"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import type { ActionResult } from "@/lib/action-result";
import { getDictionary, getRequestLocale } from "@/i18n/server";
import { localizedAction } from "@/i18n/actions";
import { isValidBDPhone, normalizeBDPhone } from "@/lib/phone";
import { getSettings } from "./settings";
import { sendEmail } from "@/modules/notifications/email";

export async function subscribeNewsletterAction(raw: unknown): Promise<ActionResult> {
  return localizedAction(async () => {
    const { email, source } = z.object({ email: z.string().trim().toLowerCase().email("validation.email").max(120), source: z.string().max(40).optional() }).parse(raw);
    const { ip } = await requestMeta();
    await enforceRateLimit(`newsletter:${ip}`, 5, 3600);
    await db.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source: source ?? "website" },
      update: { status: "SUBSCRIBED" },
    });
    return { ok: true as const, message: getDictionary(await getRequestLocale()).errors.subscribed };
  });
}

const contactSchema = z
  .object({
    name: z.string().trim().min(2, "validation.name").max(80),
    email: z.union([z.literal(""), z.string().trim().email("validation.email")]).optional(),
    phone: z.union([z.literal(""), z.string().trim().refine(isValidBDPhone, "validation.phone")]).optional(),
    subject: z.string().trim().max(120).optional(),
    message: z.string().trim().min(10, "validation.message").max(2000),
    website: z.string().max(0).optional(), // honeypot
  })
  .refine((v) => v.email || v.phone, { message: "validation.replyContact", path: ["email"] });

export async function contactAction(raw: unknown): Promise<ActionResult> {
  return localizedAction(async () => {
    const { ip } = await requestMeta();
    await enforceRateLimit(`contact:${ip}`, 5, 3600);
    const input = contactSchema.parse(raw);
    await db.contactMessage.create({
      data: { name: input.name, email: input.email || null, phone: input.phone ? normalizeBDPhone(input.phone) : null, subject: input.subject || null, message: input.message },
    });
    const { store } = await getSettings();
    if (store.email) {
      await sendEmail({
        to: store.email,
        subject: `New message from ${input.name}${input.subject ? `: ${input.subject}` : ""}`,
        text: `${input.message}\n\n${input.email ?? ""} ${input.phone ?? ""}`,
        html: `<p>${input.message.replace(/</g, "&lt;")}</p><p>${input.email ?? ""} ${input.phone ?? ""}</p>`,
      });
    }
    return { ok: true as const, message: getDictionary(await getRequestLocale()).errors.messageSent };
  });
}
