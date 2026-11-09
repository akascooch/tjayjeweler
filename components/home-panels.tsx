import manifest from "../public/manifest.json";

const aboutCopy = manifest.description.trim();

export function HomePanels() {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2">
      <section aria-labelledby="about-us-heading" className="border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 id="about-us-heading" className="font-ui text-xs tracking-[0.2em] uppercase">
          About Us
        </h2>
        {aboutCopy ? <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{aboutCopy}</p> : null}
      </section>
      <section aria-labelledby="customer-support-heading" className="border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 id="customer-support-heading" className="font-ui text-xs tracking-[0.2em] uppercase">
          Customer Support
        </h2>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          This is not a live chat. A support channel is not published on this site.
        </p>
      </section>
    </div>
  );
}
