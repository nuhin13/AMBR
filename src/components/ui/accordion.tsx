"use client";

import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function Accordion({ items, defaultOpen }: { items: { id: string; title: string; content: ReactNode }[]; defaultOpen?: string[] }) {
  return (
    <A.Root type="multiple" defaultValue={defaultOpen} className="border-t border-beige">
      {items.map((it) => (
        <A.Item key={it.id} value={it.id} className="border-b border-beige">
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between py-4 text-left">
              <span className="eyebrow text-burgundy">{it.title}</span>
              <Plus className="size-4 text-burgundy transition-transform duration-200 group-data-[state=open]:rotate-45" aria-hidden />
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden pb-5 text-[14.5px] leading-relaxed text-charcoal">{it.content}</A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
