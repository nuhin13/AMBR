"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

type FormAction = (fd: FormData) => Promise<ActionResult<unknown>>;

/**
 * Generic admin form: posts FormData to a server action, toasts the result,
 * lists field errors, refreshes server data, optionally redirects/resets.
 */
export function ActionForm({
  action,
  children,
  className,
  success = "Saved",
  redirectTo,
  reset,
  onSuccess,
  confirm,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  success?: string;
  redirectTo?: string | ((data: unknown) => string);
  reset?: boolean;
  onSuccess?: (data: unknown) => void;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  const toast = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await action(fd);
      if (r.ok) {
        setErrors(null);
        toast(r.message ?? success);
        if (reset) ref.current?.reset();
        onSuccess?.(r.data);
        if (redirectTo) router.push(typeof redirectTo === "function" ? redirectTo(r.data) : redirectTo);
        else router.refresh();
      } else {
        setErrors(r.fieldErrors ?? null);
        toast(r.error, "error");
      }
    });
  };

  return (
    <form ref={ref} onSubmit={submit} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {errors && Object.keys(errors).length > 0 && (
          <div className="mb-4 border border-error/40 bg-error/5 p-3 text-[13px] text-error" role="alert">
            <ul className="list-inside list-disc space-y-0.5">
              {Object.entries(errors).map(([k, v]) => <li key={k}><span className="font-medium">{k}</span>: {v}</li>)}
            </ul>
          </div>
        )}
        {children}
      </fieldset>
    </form>
  );
}

/** A single-button form for one-click actions (approve, delete, toggle…). */
export function ActionButton({
  action,
  fields = {},
  children,
  confirm,
  success,
  variant = "secondary",
  size = "sm",
  className,
  redirectTo,
}: {
  action: FormAction;
  fields?: Record<string, string>;
  children: ReactNode;
  confirm?: string;
  success?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  redirectTo?: string;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      loading={pending}
      className={cn(className)}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.set(k, v);
        start(async () => {
          const r = await action(fd);
          if (r.ok) {
            toast(r.message ?? success ?? "Done");
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } else toast(r.error, "error");
        });
      }}
    >
      {children}
    </Button>
  );
}

export function SubmitButton({ children = "Save", ...props }: ButtonProps) {
  return <Button type="submit" {...props}>{children}</Button>;
}
