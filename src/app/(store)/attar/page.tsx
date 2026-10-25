import { CategoryPage, categoryMetadata } from "../category-page";

export const generateMetadata = () => categoryMetadata("attar", "/attar");

export default async function AttarPage(props: PageProps<"/attar">) {
  return <CategoryPage slug="attar" basePath="/attar" searchParams={await props.searchParams} />;
}
