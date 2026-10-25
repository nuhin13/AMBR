"use client";

import { EditSheet } from "./edit-sheet";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Textarea, Checkbox } from "@/components/ui/field";
import { saveFaqAction } from "@/modules/content/admin-actions";
import { LangTabs, TranslationEditor } from "./translation-editor";
import type { TrStatus } from "./translation-fields";

export function FaqEditor({ initial, isNew, translation, defaultOpen }: { initial: { id?: string; question: string; answer: string; category: string; sortOrder: number; isActive: boolean }; isNew?: boolean; translation?: { status: TrStatus; values: Record<string, string> }; defaultOpen?: boolean }) {
  return (
    <EditSheet title={isNew ? "New question" : "Edit question"} trigger={isNew ? "New question" : "Edit"} variant={isNew ? "primary" : "ghost"} defaultOpen={defaultOpen}>
      {(close) => {
        const english = (
        <ActionForm action={saveFaqAction} className="space-y-4" onSuccess={close}>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          <Input name="category" label="Group" defaultValue={initial.category} required placeholder="e.g. Orders & Delivery" />
          <Input name="question" label="Question" defaultValue={initial.question} required />
          <Textarea name="answer" label="Answer" rows={6} defaultValue={initial.answer} required />
          <Input name="sortOrder" type="number" label="Order" defaultValue={initial.sortOrder} />
          <Checkbox name="isActive" label="Show on the FAQ page" defaultChecked={initial.isActive} />
          <SubmitButton full>Save</SubmitButton>
        </ActionForm>
        );
        return initial.id && translation ? (
          <LangTabs
            bnStatus={translation.status}
            english={english}
            bangla={<TranslationEditor entity="faq" parentId={initial.id} status={translation.status} values={translation.values} english={{ category: initial.category, question: initial.question, answer: initial.answer }} />}
          />
        ) : (
          english
        );
      }}
    </EditSheet>
  );
}
