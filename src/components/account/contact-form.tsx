"use client";

import { useState, useTransition } from "react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { contactAction } from "@/modules/content/actions";
import { useI18n } from "@/i18n/client";

export function ContactForm() {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (done) return <p className="border-l-2 border-success pl-4 text-[15px] text-success" role="status">{done}</p>;
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await contactAction(Object.fromEntries(fd));
          if (r.ok) setDone(r.message ?? "");
          else {
            setErrors(r.fieldErrors ?? {});
            setError(r.error);
          }
        });
      }}
    >
      <Input name="name" label={t.contact.name} required error={errors.name} className="sm:col-span-2" />
      <Input name="email" type="email" label={t.contact.email} error={errors.email} />
      <Input name="phone" type="tel" label={t.contact.mobile} prefix="+88" error={errors.phone} />
      <Input name="subject" label={t.contact.subject} className="sm:col-span-2" />
      <Textarea name="message" label={t.contact.message} rows={5} required error={errors.message} className="sm:col-span-2" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && !Object.keys(errors).length && <p className="text-[14px] text-error sm:col-span-2">{error}</p>}
      <Button type="submit" loading={pending} className="sm:col-span-2 sm:justify-self-start">{t.contact.send}</Button>
    </form>
  );
}
