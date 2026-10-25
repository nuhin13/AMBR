import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function UnsubscribePage(props: PageProps<"/newsletter/unsubscribe">) {
  const sp = await props.searchParams;
  const key = typeof sp.key === "string" ? sp.key : "";
  const sub = key ? await db.newsletterSubscriber.findUnique({ where: { unsubscribeKey: key } }) : null;
  if (sub && sub.status === "SUBSCRIBED") await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { status: "UNSUBSCRIBED" } });
  return (
    <div className="container-x max-w-lg py-24 text-center">
      <h1 className="text-[34px]">{sub ? "You've been unsubscribed" : "Link not recognised"}</h1>
      <p className="mt-4 text-muted">{sub ? "You won't receive AMBR newsletters any more. You can re-subscribe at any time from our homepage." : "This unsubscribe link is invalid or has already been used."}</p>
    </div>
  );
}
