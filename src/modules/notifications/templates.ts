import "server-only";
import { formatBDT } from "@/lib/money";
import { siteUrl } from "@/lib/env";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#F7E8E1;font-family:Montserrat,Arial,sans-serif;color:#3A2A28">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7E8E1;padding:24px 0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
<tr><td style="background:#4A1022;padding:24px;text-align:center">
<img src="${siteUrl}/brand/ambr-logo-cream-720.png" alt="AMBR — Above Ordinary" width="120" style="display:inline-block"></td></tr>
<tr><td style="padding:32px 28px">
<h1 style="font-family:Georgia,serif;font-weight:400;color:#4A1022;font-size:24px;margin:0 0 16px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #E6D3C7;font-size:12px;color:#6b5a57">AMBR · Above Ordinary · <a href="${siteUrl}" style="color:#4A1022">ambrbd.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

type OrderForEmail = {
  orderNumber: string;
  customerName: string;
  total: number;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  paymentMethod: string;
  items: { productName: string; variantLabel: string; quantity: number; lineTotal: number }[];
};

export function orderConfirmationEmail(o: OrderForEmail, trackUrl: string) {
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.productName)} · ${esc(i.variantLabel)} × ${i.quantity}</td><td align="right">${formatBDT(i.lineTotal)}</td></tr>`)
    .join("");
  const html = layout(
    `Thank you, ${o.customerName.split(" ")[0]}`,
    `<p>We've received your order <strong>${esc(o.orderNumber)}</strong>. We'll call or message you to confirm it before dispatch.</p>
<table width="100%" style="font-size:14px;border-top:1px solid #E6D3C7;margin-top:16px;padding-top:8px">${rows}
<tr><td style="padding-top:12px">Subtotal</td><td align="right" style="padding-top:12px">${formatBDT(o.subtotal)}</td></tr>
${o.discountTotal ? `<tr><td>Discount</td><td align="right">−${formatBDT(o.discountTotal)}</td></tr>` : ""}
<tr><td>Delivery</td><td align="right">${o.shippingFee ? formatBDT(o.shippingFee) : "Free"}</td></tr>
<tr><td style="font-weight:600;padding-top:6px">Total</td><td align="right" style="font-weight:600;padding-top:6px">${formatBDT(o.total)}</td></tr></table>
<p style="margin-top:24px"><a href="${trackUrl}" style="background:#4A1022;color:#F7E8E1;padding:12px 22px;text-decoration:none;display:inline-block">Track your order</a></p>`,
  );
  const text = `Thank you for your order ${o.orderNumber}. Total: ${formatBDT(o.total)}. Track it at ${trackUrl}`;
  return { subject: `Order ${o.orderNumber} received — AMBR`, html, text };
}

export function orderStatusEmail(orderNumber: string, statusLabel: string, trackUrl: string, extra?: string) {
  const html = layout(
    `Your order is ${statusLabel.toLowerCase()}`,
    `<p>Order <strong>${esc(orderNumber)}</strong> is now <strong>${esc(statusLabel)}</strong>.</p>${extra ? `<p>${esc(extra)}</p>` : ""}
<p style="margin-top:24px"><a href="${trackUrl}" style="background:#4A1022;color:#F7E8E1;padding:12px 22px;text-decoration:none;display:inline-block">View order</a></p>`,
  );
  return { subject: `Order ${orderNumber}: ${statusLabel} — AMBR`, html, text: `Order ${orderNumber} is now ${statusLabel}. ${extra ?? ""} ${trackUrl}` };
}

export function passwordResetEmail(name: string, url: string) {
  const html = layout(
    "Reset your password",
    `<p>Hi ${esc(name.split(" ")[0])}, we received a request to reset your AMBR password. This link is valid for 1 hour.</p>
<p style="margin-top:24px"><a href="${url}" style="background:#4A1022;color:#F7E8E1;padding:12px 22px;text-decoration:none;display:inline-block">Choose a new password</a></p>
<p style="font-size:12px;color:#6b5a57">If you didn't ask for this, you can ignore this email.</p>`,
  );
  return { subject: "Reset your AMBR password", html, text: `Reset your AMBR password: ${url} (valid for 1 hour)` };
}
