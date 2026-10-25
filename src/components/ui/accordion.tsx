"use client";

import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function Accordion({ items, defaultOpen }: { items: { id: string; title: string; content: ReactNode }[]; defaultOpen?: string[] }) {
  return (
    <A.Root type="multiple" defaultValue={defaultOpen} className="border-t border-burgundy/12">
      {items.map((it) => (
        <A.Item key={it.id} value={it.id} className="border-b border-burgundy/12">
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left">
              <span className="font-serif text-[18px] leading-snug text-burgundy md:text-[20px]">{it.title}</span>
              <Plus className="size-4 text-burgundy transition-transform duration-200 group-data-[state=open]:rotate-45" aria-hidden />
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden pb-5 text-[14.5px] leading-relaxed text-charcoal">{it.content}</A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
