import { ContentPageView, contentMetadata } from "@/components/layout/content-page";

export const revalidate = 300;
export const generateMetadata = () => contentMetadata("fragrance-guide", "/fragrance-guide");

export default function GuidePage() {
  return <ContentPageView slug="fragrance-guide" crumbs={[{ label: "Fragrance guide" }]} eyebrow="Usage & safety" />;
}
