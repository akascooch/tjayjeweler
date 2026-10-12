export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6">
      <div className="animate-fade-in text-center">
        <h1 className="text-[clamp(2.75rem,9vw,7rem)] font-light tracking-widest text-[#c0c0c0]">
          tjayjeweler
        </h1>
        <p className="mt-8 text-xs tracking-[0.45em] text-[#a3a3a3] uppercase sm:text-sm">
          Coming Soon
        </p>
        <p className="mt-16 text-[10px] tracking-[0.32em] text-[#737373] uppercase sm:text-xs">
          Powered by Techooch
        </p>
      </div>
    </main>
  );
}
