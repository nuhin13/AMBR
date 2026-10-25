"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Side drawer / bottom sheet / centred modal built on Radix Dialog (focus trap, Esc, aria). */
export function Sheet({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "left" | "bottom" | "center";
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const position = {
    right: "inset-y-0 right-0 h-full w-full max-w-[440px] animate-slide-in-right",
    left: "inset-y-0 left-0 h-full w-[86%] max-w-[380px] animate-slide-in-left",
    bottom: "inset-x-0 bottom-0 max-h-[88dvh] w-full animate-slide-up rounded-t-[6px]",
    center: "left-1/2 top-1/2 max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 animate-fade-in",
  }[side];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-[2px] animate-fade-in" />
        <Dialog.Content className={cn("fixed z-50 flex flex-col bg-cream shadow-2xl focus:outline-none", position, className)}>
          <div className="flex items-center justify-between gap-4 border-b border-beige px-5 py-4">
            <div>
              <Dialog.Title className="font-serif text-xl text-burgundy">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-[13px] text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="-mr-2 rounded-full p-2 text-burgundy hover:bg-beige/60" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="border-t border-beige bg-cream-light px-5 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
