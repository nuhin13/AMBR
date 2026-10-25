"use client";

import { useState, useTransition } from "react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { contactAction } from "@/modules/content/actions";

export function ContactForm() {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (done) return <p className="border border-success/30 bg-success/5 p-5 text-[15px] text-success" role="status">{done}</p>;
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await contactAction(Object.fromEntries(fd));
          if (r.ok) setDone(r.message ?? "Thanks!");
          else {
            setErrors(r.fieldErrors ?? {});
            setError(r.error);
          }
        });
      }}
    >
      <Input name="name" label="Your name" required error={errors.name} className="sm:col-span-2" />
      <Input name="email" type="email" label="Email" error={errors.email} />
      <Input name="phone" type="tel" label="Mobile" prefix="+88" error={errors.phone} />
      <Input name="subject" label="Subject (optional)" className="sm:col-span-2" />
      <Textarea name="message" label="Message" rows={5} required error={errors.message} className="sm:col-span-2" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && !Object.keys(errors).length && <p className="text-[14px] text-error sm:col-span-2">{error}</p>}
      <Button type="submit" loading={pending} className="sm:col-span-2 sm:justify-self-start">Send message</Button>
    </form>
  );
}
