"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t, href } = useI18n();
  return (
    <div className="container-wide py-28">
      <h1 className="t-h1">{t.pages.errorTitle}</h1>
      <p className="t-lead mt-5 max-w-md text-muted">{t.pages.errorText}</p>
      <div className="mt-10 flex items-center gap-8">
        <Button onClick={reset}>{t.common.tryAgain}</Button>
        <ButtonLink href={href("/")} variant="quiet">{t.common.home}</ButtonLink>
      </div>
    </div>
  );
}
