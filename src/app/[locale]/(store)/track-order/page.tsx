import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { TrackOrderForm } from "@/components/checkout/track-order-form";
import { getT } from "@/i18n/server";
import { localeAlternates } from "@/i18n/meta";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return { title: t.meta.track, description: t.meta.trackDescription, alternates: localeAlternates(locale, "/track-order") };
}

export default async function TrackOrderPage() {
  const { t } = await getT();
  return (
    <>
      <PageIntro crumbs={[{ label: t.nav.trackOrder }]} title={t.order.trackTitle} text={t.order.trackIntro} />
      <div className="container-wide pb-28">
        <div className="max-w-md"><TrackOrderForm /></div>
      </div>
    </>
  );
}
