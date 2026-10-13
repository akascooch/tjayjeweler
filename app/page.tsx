export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="animate-fade-in text-center">
        <h1 className="text-[clamp(2.75rem,8vw,6.5rem)] font-black tracking-widest uppercase">
          tjayjeweler
        </h1>
        <p className="mt-8 text-xs tracking-[0.45em] text-[var(--muted)] uppercase sm:text-sm">
          Coming Soon
        </p>
        <p className="mt-16 text-[10px] tracking-[0.32em] text-[var(--muted)] uppercase sm:text-xs">
          Powered by Techooch
        </p>
      </div>
    </main>
  );
}
