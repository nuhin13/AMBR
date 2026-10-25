"use client";

import { useState, useTransition } from "react";
import { Input, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction } from "@/modules/customers/actions";
import { changePasswordAction } from "@/modules/auth/actions";
import { useI18n } from "@/i18n/client";

export function ProfileForms({ name, email, phone, marketingOptIn }: { name: string; email: string; phone: string; marketingOptIn: boolean }) {
  const toast = useToast();
  const { t } = useI18n();
  const [p1, start1] = useTransition();
  const [p2, start2] = useTransition();
  const [e1, setE1] = useState<Record<string, string>>({});
  const [e2, setE2] = useState<Record<string, string>>({});
  return (
    <div className="grid gap-12 xl:grid-cols-2">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start1(async () => {
            const r = await updateProfileAction({ name: fd.get("name"), phone: fd.get("phone"), marketingOptIn: fd.get("marketing") === "on" });
            if (r.ok) { setE1({}); toast(r.message ?? t.common.saved); } else { setE1(r.fieldErrors ?? {}); toast(r.error, "error"); }
          });
        }}
      >
        <h2 className="t-h3">{t.account.profileTitle}</h2>
        <Input name="name" label={t.auth.fullName} defaultValue={name} required error={e1.name} />
        <Input label={t.auth.email} value={email} disabled hint={t.account.emailLocked} readOnly />
        <Input name="phone" label={t.checkout.mobile} type="tel" prefix="+88" defaultValue={phone} error={e1.phone} />
        <Checkbox name="marketing" label={t.auth.marketing} defaultChecked={marketingOptIn} />
        <Button type="submit" loading={p1}>{t.account.saveProfile}</Button>
      </form>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          start2(async () => {
            const r = await changePasswordAction({ current: fd.get("current"), next: fd.get("next") });
            if (r.ok) { setE2({}); form.reset(); toast(r.message ?? t.errors.passwordUpdated); } else { setE2(r.fieldErrors ?? { current: r.error }); }
          });
        }}
      >
        <h2 className="t-h3">{t.auth.changePassword}</h2>
        <Input name="current" type="password" label={t.account.currentPassword} autoComplete="current-password" required error={e2.current} />
        <Input name="next" type="password" label={t.auth.newPassword} autoComplete="new-password" required error={e2.next} hint={t.auth.passwordHint} />
        <Button type="submit" variant="secondary" loading={p2}>{t.account.updatePassword}</Button>
      </form>
    </div>
  );
}
