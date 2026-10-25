import Link from "next/link";
import { getBanners } from "@/modules/content/queries";

export async function AnnouncementBar() {
  const [banner] = await getBanners("ANNOUNCEMENT");
  if (!banner) return null;
  return (
    <div className="bg-beige text-burgundy">
      <p className="container-x flex min-h-9 items-center justify-center gap-2 py-2 text-center text-[11.5px] font-medium tracking-[0.12em] uppercase">
        <span>{banner.title}</span>
        {banner.ctaHref && banner.ctaLabel && (
          <Link href={banner.ctaHref} className="underline decoration-burgundy/40 underline-offset-4 hover:decoration-burgundy">
            {banner.ctaLabel}
          </Link>
        )}
      </p>
    </div>
  );
}
