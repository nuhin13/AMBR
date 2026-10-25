import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Accordion } from "@/components/ui/accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { LLink } from "@/components/i18n/llink";
import { getFaqs } from "@/modules/content/queries";
import { getT } from "@/i18n/server";
import { localeAlternates } from "@/i18n/meta";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return { title: t.meta.faq, description: t.meta.faqDescription, alternates: localeAlternates(locale, "/faq") };
}

export default async function FaqPage() {
  const { t, locale } = await getT();
  const faqs = await getFaqs(locale);
  const groups = [...new Set(faqs.map((f) => f.category))];
  const [before, after] = t.pages.faqIntro.split("{link}");
  return (
    <>
      <PageIntro crumbs={[{ label: t.nav.help }]} kicker={t.pages.faqKicker} title={t.pages.faqTitle} text={<>{before}<LLink href="/contact" className="link-underline text-burgundy">{t.footer.contactUs}</LLink>{after}</>} />
      <div className="container-wide pb-28">
        <div className="space-y-16 md:grid md:grid-cols-12 md:space-y-0">
          <div className="space-y-16 md:col-span-8 md:col-start-4">
            {groups.map((g) => (
              <section key={g} aria-label={g}>
                <h2 className="t-h3 mb-4">{g}</h2>
                <Accordion items={faqs.filter((f) => f.category === g).map((f) => ({ id: f.id, title: f.question, content: <p className="whitespace-pre-line" lang={f.lang !== locale ? f.lang : undefined}>{f.answer}</p> }))} />
              </section>
            ))}
          </div>
        </div>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: locale === "bn" ? "bn-BD" : "en", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }} />
    </>
  );
}
