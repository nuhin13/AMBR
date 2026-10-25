"use client";

import { useState, useTransition } from "react";
import { LLink } from "@/components/i18n/llink";
import { useI18n } from "@/i18n/client";
import { useRouter } from "next/navigation";
import { Input, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "@/modules/auth/actions";

type Errors = Record<string, string>;

function useActionForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  return { pending, start, error, setError, fieldErrors, setFieldErrors, message, setMessage };
}

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const f = useActionForm();
  const router = useRouter();
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        f.start(async () => {
          f.setError(null);
          const r = await loginAction({ identifier: fd.get("identifier"), password: fd.get("password") }, next);
          if (!r.ok) {
            f.setError(r.error);
            f.setFieldErrors(r.fieldErrors ?? {});
            return;
          }
          router.replace(r.data!.redirectTo);
          router.refresh();
        });
      }}
    >
      <Input name="identifier" label={t.auth.identifier} autoComplete="username" required error={f.fieldErrors.identifier} />
      <Input name="password" type="password" label={t.auth.password} autoComplete="current-password" required error={f.fieldErrors.password} />
      <div className="text-right text-[13px]"><LLink href="/forgot-password" className="link-underline text-burgundy">{t.auth.forgot}</LLink></div>
      {f.error && <p className="text-[14px] text-error" role="alert">{f.error}</p>}
      <Button type="submit" full size="lg" loading={f.pending}>{t.auth.signIn}</Button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const f = useActionForm();
  const router = useRouter();
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        f.start(async () => {
          f.setError(null);
          const r = await registerAction(
            { name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"), password: fd.get("password"), marketingOptIn: fd.get("marketing") === "on" },
            next,
          );
          if (!r.ok) {
            f.setError(r.error);
            f.setFieldErrors(r.fieldErrors ?? {});
            return;
          }
          router.replace(r.data!.redirectTo);
          router.refresh();
        });
      }}
    >
      <Input name="name" label={t.auth.fullName} autoComplete="name" required error={f.fieldErrors.name} />
      <Input name="email" type="email" label={t.auth.email} autoComplete="email" required error={f.fieldErrors.email} />
      <Input name="phone" type="tel" label={t.auth.mobileOptional} prefix="+88" placeholder="01XXXXXXXXX" autoComplete="tel-national" error={f.fieldErrors.phone} hint={t.auth.mobileHint} />
      <Input name="password" type="password" label={t.auth.password} autoComplete="new-password" required error={f.fieldErrors.password} hint={t.auth.passwordHint} />
      <Checkbox name="marketing" label={t.auth.marketing} />
      {f.error && <p className="text-[14px] text-error" role="alert">{f.error}</p>}
      <Button type="submit" full size="lg" loading={f.pending}>{t.auth.createTitle}</Button>
    </form>
  );
}

export function ForgotForm() {
  const { t } = useI18n();
  const f = useActionForm();
  if (f.message) return <p className="border-l-2 border-gold pl-4 text-[15px]" role="status">{f.message}</p>;
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        f.start(async () => {
          const r = await forgotPasswordAction({ email: fd.get("email") });
          if (r.ok) f.setMessage(r.message ?? "");
          else {
            f.setError(r.error);
            f.setFieldErrors(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <Input name="email" type="email" label={t.auth.email} autoComplete="email" required error={f.fieldErrors.email} />
      {f.error && <p className="text-[14px] text-error" role="alert">{f.error}</p>}
      <Button type="submit" full size="lg" loading={f.pending}>{t.auth.sendLink}</Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { t } = useI18n();
  const f = useActionForm();
  if (f.message)
    return (
      <div className="space-y-5">
        <p className="border-l-2 border-gold pl-4 text-[15px]" role="status">{f.message}</p>
        <LLink href="/login" className="link-underline text-burgundy">{t.auth.goToSignIn}</LLink>
      </div>
    );
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (fd.get("password") !== fd.get("confirm")) return f.setFieldErrors({ confirm: t.validation.passwordMismatch });
        f.start(async () => {
          const r = await resetPasswordAction(token, { password: fd.get("password") });
          if (r.ok) f.setMessage(r.message ?? "");
          else {
            f.setError(r.error);
            f.setFieldErrors(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <Input name="password" type="password" label={t.auth.newPassword} autoComplete="new-password" required error={f.fieldErrors.password} hint={t.auth.passwordHint} />
      <Input name="confirm" type="password" label={t.auth.confirmPassword} autoComplete="new-password" required error={f.fieldErrors.confirm} />
      {f.error && <p className="text-[14px] text-error" role="alert">{f.error}</p>}
      <Button type="submit" full size="lg" loading={f.pending}>{t.auth.changePassword}</Button>
    </form>
  );
}
