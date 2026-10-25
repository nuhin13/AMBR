"use client";

import { ActionForm, ActionButton } from "./action-form";
import { saveTaxonomyAction, deleteTaxonomyAction } from "@/modules/catalog/admin-actions";

const input = "h-9 min-w-0 border border-beige bg-white px-2.5 text-[13.5px] focus:border-burgundy focus:outline-none";
const bnStyle = { fontFamily: "var(--font-sans-bn), var(--font-montserrat), sans-serif" } as const;

/** One editable family / occasion / note, with its English and Bangla names. Empty Bangla → the site shows English. */
export function TaxonomyRow({
  kind,
  id,
  name,
  nameBn,
  description,
  descriptionBn,
  sortOrder,
  count,
}: {
  kind: "family" | "occasion" | "note";
  id?: string;
  name: string;
  nameBn?: string | null;
  description?: string | null;
  descriptionBn?: string | null;
  sortOrder?: number;
  count?: number;
}) {
  return (
    <li className="flex flex-col gap-2 border-b border-beige py-2.5">
      <ActionForm action={saveTaxonomyAction} reset={!id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center" success={id ? "Saved" : "Added"}>
        <input type="hidden" name="kind" value={kind} />
        {id && <input type="hidden" name="id" value={id} />}
        <input name="name" defaultValue={name} placeholder={id ? "English name" : `New ${kind} (English)`} required aria-label="English name" className={input} />
        <input name="nameBn" defaultValue={nameBn ?? ""} placeholder="বাংলা নাম" aria-label="Bangla name" lang="bn" style={bnStyle} className={`${input} ${id && !nameBn ? "border-error/50" : ""}`} />
        {kind !== "note" ? <input name="sortOrder" type="number" defaultValue={sortOrder ?? 0} aria-label="Sort order" className="h-9 w-16 border border-beige bg-white px-2 text-[13px]" /> : <span className="hidden sm:block" />}
        <button className="h-9 border border-burgundy px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-burgundy hover:bg-burgundy hover:text-cream">{id ? "Save" : "Add"}</button>
        {kind === "family" && (
          <>
            <input name="description" defaultValue={description ?? ""} placeholder="Short description (English)" aria-label="English description" className={`${input} text-[13px]`} />
            <input name="descriptionBn" defaultValue={descriptionBn ?? ""} placeholder="ছোট বর্ণনা (বাংলা)" aria-label="Bangla description" lang="bn" style={bnStyle} className={`${input} text-[13px]`} />
          </>
        )}
      </ActionForm>
      {id && (
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span>{count ?? 0} products</span>
          {!nameBn && <span className="text-error">· Bangla name missing — the site shows English</span>}
          <ActionButton action={deleteTaxonomyAction} fields={{ kind, id }} variant="ghost" className="ml-auto text-error" confirm={`Delete “${name}”?`}>Delete</ActionButton>
        </div>
      )}
    </li>
  );
}
