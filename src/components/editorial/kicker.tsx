import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small label above a heading, with a gold hairline. */
export function Kicker({ children, tone = "dark", className }: { children: ReactNode; tone?: "dark" | "light"; className?: string }) {
  return (
    <p className={cn("eyebrow flex items-center gap-3", tone === "light" ? "text-gold" : "text-burgundy/75", className)}>
      <span className="h-px w-8 shrink-0 bg-gold" aria-hidden />
      {children}
    </p>
  );
}

/**
 * Asymmetric section opener: kicker sits in a narrow left column, the title spans the rest.
 * Avoids the repeated "centred eyebrow + H2" rhythm.
 */
export function SectionIntro({
  kicker,
  title,
  text,
  action,
  tone = "dark",
  className,
  id,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  tone?: "dark" | "light";
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("grid gap-5 md:grid-cols-12 md:gap-8", className)}>
      <div className="md:col-span-3 md:pt-3">{kicker && <Kicker tone={tone}>{kicker}</Kicker>}</div>
      <div className="md:col-span-9">
        <h2 id={id} className={cn("t-h2 max-w-[18ch]", tone === "light" && "text-cream")}>{title}</h2>
        {(text || action) && (
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-12">
            {text && <p className={cn("t-lead measure", tone === "light" ? "text-cream/75" : "text-muted")}>{text}</p>}
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
