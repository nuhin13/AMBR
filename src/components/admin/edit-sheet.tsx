"use client";

import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button, type ButtonProps } from "@/components/ui/button";

/** A button that opens a side sheet containing a form; children receive a close() callback. */
export function EditSheet({ title, description, trigger, variant = "secondary", size = "sm", children }: { title: string; description?: string; trigger: ReactNode; variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>{trigger}</Button>
      <Sheet open={open} onOpenChange={setOpen} side="right" title={title} description={description}>
        <div className="p-5">{children(() => setOpen(false))}</div>
      </Sheet>
    </>
  );
}
