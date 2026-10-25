"use client";

import { useState, useTransition } from "react";
import { Input, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction } from "@/modules/customers/actions";
import { changePasswordAction } from "@/modules/auth/actions";

export function ProfileForms({ name, email, phone, marketingOptIn }: { name: string; email: string; phone: string; marketingOptIn: boolean }) {
  const toast = useToast();
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
            if (r.ok) { setE1({}); toast(r.message ?? "Saved"); } else { setE1(r.fieldErrors ?? {}); toast(r.error, "error"); }
          });
        }}
      >
        <h2 className="text-[24px]">Profile</h2>
        <Input name="name" label="Full name" defaultValue={name} required error={e1.name} />
        <Input label="Email" value={email} disabled hint="Contact us to change your email" readOnly />
        <Input name="phone" label="Mobile number" type="tel" prefix="+88" defaultValue={phone} error={e1.phone} />
        <Checkbox name="marketing" label="Send me news about new scents and offers" defaultChecked={marketingOptIn} />
        <Button type="submit" loading={p1}>Save profile</Button>
      </form>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          start2(async () => {
            const r = await changePasswordAction({ current: fd.get("current"), next: fd.get("next") });
            if (r.ok) { setE2({}); form.reset(); toast(r.message ?? "Password updated"); } else { setE2(r.fieldErrors ?? { current: r.error }); }
          });
        }}
      >
        <h2 className="text-[24px]">Change password</h2>
        <Input name="current" type="password" label="Current password" autoComplete="current-password" required error={e2.current} />
        <Input name="next" type="password" label="New password" autoComplete="new-password" required error={e2.next} hint="At least 8 characters" />
        <Button type="submit" variant="secondary" loading={p2}>Update password</Button>
      </form>
    </div>
  );
}
