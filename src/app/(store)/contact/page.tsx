import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ContactForm } from "@/components/account/contact-form";
import { getSettings, whatsappLink } from "@/modules/content/settings";
import { formatBDPhone, normalizeBDPhone } from "@/lib/phone";

export const revalidate = 300;
export const metadata: Metadata = { title: "Contact", description: "Get in touch with AMBR — WhatsApp, phone, email or send us a message.", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const { store, social } = await getSettings();
  const wa = whatsappLink(store.whatsapp, "Hi AMBR!");
  const phone = store.phone ? normalizeBDPhone(store.phone) : null;
  return (
    <>
      <PageHeader crumbs={[{ label: "Contact" }]} eyebrow="We're here to help" title="Contact us" description="Questions about a fragrance, an order or a gift? We'd love to hear from you." />
      <div className="container-x grid gap-12 py-12 md:py-16 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div className="space-y-8">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="block border border-burgundy bg-burgundy p-6 text-cream hover:bg-burgundy-deep">
              <p className="eyebrow text-gold">Fastest</p>
              <p className="mt-2 font-serif text-[24px] text-cream">Chat on WhatsApp</p>
              <p className="mt-1 text-[14px] text-cream/75">Usually the quickest way to reach us.</p>
            </a>
          )}
          <dl className="space-y-5 text-[15px]">
            {phone && <div><dt className="eyebrow text-burgundy/80">Phone</dt><dd className="mt-1"><a href={`tel:${phone}`} className="hover:underline">{formatBDPhone(phone)}</a></dd></div>}
            {store.email && <div><dt className="eyebrow text-burgundy/80">Email</dt><dd className="mt-1"><a href={`mailto:${store.email}`} className="hover:underline">{store.email}</a></dd></div>}
            {store.address && <div><dt className="eyebrow text-burgundy/80">Address</dt><dd className="mt-1 whitespace-pre-line">{store.address}</dd></div>}
            {store.hours && <div><dt className="eyebrow text-burgundy/80">Hours</dt><dd className="mt-1">{store.hours}</dd></div>}
            {(social.facebook || social.instagram) && (
              <div>
                <dt className="eyebrow text-burgundy/80">Follow</dt>
                <dd className="mt-1 flex gap-4">
                  {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Facebook</a>}
                  {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Instagram</a>}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="bg-cream-light p-6 md:p-10">
          <h2 className="text-[26px]">Send a message</h2>
          <p className="mt-2 text-[14px] text-muted">We usually reply within one working day.</p>
          <div className="mt-8"><ContactForm /></div>
        </div>
      </div>
    </>
  );
}
