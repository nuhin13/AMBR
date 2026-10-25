"use client";

import { ActionForm, ActionButton } from "./action-form";
import { saveTaxonomyAction, deleteTaxonomyAction } from "@/modules/catalog/admin-actions";

export function TaxonomyRow({ kind, id, name, description, sortOrder, count }: { kind: "family" | "occasion" | "note"; id?: string; name: string; description?: string | null; sortOrder?: number; count?: number }) {
  return (
    <li className="flex flex-col gap-2 border-b border-beige py-2.5 sm:flex-row sm:items-center">
      <ActionForm action={saveTaxonomyAction} reset={!id} className="flex flex-1 flex-wrap items-center gap-2" success={id ? "Saved" : "Added"}>
        <input type="hidden" name="kind" value={kind} />
        {id && <input type="hidden" name="id" value={id} />}
        <input name="name" defaultValue={name} placeholder={id ? undefined : `New ${kind}`} required aria-label="Name" className="h-9 min-w-0 flex-1 border border-beige bg-white px-2.5 text-[13.5px] focus:border-burgundy focus:outline-none" />
        {kind === "family" && <input name="description" defaultValue={description ?? ""} placeholder="Short description" aria-label="Description" className="h-9 min-w-0 flex-[2] border border-beige bg-white px-2.5 text-[13px] focus:border-burgundy focus:outline-none" />}
        {kind !== "note" && <input name="sortOrder" type="number" defaultValue={sortOrder ?? 0} aria-label="Sort order" className="h-9 w-16 border border-beige bg-white px-2 text-[13px]" />}
        <button className="h-9 border border-burgundy px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-burgundy hover:bg-burgundy hover:text-cream">{id ? "Save" : "Add"}</button>
      </ActionForm>
      {id && (
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span>{count ?? 0} products</span>
          <ActionButton action={deleteTaxonomyAction} fields={{ kind, id }} variant="ghost" className="text-error" confirm={`Delete “${name}”?`}>Delete</ActionButton>
        </div>
      )}
    </li>
  );
}
