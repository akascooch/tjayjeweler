export function CatalogPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="px-6 py-16 md:px-12">
      <h1 className="text-4xl font-black tracking-[0.14em] uppercase">{title}</h1>
      <p className="mt-6 max-w-xl text-sm tracking-wide text-[var(--muted)]">{body}</p>
    </main>
  );
}
