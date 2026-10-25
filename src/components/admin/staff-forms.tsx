"use client";

import { EditSheet } from "./edit-sheet";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Select } from "@/components/ui/field";
import { createStaffAction, changeStaffRoleAction } from "@/modules/auth/admin-actions";

export const ROLE_INFO: Record<string, string> = {
  STAFF_ORDERS: "Orders staff — orders, customers, messages",
  STAFF_CATALOG: "Catalogue staff — products, inventory, reviews",
  ADMIN: "Admin — everything except managing staff",
  OWNER: "Owner — full access including staff",
};

function suggestPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export function AddStaff() {
  return (
    <EditSheet title="Add staff member" trigger="Add staff" variant="primary">
      {(close) => (
        <ActionForm action={createStaffAction} className="space-y-4" onSuccess={close}>
          <Input name="name" label="Name" required />
          <Input name="email" type="email" label="Email (used to sign in)" required />
          <Select name="role" label="Role" defaultValue="STAFF_ORDERS">
            {Object.entries(ROLE_INFO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input name="password" label="Temporary password" defaultValue={suggestPassword()} required minLength={10} hint="Copy it now and share privately. They can change it in their account." />
          <SubmitButton full>Add staff member</SubmitButton>
        </ActionForm>
      )}
    </EditSheet>
  );
}

export function RoleSelect({ id, role }: { id: string; role: string }) {
  return (
    <ActionForm action={changeStaffRoleAction} className="flex items-center gap-2" confirm="Change this person's role? They will be signed out.">
      <input type="hidden" name="id" value={id} />
      <select name="role" defaultValue={role} aria-label="Role" className="h-8 border border-beige bg-white px-1.5 text-[12.5px]">
        {Object.keys(ROLE_INFO).map((k) => <option key={k} value={k}>{k.replace("_", " ").toLowerCase()}</option>)}
        <option value="CUSTOMER">remove admin access</option>
      </select>
      <button className="h-8 border border-burgundy px-2 text-[11px] uppercase text-burgundy">Apply</button>
    </ActionForm>
  );
}
