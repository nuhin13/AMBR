import { getSettings, whatsappLink } from "@/modules/content/settings";
import { getT } from "@/i18n/server";

export async function WhatsAppButton() {
  const [{ store }, { t }] = await Promise.all([getSettings(), getT()]);
  const href = whatsappLink(store.whatsapp, t.contact.whatsappMessage);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print fixed bottom-20 right-4 z-30 flex size-12 items-center justify-center rounded-full bg-[#1f7a4d] text-white shadow-lg transition-transform hover:scale-105 md:bottom-8 md:right-8 md:size-13"
      aria-label={t.nav.whatsapp}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
        <path d="M12.04 2a9.9 9.9 0 0 0-8.45 15.06L2 22l5.06-1.56A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3 .93.96-2.93-.2-.31a8.2 8.2 0 1 1 6.72 3.64Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06a6.7 6.7 0 0 1-1.97-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25 0-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.67.31 2.8 2.8 0 0 0-.87 2.08 4.9 4.9 0 0 0 1.02 2.58 11.2 11.2 0 0 0 4.29 3.79c.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
      </svg>
    </a>
  );
}
