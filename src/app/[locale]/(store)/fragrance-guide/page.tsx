import { ContentPageView, contentMetadata } from "@/components/layout/content-page";
import { getT } from "@/i18n/server";

export const revalidate = 300;
export const generateMetadata = () => contentMetadata("fragrance-guide", "/fragrance-guide");

export default async function GuidePage() {
  const { t } = await getT();
  return <ContentPageView slug="fragrance-guide" crumbs={[{ label: t.footer.usage }]} kicker={t.pages.guideKicker} />;
}
