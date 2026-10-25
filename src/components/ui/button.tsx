import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outline-light" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-sans font-medium uppercase tracking-[0.14em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-burgundy text-cream hover:bg-burgundy-deep focus-visible:outline-burgundy",
  secondary: "border border-burgundy text-burgundy hover:bg-burgundy hover:text-cream",
  ghost: "text-burgundy hover:bg-beige/60",
  light: "bg-cream text-burgundy hover:bg-white",
  "outline-light": "border border-cream/70 text-cream hover:bg-cream hover:text-burgundy",
  danger: "bg-error text-white hover:bg-error/90",
  link: "normal-case tracking-normal text-burgundy underline underline-offset-4 decoration-rose hover:decoration-burgundy px-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[11px]",
  md: "h-11 px-6 text-[12px]",
  lg: "h-13 px-8 text-[12px] md:text-[13px]",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean; full?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, full, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], variant !== "link" && sizes[size], full && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = "primary",
  size = "md",
  full,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <Link className={cn(base, variants[variant], variant !== "link" && sizes[size], full && "w-full", className)} {...props} />;
}
