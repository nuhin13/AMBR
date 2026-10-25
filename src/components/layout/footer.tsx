import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { getSettings, whatsappLink } from "@/modules/content/settings";
import { getActiveCategories } from "@/modules/catalog/queries";
import { POLICY_PAGES } from "@/modules/content/queries";
import { availableMethods } from "@/modules/payments/availability";
import { PAYMENT_METHOD_LABEL } from "@/modules/orders/status";
import { formatBDPhone, normalizeBDPhone } from "@/lib/phone";

export async function Footer() {
  const [{ store, social }, categories, methods] = await Promise.all([getSettings(), getActiveCategories(), availableMethods()]);
  const wa = whatsappLink(store.whatsapp);
  const phone = store.phone ? normalizeBDPhone(store.phone) : null;
  const year = new Date().getFullYear();

  const cols = [
    {
      title: "Shop",
      links: [
        ...categories.map((c) => ({ href: c.slug === "perfumes" || c.slug === "attar" ? `/${c.slug}` : `/category/${c.slug}`, label: c.name })),
        { href: "/collections", label: "Collections" },
        { href: "/discover", label: "Find your fragrance" },
      ],
    },
    {
      title: "Help",
      links: [
        { href: "/track-order", label: "Track your order" },
        { href: "/faq", label: "FAQ" },
        { href: "/fragrance-guide", label: "Usage & safety" },
        { href: "/contact", label: "Contact us" },
      ],
    },
    {
      title: "About",
      links: [
        { href: "/about", label: "About AMBR" },
        { href: "/account", label: "My account" },
        ...POLICY_PAGES.map((p) => ({ href: p.path, label: p.label })),
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-burgundy text-cream/85">
      <div className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-[1.2fr_2fr_1.1fr]">
        <div className="max-w-xs">
          <div className="w-[96px]"><Logo href={null} /></div>
          <p className="mt-6 text-[14px] leading-relaxed text-cream/75">{store.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="eyebrow mb-4 font-sans text-gold">{c.title}</h3>
              <ul className="space-y-2.5 text-[14px]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-underline hover:text-cream">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div>
          <h3 className="eyebrow mb-4 font-sans text-gold">Get in touch</h3>
          <ul className="space-y-2.5 text-[14px]">
            {phone && <li><a href={`tel:${phone}`} className="hover:text-cream">{formatBDPhone(phone)}</a></li>}
            {store.email && <li><a href={`mailto:${store.email}`} className="hover:text-cream">{store.email}</a></li>}
            {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-cream">WhatsApp</a></li>}
            {store.address && <li className="text-cream/70">{store.address}</li>}
            {store.hours && <li className="text-cream/70">{store.hours}</li>}
            {!phone && !store.email && !wa && <li><Link href="/contact" className="hover:text-cream">Send us a message</Link></li>}
          </ul>
          {(social.facebook || social.instagram || wa) && (
            <div className="mt-6 flex gap-3">
              {social.facebook && <SocialLink href={social.facebook} label="Facebook" path="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8Z" />}
              {social.instagram && <SocialLink href={social.instagram} label="Instagram" path="M12 7.4A4.6 4.6 0 1 0 16.6 12 4.6 4.6 0 0 0 12 7.4Zm0 7.6a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm5.9-7.8a1.1 1.1 0 1 1-1.1-1.1 1.1 1.1 0 0 1 1.1 1.1ZM21 7.3A5.3 5.3 0 0 0 19.6 3.6 5.3 5.3 0 0 0 15.9 2.1C14.4 2 9.6 2 8.1 2.1A5.3 5.3 0 0 0 4.4 3.5 5.3 5.3 0 0 0 3 7.3c-.1 1.5-.1 6 0 7.5a5.3 5.3 0 0 0 1.4 3.7 5.3 5.3 0 0 0 3.7 1.4c1.5.1 6.3.1 7.8 0a5.3 5.3 0 0 0 3.7-1.4 5.3 5.3 0 0 0 1.4-3.7c.1-1.5.1-6 0-7.5Zm-2 9.1a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4a3 3 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3A3 3 0 0 1 6.7 4.1C7.9 3.6 10.7 3.7 12 3.7s4.1-.1 5.3.4A3 3 0 0 1 19 5.8c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3Z" />}
              {wa && <SocialLink href={wa} label="WhatsApp" path="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Zm4.5 12c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col gap-4 py-6 text-[12px] text-cream/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {store.legalName || "AMBR"}. All rights reserved.
            {store.tradeLicense && <span className="ml-2">Trade licence {store.tradeLicense}</span>}
          </p>
          {methods.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
              {methods.map((m) => (
                <li key={m} className="border border-cream/20 px-2 py-1 text-[10.5px] uppercase tracking-[0.12em] text-cream/75">{PAYMENT_METHOD_LABEL[m]}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, path }: { href: string; label: string; path: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex size-10 items-center justify-center rounded-full border border-cream/25 text-cream/85 transition-colors hover:border-gold hover:text-gold">
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden><path d={path} /></svg>
    </a>
  );
}
