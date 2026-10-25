import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Accordion } from "@/components/ui/accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { getFaqs } from "@/modules/content/queries";

export const revalidate = 300;
export const metadata: Metadata = { title: "FAQ", description: "Answers to common questions about AMBR orders, delivery, payments, products and returns.", alternates: { canonical: "/faq" } };

export default async function FaqPage() {
  const faqs = await getFaqs();
  const groups = [...new Set(faqs.map((f) => f.category))];
  return (
    <>
      <PageHeader crumbs={[{ label: "FAQ" }]} eyebrow="Help" title="Frequently asked questions" description={<>Can&apos;t find your answer? <Link href="/contact" className="text-burgundy underline underline-offset-4">Contact us</Link>.</>} />
      <div className="container-x max-w-3xl space-y-12 py-12 md:py-16">
        {groups.map((g) => (
          <section key={g} aria-labelledby={`faq-${g}`}>
            <h2 id={`faq-${g}`} className="mb-4 text-[24px]">{g}</h2>
            <Accordion items={faqs.filter((f) => f.category === g).map((f) => ({ id: f.id, title: f.question, content: <p className="whitespace-pre-line">{f.answer}</p> }))} />
          </section>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
    </>
  );
}
