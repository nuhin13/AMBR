import { Logo } from "@/components/brand/logo";
import { LLink } from "@/components/i18n/llink";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { getSettings, whatsappLink } from "@/modules/content/settings";
import { availableMethods } from "@/modules/payments/availability";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";
import { formatBDPhone, normalizeBDPhone } from "@/lib/phone";

export async function Footer() {
  const [{ store, social }, methods, { t, locale }] = await Promise.all([getSettings(), availableMethods(), getT()]);
  const wa = whatsappLink(store.whatsapp);
  const phone = store.phone ? normalizeBDPhone(store.phone) : null;
  const year = new Date().getFullYear();
  const description = locale === "bn" && store.descriptionBn ? store.descriptionBn : store.description;

  const cols = [
    {
      title: t.footer.collections,
      links: [
        { href: "/shop", label: t.nav.shop },
        { href: "/shop?for=him", label: t.nav.forHim },
        { href: "/shop?for=her", label: t.nav.forHer },
        { href: "/shop?for=unisex", label: t.nav.unisex },
        { href: "/attar", label: t.nav.attar },
        { href: "/collections", label: t.nav.collections },
      ],
    },
    {
      title: t.footer.help,
      links: [
        { href: "/track-order", label: t.nav.trackOrder },
        { href: "/policies/shipping", label: t.footer.delivery },
        { href: "/policies/returns", label: t.footer.returns },
        { href: "/fragrance-guide", label: t.footer.usage },
        { href: "/faq", label: t.nav.help },
        { href: "/contact", label: t.footer.contactUs },
      ],
    },
    {
      title: t.footer.about,
      links: [
        { href: "/about", label: t.nav.story },
        { href: "/journal", label: t.nav.journal },
        { href: "/discover", label: t.nav.discover },
        { href: "/account", label: t.nav.myAccount },
        { href: "/policies/privacy", label: t.footer.privacy },
        { href: "/policies/terms", label: t.footer.terms },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-burgundy text-cream/80">
      <div className="container-wide pt-16 md:pt-24">
        <div className="grid gap-12 border-b border-cream/10 pb-14 md:grid-cols-12 md:pb-20">
          <div className="md:col-span-6">
            <div className="w-[78px] md:w-[92px]"><Logo href={localePath(locale, "/")} /></div>
            <p className="t-h2 mt-8 max-w-[14ch] text-cream">{t.footer.tagline}</p>
          </div>
          <div className="md:col-span-5 md:col-start-8 md:self-end">
            <p className="eyebrow text-gold">{t.newsletter.kicker}</p>
            <h2 className="mt-3 font-serif text-[24px] text-cream md:text-[28px]">{t.footer.newsletterTitle}</h2>
            <p className="mt-2 text-[14.5px] text-cream/65">{t.footer.newsletterText}</p>
            <div className="mt-6"><NewsletterForm /></div>
          </div>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-12 md:py-16">
          <p className="text-[14px] leading-relaxed text-cream/60 md:col-span-3">{description}</p>
          {cols.map((c) => (
            <div key={c.title} className="md:col-span-2">
              <h3 className="eyebrow mb-5 font-sans text-gold">{c.title}</h3>
              <ul className="space-y-3 text-[14px]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <LLink href={l.href} className="link-underline text-cream/80 hover:text-cream">{l.label}</LLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="md:col-span-3">
            <h3 className="eyebrow mb-5 font-sans text-gold">{t.footer.getInTouch}</h3>
            <ul className="space-y-3 text-[14px]">
              {phone && <li><a href={`tel:${phone}`} className="hover:text-cream">{formatBDPhone(phone)}</a></li>}
              {store.email && <li><a href={`mailto:${store.email}`} className="hover:text-cream">{store.email}</a></li>}
              {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-cream">WhatsApp</a></li>}
              {store.address && <li className="text-cream/60">{store.address}</li>}
              {store.hours && <li className="text-cream/60">{store.hours}</li>}
              {!phone && !store.email && !wa && <li><LLink href="/contact" className="hover:text-cream">{t.footer.sendMessage}</LLink></li>}
            </ul>
            {(social.facebook || social.instagram) && (
              <div className="mt-6 flex gap-5 text-[13px]">
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="link-quiet text-cream">Facebook</a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="link-quiet text-cream">Instagram</a>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-cream/10 py-7 text-[12px] text-cream/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {store.legalName || "AMBR"}. {t.footer.rights}
            {store.tradeLicense && <span className="ml-2">{fmt(t.footer.tradeLicence, { number: store.tradeLicense })}</span>}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {methods.length > 0 && (
              <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label={t.footer.paymentMethods}>
                {methods.map((m) => <li key={m}>{t.labels.paymentMethod[m]}</li>)}
              </ul>
            )}
            <LanguageSwitch full />
          </div>
        </div>
      </div>
    </footer>
  );
}
