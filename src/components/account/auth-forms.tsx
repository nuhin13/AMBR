"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
      <Input name="identifier" label="Email or mobile number" autoComplete="username" required error={f.fieldErrors.identifier} />
      <Input name="password" type="password" label="Password" autoComplete="current-password" required error={f.fieldErrors.password} />
      <div className="text-right text-[13px]"><Link href="/forgot-password" className="text-burgundy underline underline-offset-4">Forgot password?</Link></div>
      {f.error && <p className="text-[14px] text-error" role="alert">{f.error}</p>}
      <Button type="submit" full size="lg" loading={f.pending}>Sign in</Button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
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
      <Input name="name" label="Full name" autoComplete="name" required error={f.fieldErrors.name} />
      <Input name="email" type="email" label="Email" autoComplete="email" required error={f.fieldErrors.email} />
      <Input name="phone" type="tel" label="Mobile number (optional)" prefix="+88" placeholder="01XXXXXXXXX" autoComplete="tel-national" error={f.fieldErrors.phone} hint="Links your previous guest orders to this account" />
      <Input name="password" type="password" label="Password" autoComplete="new-password" required error={f.fieldErrors.password} hint="At least 8 characters" />
      <Checkbox name="marketing" label="Send me news about new scents and offers" />
      {f.error && <p className="text-[14px] text-error" role="alert">{f.error}</p>}
      <Button type="submit" full size="lg" loading={f.pending}>Create account</Button>
    </form>
  );
}

export function ForgotForm() {
  const f = useActionForm();
  if (f.message) return <p className="border border-beige bg-cream-light p-5 text-[14.5px]" role="status">{f.message}</p>;
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        f.start(async () => {
          const r = await forgotPasswordAction({ email: fd.get("email") });
          if (r.ok) f.setMessage(r.message ?? "Check your email.");
          else {
            f.setError(r.error);
            f.setFieldErrors(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <Input name="email" type="email" label="Email" autoComplete="email" required error={f.fieldErrors.email} />
      {f.error && <p className="text-[14px] text-error" role="alert">{f.error}</p>}
      <Button type="submit" full size="lg" loading={f.pending}>Send reset link</Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const f = useActionForm();
  if (f.message)
    return (
      <div className="space-y-5">
        <p className="border border-beige bg-cream-light p-5 text-[14.5px]" role="status">{f.message}</p>
        <Link href="/login" className="text-burgundy underline underline-offset-4">Go to sign in</Link>
      </div>
    );
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (fd.get("password") !== fd.get("confirm")) return f.setFieldErrors({ confirm: "Passwords don't match" });
        f.start(async () => {
          const r = await resetPasswordAction(token, { password: fd.get("password") });
          if (r.ok) f.setMessage(r.message ?? "Password changed.");
          else {
            f.setError(r.error);
            f.setFieldErrors(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <Input name="password" type="password" label="New password" autoComplete="new-password" required error={f.fieldErrors.password} hint="At least 8 characters" />
      <Input name="confirm" type="password" label="Confirm new password" autoComplete="new-password" required error={f.fieldErrors.confirm} />
      {f.error && <p className="text-[14px] text-error" role="alert">{f.error}</p>}
      <Button type="submit" full size="lg" loading={f.pending}>Change password</Button>
    </form>
  );
}
