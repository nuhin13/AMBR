"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { LLink } from "@/components/i18n/llink";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { useI18n } from "@/i18n/client";
import { NAV_PRIMARY } from "./nav";

/** Full-height burgundy drawer with large editorial links. */
export function MobileNav({ whatsappHref }: { whatsappHref: string | null }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const close = () => setOpen(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="-ml-2 p-2 text-cream lg:hidden" aria-label={t.nav.openMenu}>
        <Menu className="size-6" strokeWidth={1.2} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-charcoal/40 animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-[400px] flex-col bg-burgundy text-cream animate-slide-in-left focus:outline-none">
          <Dialog.Title className="sr-only">{t.common.menu}</Dialog.Title>
          <Dialog.Description className="sr-only">{t.common.menu}</Dialog.Description>
          <div className="flex items-center justify-between px-6 pb-2 pt-5">
            <LanguageSwitch full />
            <Dialog.Close className="-mr-2 p-2 text-cream/80 hover:text-cream" aria-label={t.common.close}>
              <X className="size-6" strokeWidth={1.2} />
            </Dialog.Close>
          </div>
          <nav aria-label={t.common.menu} className="flex flex-1 flex-col overflow-y-auto px-6 pb-8">
            <ul className="mt-6 space-y-1">
              {NAV_PRIMARY.map((l) => (
                <li key={l.href}>
                  <LLink href={l.href} onClick={close} className="block py-2 font-serif text-[30px] leading-tight text-cream transition-colors hover:text-gold">
                    {t.nav[l.key]}
                  </LLink>
                </li>
              ))}
            </ul>
            <span className="rule my-8" aria-hidden />
            <ul className="space-y-3 text-[15px] text-cream/80">
              <li><LLink href="/discover" onClick={close}>{t.nav.discover}</LLink></li>
              <li><LLink href="/shop?sort=best-sellers" onClick={close}>{t.nav.bestSellers}</LLink></li>
              <li><LLink href="/collections" onClick={close}>{t.nav.collections}</LLink></li>
              <li><LLink href="/journal" onClick={close}>{t.nav.journal}</LLink></li>
            </ul>
            <ul className="mt-auto space-y-3 pt-10 text-[14px] text-cream/65">
              <li><LLink href="/account" onClick={close}>{t.nav.myAccount}</LLink></li>
              <li><LLink href="/track-order" onClick={close}>{t.nav.trackOrder}</LLink></li>
              <li><LLink href="/faq" onClick={close}>{t.nav.help}</LLink></li>
              {whatsappHref && <li><a href={whatsappHref} target="_blank" rel="noopener noreferrer">{t.nav.whatsapp}</a></li>}
            </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
