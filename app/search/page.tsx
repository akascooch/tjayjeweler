import { CatalogPage } from "../catalog-page";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  return (
    <CatalogPage
      title="Search"
      body={query ? `No results yet for “${query}”.` : "Enter a search from the sidebar."}
    />
  );
}
