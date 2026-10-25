"use client";

import type { ReactNode } from "react";
import { ActionForm, SubmitButton } from "./action-form";
import { saveSettingsAction } from "@/modules/content/admin-actions";

/** Wraps a settings group form; boolean fields need a hidden "present_<key>" marker so unchecked boxes save as false. */
export function SettingsForm({ group, children, booleans = [] }: { group: string; children: ReactNode; booleans?: string[] }) {
  return (
    <ActionForm action={saveSettingsAction} className="space-y-4">
      <input type="hidden" name="group" value={group} />
      {booleans.map((b) => <input key={b} type="hidden" name={`present_${b}`} value="1" />)}
      {children}
      <SubmitButton size="sm">Save</SubmitButton>
    </ActionForm>
  );
}
