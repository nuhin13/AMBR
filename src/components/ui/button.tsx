import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outline-light" | "danger" | "link" | "quiet" | "quiet-light";
type Size = "sm" | "md" | "lg";

const base =
  "btn-text inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-sans font-medium transition-[background-color,color,border-color,opacity,transform] duration-300 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-burgundy text-cream hover:bg-burgundy-deep focus-visible:outline-burgundy",
  secondary: "border border-burgundy/70 text-burgundy hover:border-burgundy hover:bg-burgundy hover:text-cream",
  ghost: "text-burgundy hover:bg-beige/60",
  light: "bg-cream text-burgundy hover:bg-white",
  "outline-light": "border border-cream/60 text-cream hover:bg-cream hover:text-burgundy",
  danger: "bg-error text-white hover:bg-error/90",
  link: "normal-case tracking-normal text-burgundy underline underline-offset-4 decoration-rose hover:decoration-burgundy px-0 h-auto",
  /* Editorial text action with an animated arrow — the default secondary action on the storefront */
  quiet: "group/q h-auto px-0 text-burgundy",
  "quiet-light": "group/q h-auto px-0 text-cream",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[11px]",
  md: "h-11 px-6 text-[12px]",
  lg: "h-13 px-8 text-[12px] md:text-[12.5px]",
};

const isQuiet = (v: Variant) => v === "quiet" || v === "quiet-light";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean; full?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, full, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], variant !== "link" && !isQuiet(variant) && sizes[size], isQuiet(variant) && "text-[12px]", full && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {isQuiet(variant) ? <QuietInner>{children}</QuietInner> : children}
    </button>
  );
});

function QuietInner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="link-quiet">{children}</span>
      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/q:translate-x-1 rtl:rotate-180" aria-hidden />
    </>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  full,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
  return (
    <Link className={cn(base, variants[variant], variant !== "link" && !isQuiet(variant) && sizes[size], isQuiet(variant) && "text-[12px]", full && "w-full", className)} {...props}>
      {isQuiet(variant) ? <QuietInner>{children}</QuietInner> : children}
    </Link>
  );
}
