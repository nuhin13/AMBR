import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { ContactForm } from "@/components/account/contact-form";
import { getSettings, whatsappLink } from "@/modules/content/settings";
import { formatBDPhone, normalizeBDPhone } from "@/lib/phone";
import { getT } from "@/i18n/server";
import { localeAlternates } from "@/i18n/meta";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return { title: t.meta.contact, description: t.meta.contactDescription, alternates: localeAlternates(locale, "/contact") };
}

export default async function ContactPage() {
  const [{ store, social }, { t }] = await Promise.all([getSettings(), getT()]);
  const wa = whatsappLink(store.whatsapp, t.contact.whatsappMessage);
  const phone = store.phone ? normalizeBDPhone(store.phone) : null;
  return (
    <>
      <PageIntro crumbs={[{ label: t.footer.contactUs }]} kicker={t.contact.kicker} title={t.contact.title} text={t.contact.intro} />
      <div className="container-wide grid gap-16 pb-28 md:grid-cols-12">
        <div className="space-y-10 md:col-span-4">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="group block border-b border-burgundy pb-6">
              <p className="eyebrow text-burgundy/70">{t.contact.fastest}</p>
              <p className="mt-2 font-serif text-[28px] text-burgundy transition-colors group-hover:text-burgundy-soft">{t.contact.whatsapp}</p>
              <p className="mt-1 text-[14px] text-muted">{t.contact.whatsappText}</p>
            </a>
          )}
          <dl className="space-y-6 text-[15px]">
            {phone && <div><dt className="eyebrow text-burgundy/70">{t.contact.phone}</dt><dd className="mt-1"><a href={`tel:${phone}`} className="link-underline">{formatBDPhone(phone)}</a></dd></div>}
            {store.email && <div><dt className="eyebrow text-burgundy/70">{t.contact.email}</dt><dd className="mt-1"><a href={`mailto:${store.email}`} className="link-underline">{store.email}</a></dd></div>}
            {store.address && <div><dt className="eyebrow text-burgundy/70">{t.contact.address}</dt><dd className="mt-1 whitespace-pre-line">{store.address}</dd></div>}
            {store.hours && <div><dt className="eyebrow text-burgundy/70">{t.contact.hours}</dt><dd className="mt-1">{store.hours}</dd></div>}
            {(social.facebook || social.instagram) && (
              <div>
                <dt className="eyebrow text-burgundy/70">{t.contact.follow}</dt>
                <dd className="mt-1 flex gap-5">
                  {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="link-quiet">Facebook</a>}
                  {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="link-quiet">Instagram</a>}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <h2 className="t-h3">{t.contact.sendTitle}</h2>
          <p className="mt-2 text-[14px] text-muted">{t.contact.replyTime}</p>
          <div className="mt-10"><ContactForm /></div>
        </div>
      </div>
    </>
  );
}
