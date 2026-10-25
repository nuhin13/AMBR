import Image from "next/image";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { deleteBannerAction } from "@/modules/content/admin-actions";
import { dateInput } from "@/modules/reports/form-data";
import { formatDate } from "@/lib/utils";
import { PageHeader, Card } from "@/components/admin/ui";
import { BannerEditor, BANNER_PLACEMENT_LABEL } from "@/components/admin/banner-editor";
import { TranslationBadge } from "@/components/admin/translation-editor";
import { trStatus } from "@/modules/translations/admin-queries";
import { ActionButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Banners" };

export default async function BannersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  await requirePermission("content:manage");
  const [banners, campaigns] = await Promise.all([
    db.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }], include: { translations: { where: { locale: "bn" } } } }),
    db.campaign.findMany({ select: { id: true, name: true } }),
  ]);
  const now = new Date();
  return (
    <>
      <PageHeader
        title="Banners"
        description="The homepage shows the first active hero banner, the active discovery tiles in order, and the first active philosophy (story) banner; the announcement bar shows the first active announcement. Each banner has an English and a Bangla version — open Edit and switch to বাংলা."
        actions={<BannerEditor isNew campaigns={campaigns} initial={{ placement: "HOME_HERO", eyebrow: "", title: "", subtitle: "", imageAlt: "", imageDesktop: null, imageMobile: null, ctaLabel: "", ctaHref: "", cta2Label: "", cta2Href: "", startsAt: "", endsAt: "", sortOrder: 0, isActive: true, campaignId: "" }} />}
      />
      {(["HOME_HERO", "ANNOUNCEMENT", "DISCOVERY", "STORY", "PROMO"] as const).map((pl) => {
        const list = banners.filter((b) => b.placement === pl);
        const live = list.find((b) => b.isActive && (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now));
        return (
          <Card key={pl} title={BANNER_PLACEMENT_LABEL[pl]} className="mb-6">
            {list.length === 0 ? <p className="text-[13px] text-muted">None.{pl === "PROMO" ? " Promotional banners are available for campaign pages." : ""}</p> : (
              <ul className="divide-y divide-beige">
                {list.map((b) => {
                  const scheduled = b.startsAt && b.startsAt > now;
                  const ended = b.endsAt && b.endsAt < now;
                  const tr = b.translations[0];
                  const isTile = pl === "DISCOVERY";
                  return (
                    <li key={b.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                      {b.imageDesktop && <div className="relative h-16 w-28 shrink-0 bg-beige"><Image src={b.imageDesktop} alt="" fill sizes="112px" className="object-cover" /></div>}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{b.eyebrow && <span className="mr-2 text-[11px] uppercase tracking-[0.14em] text-muted">{b.eyebrow}</span>}{b.title}</p>
                        <p className="text-[12.5px] text-muted">{b.ctaLabel ? `${b.ctaLabel} → ${b.ctaHref}` : "No button"}{b.startsAt || b.endsAt ? ` · ${b.startsAt ? formatDate(b.startsAt) : "now"} – ${b.endsAt ? formatDate(b.endsAt) : "no end"}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="hidden text-[11px] text-muted sm:inline">বাংলা</span><TranslationBadge status={trStatus(tr)} />
                        {(isTile ? b.isActive && !scheduled && !ended : live?.id === b.id) ? <Badge tone="success">Showing now</Badge> : !b.isActive ? <Badge tone="outline">Inactive</Badge> : scheduled ? <Badge tone="gold">Scheduled</Badge> : ended ? <Badge tone="outline">Ended</Badge> : <Badge tone="beige">Queued</Badge>}
                        <BannerEditor defaultOpen={edit === b.id} translation={{ status: trStatus(tr), values: tr ? { eyebrow: tr.eyebrow ?? "", title: tr.title, subtitle: tr.subtitle ?? "", imageAlt: tr.imageAlt ?? "", ctaLabel: tr.ctaLabel ?? "", cta2Label: tr.cta2Label ?? "" } : {} }} campaigns={campaigns} initial={{ id: b.id, placement: b.placement, eyebrow: b.eyebrow ?? "", title: b.title, subtitle: b.subtitle ?? "", imageAlt: b.imageAlt ?? "", imageDesktop: b.imageDesktop, imageMobile: b.imageMobile, ctaLabel: b.ctaLabel ?? "", ctaHref: b.ctaHref ?? "", cta2Label: b.cta2Label ?? "", cta2Href: b.cta2Href ?? "", startsAt: dateInput(b.startsAt), endsAt: dateInput(b.endsAt), sortOrder: b.sortOrder, isActive: b.isActive, campaignId: b.campaignId ?? "" }} />
                        <ActionButton action={deleteBannerAction} fields={{ id: b.id }} variant="ghost" className="text-error" confirm="Delete this banner?">Delete</ActionButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        );
      })}
    </>
  );
}
