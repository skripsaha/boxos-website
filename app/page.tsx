import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Primitives />
      <Aphorism />
      <Lanes />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b hairline">
      <div className="hero-mesh" aria-hidden />
      <div className="hero-grid" aria-hidden />
      <div className="container-x relative pt-24 pb-28 md:pt-36 md:pb-40">
        <h1 className="rise rise-1 display text-[clamp(52px,9vw,128px)] max-w-[14ch]">
          A kernel, written from <em>scratch</em>.
        </h1>
        <p className="rise rise-2 prose-body max-w-[58ch] mt-8 md:text-[19px]">
          BoxOS is a small, bare-metal operating-system kernel for x86_64.
          Asymmetric multiprocessing, capability-mediated IPC, content-addressed storage —
          built on a non-Unix paradigm.
        </p>
        <div className="rise rise-3 mt-10 flex flex-wrap items-center gap-3">
          <Link href="/download" className="btn btn-primary btn-lg">
            Download
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M6 2v6m0 0L3 5.5M6 8l3-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.5 9.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </Link>
          <Link href="/architecture" className="btn btn-ghost btn-lg">How it works</Link>
        </div>
      </div>
    </section>
  );
}

function Primitives() {
  const items = [
    { name: "Cabin",    role: "process",      blurb: "An execution context with its own memory, capabilities and lifecycle." },
    { name: "Pocket",   role: "channel",      blurb: "A typed, capability-bound message channel — the only IPC primitive." },
    { name: "Manifest", role: "syscall ABI",  blurb: "A self-describing chain of operations the kernel knows how to run." },
    { name: "Deck",     role: "storage",      blurb: "Content-addressed persistence, organised through TagFS — not a file tree." },
  ];
  return (
    <section className="relative container-x py-28 md:py-36">
      <div className="max-w-2xl">
        <h2 className="display text-[clamp(34px,5.4vw,64px)]">
          Four primitives. <em>One</em> system.
        </h2>
        <p className="prose-body mt-6 max-w-[54ch]">
          Everything user-visible in BoxOS is built from a small set of orthogonal pieces.
        </p>
      </div>

      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[color:var(--color-line)] border hairline rounded-[14px] overflow-hidden">
        {items.map((it) => (
          <article key={it.name} className="bg-[color:var(--color-paper)] p-7 md:p-8">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[22px] font-medium tracking-tight">{it.name}</h3>
              <span className="text-[12px] tabular text-[color:var(--color-ink-3)] font-mono">{it.role}</span>
            </div>
            <p className="prose-body mt-4 text-[14.5px] leading-relaxed">{it.blurb}</p>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/architecture" className="btn-link text-sm font-medium">
          Read the architecture overview &nbsp;→
        </Link>
      </div>
    </section>
  );
}

function Aphorism() {
  return (
    <section className="border-t hairline relative overflow-hidden">
      <div className="page-mesh" aria-hidden />
      <div className="container-narrow relative py-28 md:py-36 text-center">
        <p className="text-[clamp(28px,3.6vw,42px)] leading-[1.22] tracking-tight">
          Most kernels grow inwards until the model collapses into convention.
          <em className="font-serif italic font-normal text-[color:var(--color-brand-deep)]">
            {" "}BoxOS keeps its surface small.
          </em>
        </p>
      </div>
    </section>
  );
}

function Lanes() {
  return (
    <section className="border-t hairline bg-[color:var(--color-paper-2)]">
      <div className="container-x py-24 md:py-28">
        <div className="grid md:grid-cols-3 gap-px bg-[color:var(--color-line)] border hairline rounded-[14px] overflow-hidden">
          <Link href="/download" className="bg-[color:var(--color-paper)] p-8 md:p-10 group transition-colors hover:bg-[color:var(--color-paper-2)]">
            <h3 className="text-[20px] font-medium tracking-tight">Download</h3>
            <p className="prose-body mt-3 text-[14.5px]">Bootable ISO, raw disk image, UEFI loader, kernel binary.</p>
            <span className="mt-6 inline-block text-sm font-medium text-[color:var(--color-brand-deep)] group-hover:translate-x-0.5 transition-transform">Get the latest build →</span>
          </Link>
          <Link href="/docs" className="bg-[color:var(--color-paper)] p-8 md:p-10 group transition-colors hover:bg-[color:var(--color-paper-2)]">
            <h3 className="text-[20px] font-medium tracking-tight">Docs</h3>
            <p className="prose-body mt-3 text-[14.5px]">A short, living overview of how the kernel is structured.</p>
            <span className="mt-6 inline-block text-sm font-medium text-[color:var(--color-brand-deep)] group-hover:translate-x-0.5 transition-transform">Read the docs →</span>
          </Link>
          <Link href="/forum" className="bg-[color:var(--color-paper)] p-8 md:p-10 group transition-colors hover:bg-[color:var(--color-paper-2)]">
            <h3 className="text-[20px] font-medium tracking-tight">Forum</h3>
            <p className="prose-body mt-3 text-[14.5px]">Long-form discussion: design, bugs, patches, real-iron reports.</p>
            <span className="mt-6 inline-block text-sm font-medium text-[color:var(--color-brand-deep)] group-hover:translate-x-0.5 transition-transform">Open the forum →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
