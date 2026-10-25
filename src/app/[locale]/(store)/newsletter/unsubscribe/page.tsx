import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

export default async function UnsubscribePage(props: PageProps<"/[locale]/newsletter/unsubscribe">) {
  const { t } = await getT();
  const sp = await props.searchParams;
  const key = typeof sp.key === "string" ? sp.key : "";
  const sub = key ? await db.newsletterSubscriber.findUnique({ where: { unsubscribeKey: key } }) : null;
  if (sub && sub.status === "SUBSCRIBED") await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { status: "UNSUBSCRIBED" } });
  return (
    <div className="container-wide max-w-2xl py-28">
      <h1 className="t-h1">{sub ? t.newsletter.unsubscribedTitle : t.newsletter.invalidTitle}</h1>
      <p className="t-lead mt-5 text-muted">{sub ? t.newsletter.unsubscribedText : t.newsletter.invalidText}</p>
    </div>
  );
}
