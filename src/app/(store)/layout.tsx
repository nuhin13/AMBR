import { StoreProvider } from "@/components/cart/store-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchProvider } from "@/components/layout/search-overlay";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { AnalyticsScripts } from "@/components/analytics/scripts";
import { JsonLd } from "@/components/seo/json-ld";
import { getSettings } from "@/modules/content/settings";
import { siteUrl } from "@/lib/env";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { store, social } = await getSettings();
  const sameAs = [social.facebook, social.instagram].filter(Boolean);
  return (
    <StoreProvider>
      <SearchProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-cream focus:px-4 focus:py-2 focus:text-burgundy">
          Skip to content
        </a>
        <AnnouncementBar />
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppButton />
        <AnalyticsScripts />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "AMBR",
            slogan: "Above Ordinary.",
            url: siteUrl,
            logo: `${siteUrl}/brand/ambr-logo-cream-720.png`,
            ...(sameAs.length ? { sameAs } : {}),
            ...(store.email || store.phone ? { contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: store.email || undefined, telephone: store.phone || undefined, areaServed: "BD" } } : {}),
          }}
        />
      </SearchProvider>
    </StoreProvider>
  );
}
