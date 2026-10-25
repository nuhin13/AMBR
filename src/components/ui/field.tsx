import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[2px] border border-burgundy/15 bg-white/70 px-3.5 text-[15px] text-charcoal placeholder:text-muted/60 transition-colors hover:border-burgundy/30 focus:border-burgundy focus:bg-white focus:outline-none disabled:bg-cream-light disabled:text-muted aria-[invalid=true]:border-error";

type FieldShell = { label?: ReactNode; hint?: ReactNode; error?: string; required?: boolean; className?: string };

export function FieldShell({ id, label, hint, error, required, className, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-charcoal">
          {label}
          {required && <span className="ml-0.5 text-error" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12.5px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldShell & { prefix?: ReactNode }>(function Input(
  { label, hint, error, required, className, prefix, id, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[15px] text-muted">{prefix}</span>}
        <input
          ref={ref}
          id={fid}
          className={cn(control, "h-12", prefix ? "pl-14" : undefined)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          required={required}
          {...props}
        />
      </div>
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldShell>(function Textarea(
  { label, hint, error, required, className, id, rows = 4, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        ref={ref}
        id={fid}
        rows={rows}
        className={cn(control, "py-3 leading-relaxed")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        required={required}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldShell>(function Select(
  { label, hint, error, required, className, id, children, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          className={cn(control, "h-12 appearance-none pr-10")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          required={required}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </FieldShell>
  );
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string }>(function Checkbox(
  { label, error, className, id, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={fid} className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug">
        <input ref={ref} id={fid} type="checkbox" className="mt-0.5 size-4 shrink-0 accent-burgundy" aria-invalid={error ? true : undefined} {...props} />
        <span>{label}</span>
      </label>
      {error && <p className="mt-1 text-[13px] text-error" role="alert">{error}</p>}
    </div>
  );
});
