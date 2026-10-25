import { notFound } from "next/navigation";
import { PageHeader } from "./page-header";
import { getPage } from "@/modules/content/queries";
import { formatDate } from "@/lib/utils";

/** Renders an admin-editable ContentPage (HTML is sanitised when saved). */
export async function ContentPageView({ slug, crumbs, eyebrow }: { slug: string; crumbs: { href?: string; label: string }[]; eyebrow?: string }) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader crumbs={crumbs} eyebrow={eyebrow} title={page.title} />
      <div className="container-x py-12 md:py-16">
        <article className="prose-ambr mx-auto md:text-[16.5px]" dangerouslySetInnerHTML={{ __html: page.body }} />
        <p className="mx-auto mt-12 max-w-[68ch] text-[12.5px] text-muted">Last updated {formatDate(page.updatedAt)}</p>
      </div>
    </>
  );
}

export async function contentMetadata(slug: string, canonical: string) {
  const page = await getPage(slug);
  return page ? { title: page.title, description: page.seoDescription ?? undefined, alternates: { canonical } } : { title: "Not found" };
}
