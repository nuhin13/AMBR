import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { moderateReviewAction } from "@/modules/reviews/admin-actions";
import { formatDate } from "@/lib/utils";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-form";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePermission("reviews:moderate");
  const sp = await searchParams;
  const status = (["PENDING", "APPROVED", "REJECTED"].includes(sp.status ?? "") ? sp.status : "PENDING") as "PENDING" | "APPROVED" | "REJECTED";
  const [reviews, counts] = await Promise.all([
    db.review.findMany({ where: { status }, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } }, orderItem: { select: { variantLabel: true, order: { select: { id: true, orderNumber: true } } } } } }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  return (
    <>
      <PageHeader title="Reviews" description="Only customers with a delivered order can write a review, so every review here is a verified purchase. Approve to publish it on the product page." />
      <div className="mb-4 flex gap-2">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <Link key={s} href={`/admin/reviews?status=${s}`} className={cn("border px-3 py-1.5 text-[12px]", status === s ? "border-burgundy bg-burgundy text-cream" : "border-beige bg-white")}>
            {s.charAt(0) + s.slice(1).toLowerCase()} <span className="opacity-70">{count(s)}</span>
          </Link>
        ))}
      </div>
      {reviews.length === 0 ? <Card><EmptyState title={status === "PENDING" ? "Nothing to moderate" : "No reviews here"} description="New reviews from delivered orders will appear here." /></Card> : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <Badge tone="success">Verified purchase</Badge>
                    <Badge tone="outline" className="normal-case tracking-normal">{r.locale === "bn" ? "বাংলা" : "EN"}</Badge>
                    <span className="text-[12px] text-muted">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.title && <p className="mt-2 font-serif text-lg text-burgundy">{r.title}</p>}
                  <p className="mt-1 whitespace-pre-line text-[14px]">{r.body}</p>
                  <p className="mt-3 text-[12.5px] text-muted">
                    {r.user.name} ({r.user.email}) · <Link href={`/en/product/${r.product.slug}`} target="_blank" className="text-burgundy underline">{r.product.name}</Link> {r.orderItem.variantLabel} · order <Link href={`/admin/orders/${r.orderItem.order.id}`} className="text-burgundy underline">{r.orderItem.order.orderNumber}</Link>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {status !== "APPROVED" && <ActionButton action={moderateReviewAction} fields={{ id: r.id, status: "APPROVED" }} variant="primary">Approve</ActionButton>}
                  {status !== "REJECTED" && <ActionButton action={moderateReviewAction} fields={{ id: r.id, status: "REJECTED" }} variant="secondary">Reject</ActionButton>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
