import { CategoryPage, categoryMetadata } from "../category-page";

export const generateMetadata = () => categoryMetadata("perfumes", "/perfumes");

export default async function PerfumesPage(props: PageProps<"/perfumes">) {
  return <CategoryPage slug="perfumes" basePath="/perfumes" searchParams={await props.searchParams} />;
}
