import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 md:mb-12", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className={cn("eyebrow mb-3 flex items-center gap-3", tone === "light" ? "text-gold" : "text-burgundy/80", align === "center" && "justify-center")}>
            <span className="h-px w-8 bg-gold" aria-hidden />
            {eyebrow}
            {align === "center" && <span className="h-px w-8 bg-gold" aria-hidden />}
          </p>
        )}
        <h2 className={cn("text-[28px] md:text-[40px]", tone === "light" && "text-cream")}>{title}</h2>
        {description && <p className={cn("mt-3 text-[15px] md:text-base", tone === "light" ? "text-cream/80" : "text-muted")}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
