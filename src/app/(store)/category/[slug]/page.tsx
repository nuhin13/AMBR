import { CategoryPage, categoryMetadata } from "../../category-page";

export async function generateMetadata(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  return categoryMetadata(slug, `/category/${slug}`);
}

export default async function FutureCategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  return <CategoryPage slug={slug} basePath={`/category/${slug}`} searchParams={await props.searchParams} />;
}
