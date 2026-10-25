"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { saveTranslationAction } from "@/modules/translations/admin-actions";
import { htmlForEditing, TR_FIELDS, type TrEntity, type TrStatus } from "./translation-fields";

const BN_STYLE = { fontFamily: "var(--font-sans-bn), var(--font-montserrat), sans-serif", lineHeight: 1.7 } as const;

export function TranslationBadge({ status, className }: { status: TrStatus; className?: string }) {
  if (status === "PUBLISHED") return <Badge tone="success" className={className}>Published</Badge>;
  if (status === "DRAFT") return <Badge tone="gold" className={className}>Draft</Badge>;
  return <Badge tone="error" className={className}>Missing translation</Badge>;
}

/** "English | বাংলা" tabs. Both panels stay mounted so unsaved edits survive switching. */
export function LangTabs({ english, bangla, bnStatus, initial = "en", bnDisabledReason }: { english: ReactNode; bangla: ReactNode; bnStatus: TrStatus; initial?: "en" | "bn"; bnDisabledReason?: string }) {
  const [tab, setTab] = useState<"en" | "bn">(bnDisabledReason ? "en" : initial);
  const tabCls = (on: boolean) =>
    cn("flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors", on ? "border-burgundy text-burgundy" : "border-transparent text-muted hover:text-burgundy");
  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-beige" role="tablist" aria-label="Language">
        <button type="button" role="tab" aria-selected={tab === "en"} className={tabCls(tab === "en")} onClick={() => setTab("en")}>English</button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "bn"}
          disabled={Boolean(bnDisabledReason)}
          title={bnDisabledReason}
          className={cn(tabCls(tab === "bn"), "disabled:cursor-not-allowed disabled:opacity-50")}
          onClick={() => setTab("bn")}
        >
          <span style={BN_STYLE} className="normal-case tracking-normal">বাংলা</span>
          {!bnDisabledReason && <TranslationBadge status={bnStatus} />}
        </button>
      </div>
      <div hidden={tab !== "en"}>{english}</div>
      <div hidden={tab !== "bn"}>{bnDisabledReason ? <p className="text-[13px] text-muted">{bnDisabledReason}</p> : bangla}</div>
    </div>
  );
}

/**
 * Bangla version editor. It has its own Save draft / Publish / Unpublish / Remove buttons and
 * only ever writes the Bangla translation row. `english` shows the English text for reference.
 */
export function TranslationEditor({
  entity,
  parentId,
  status,
  values,
  english = {},
  onSaved,
}: {
  entity: TrEntity;
  parentId: string;
  status: TrStatus;
  values: Record<string, string>;
  english?: Record<string, string | null | undefined>;
  onSaved?: () => void;
}) {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();
  const fields = TR_FIELDS[entity];

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value ?? "draft";
    if (intent === "delete" && !window.confirm("Remove the Bangla version? The Bangla site will show the English text instead.")) return;
    const fd = new FormData(e.currentTarget);
    fd.set("intent", intent);
    start(async () => {
      const r = await saveTranslationAction(fd);
      if (r.ok) {
        setErrors({});
        toast(r.message ?? "Saved");
        router.refresh();
        onSaved?.();
      } else {
        setErrors(r.fieldErrors ?? {});
        toast(r.error, "error");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" aria-busy={pending} lang="bn">
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="parentId" value={parentId} />
      <div className="flex flex-wrap items-center justify-between gap-3 border border-beige bg-cream-light px-3 py-2.5 text-[12.5px]">
        <span className="flex items-center gap-2" lang="en">
          Bangla version: <TranslationBadge status={status} />
        </span>
        <span className="text-muted" lang="en">
          {status === "PUBLISHED" ? "Visible on /bn." : status === "DRAFT" ? "Saved but not visible — /bn shows English until you publish." : "Not written yet — /bn shows English."}
        </span>
      </div>
      <fieldset disabled={pending} className="space-y-4">
        {fields.map((f) => {
          const ref = english[f.name];
          const hint = ref ? <span lang="en">English: {f.kind === "html" ? htmlForEditing(ref).slice(0, 160) + (ref.length > 160 ? "…" : "") : ref}</span> : undefined;
          const initial = f.kind === "html" ? htmlForEditing(values[f.name] ?? "") : (values[f.name] ?? "");
          const label = <span lang="en">{f.label}</span>;
          return f.kind === "text" ? (
            <Input key={f.name} name={f.name} label={label} required={f.required} maxLength={f.max} defaultValue={initial} hint={hint} error={errors[f.name]} lang="bn" style={BN_STYLE} />
          ) : (
            <div key={f.name} className="space-y-1.5">
              <Textarea
                name={f.name}
                label={label}
                required={f.required}
                maxLength={f.max}
                rows={f.rows ?? 3}
                defaultValue={initial}
                hint={f.kind === "html" ? <span lang="en">Plain text with blank lines between paragraphs, or simple HTML (p, strong, em, ul, li, h2, h3, a).</span> : hint}
                error={errors[f.name]}
                lang="bn"
                style={BN_STYLE}
              />
              {f.kind === "html" && ref && (
                <details className="text-[12.5px] text-muted" lang="en">
                  <summary className="cursor-pointer">Show English version</summary>
                  <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap border border-beige bg-cream-light p-2 font-sans">{htmlForEditing(ref)}</pre>
                </details>
              )}
            </div>
          );
        })}
        <div className="flex flex-wrap gap-2 pt-1" lang="en">
          <Button type="submit" name="intent" value="draft" variant="secondary" loading={pending}>Save draft</Button>
          <Button type="submit" name="intent" value="publish" loading={pending}>{status === "PUBLISHED" ? "Save & keep published" : "Publish Bangla"}</Button>
          {status === "PUBLISHED" && <Button type="submit" name="intent" value="unpublish" variant="ghost" formNoValidate>Unpublish</Button>}
          {status !== "MISSING" && <Button type="submit" name="intent" value="delete" variant="ghost" className="text-error" formNoValidate>Remove Bangla version</Button>}
        </div>
      </fieldset>
    </form>
  );
}
