import "server-only";
import type { OrderStatus } from "@prisma/client";
import { siteUrl } from "@/lib/env";
import { fmt, type Locale } from "@/i18n/config";
import { formatPrice } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(title: string, body: string, locale: Locale) {
  const font = locale === "bn" ? "'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif" : "Montserrat,Arial,sans-serif";
  const serif = locale === "bn" ? "'Noto Serif Bengali',Georgia,serif" : "Georgia,serif";
  return `<!doctype html><html lang="${locale === "bn" ? "bn" : "en"}"><body style="margin:0;background:#F7E8E1;font-family:${font};color:#3A2A28;line-height:1.6">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7E8E1;padding:24px 0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
<tr><td style="background:#4A1022;padding:24px;text-align:center">
<img src="${siteUrl}/brand/ambr-logo-cream-720.png" alt="AMBR — Above Ordinary" width="120" style="display:inline-block"></td></tr>
<tr><td style="padding:32px 28px">
<h1 style="font-family:${serif};font-weight:400;color:#4A1022;font-size:24px;margin:0 0 16px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #E6D3C7;font-size:12px;color:#6b5a57">AMBR · Above Ordinary · <a href="${siteUrl}" style="color:#4A1022">ambrbd.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin-top:24px"><a href="${href}" style="background:#4A1022;color:#F7E8E1;padding:12px 22px;text-decoration:none;display:inline-block">${esc(label)}</a></p>`;

type OrderForEmail = {
  orderNumber: string;
  customerName: string;
  total: number;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  items: { productName: string; variantLabel: string; quantity: number; lineTotal: number }[];
};

export function orderConfirmationEmail(o: OrderForEmail, trackUrl: string, locale: Locale) {
  const t = getDictionary(locale).emails;
  const p = (n: number) => formatPrice(n, locale);
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.productName)} · ${esc(i.variantLabel)} × ${i.quantity}</td><td align="right">${p(i.lineTotal)}</td></tr>`)
    .join("");
  const html = layout(
    fmt(t.thanks, { name: o.customerName.split(" ")[0] }),
    `<p>${esc(fmt(t.received, { number: o.orderNumber }))}</p>
<table width="100%" style="font-size:14px;border-top:1px solid #E6D3C7;margin-top:16px;padding-top:8px">${rows}
<tr><td style="padding-top:12px">${t.subtotal}</td><td align="right" style="padding-top:12px">${p(o.subtotal)}</td></tr>
${o.discountTotal ? `<tr><td>${t.discount}</td><td align="right">−${p(o.discountTotal)}</td></tr>` : ""}
<tr><td>${t.delivery}</td><td align="right">${o.shippingFee ? p(o.shippingFee) : t.free}</td></tr>
<tr><td style="font-weight:600;padding-top:6px">${t.total}</td><td align="right" style="font-weight:600;padding-top:6px">${p(o.total)}</td></tr></table>
${button(trackUrl, t.track)}`,
    locale,
  );
  return { subject: fmt(t.receivedSubject, { number: o.orderNumber }), html, text: `${fmt(t.received, { number: o.orderNumber })} ${t.total}: ${p(o.total)}. ${trackUrl}` };
}

export function orderStatusEmail(orderNumber: string, status: OrderStatus, trackUrl: string, locale: Locale, extra?: string) {
  const d = getDictionary(locale);
  const label = d.labels.orderStatus[status];
  const html = layout(
    fmt(d.emails.statusTitle, { status: label.toLowerCase() }),
    `<p>${esc(fmt(d.emails.statusBody, { number: orderNumber, status: label }))}</p>${extra ? `<p>${esc(extra)}</p>` : ""}${button(trackUrl, d.emails.view)}`,
    locale,
  );
  return { subject: fmt(d.emails.statusSubject, { number: orderNumber, status: label }), html, text: `${fmt(d.emails.statusBody, { number: orderNumber, status: label })} ${extra ?? ""} ${trackUrl}` };
}

export function passwordResetEmail(name: string, url: string, locale: Locale) {
  const t = getDictionary(locale).emails;
  const html = layout(
    t.resetTitle,
    `<p>${esc(fmt(t.resetBody, { name: name.split(" ")[0] }))}</p>${button(url, t.resetCta)}<p style="font-size:12px;color:#6b5a57">${esc(t.resetIgnore)}</p>`,
    locale,
  );
  return { subject: t.resetSubject, html, text: `${t.resetSubject}: ${url}` };
}
