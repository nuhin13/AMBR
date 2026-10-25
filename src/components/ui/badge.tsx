import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "burgundy" | "rose" | "beige" | "outline" | "success" | "error" | "gold";

const tones: Record<Tone, string> = {
  burgundy: "bg-burgundy text-cream",
  rose: "bg-rose text-burgundy",
  beige: "bg-beige text-burgundy",
  outline: "border border-burgundy/40 text-burgundy",
  success: "bg-success/10 text-success",
  error: "bg-error/10 text-error",
  gold: "bg-gold/30 text-burgundy",
};

export function Badge({ tone = "beige", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-[2px] px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.14em]", tones[tone], className)}>
      {children}
    </span>
  );
}
