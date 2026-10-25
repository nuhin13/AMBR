import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The approved AMBR primary logo (cream version for dark/burgundy backgrounds),
 * taken from the brand kit with only its baked-in background removed — the artwork
 * itself is unchanged. Replace /public/brand files when vector originals are supplied.
 */
export function Logo({ className, priority, href = "/" }: { className?: string; priority?: boolean; href?: string | null }) {
  const img = (
    <Image
      src="/brand/ambr-logo-cream-720.png"
      alt="AMBR — Above Ordinary"
      width={720}
      height={612}
      priority={priority}
      sizes="(min-width: 768px) 110px, 70px"
      className={cn("h-auto w-full", className)}
    />
  );
  return href ? (
    <Link href={href} aria-label="AMBR home" className="block">
      {img}
    </Link>
  ) : (
    img
  );
}

export function Emblem({ className }: { className?: string }) {
  return <Image src="/brand/ambr-emblem-cream.png" alt="" width={394} height={704} className={cn("h-auto w-full", className)} aria-hidden />;
}
