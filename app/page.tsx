import Link from "next/link";
import { CodeBlock } from "@/components/Code";
import { many } from "@/lib/db";
import { formatDate, timeAgo } from "@/lib/markdown";
import type { BlogPost, ForumThread } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await many<Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "published_at" | "author_name">>(
    `SELECT p.id, p.slug, p.title, p.excerpt, p.published_at, u.username AS author_name
     FROM blog_posts p JOIN users u ON u.id = p.author_id
     ORDER BY p.published_at DESC LIMIT 3`
  );

  const threads = await many<Pick<ForumThread, "id" | "title" | "last_post_at" | "category_name" | "category_slug" | "author_name" | "post_count">>(
    `SELECT t.id, t.title, t.last_post_at, c.name AS category_name, c.slug AS category_slug,
            u.username AS author_name,
            (SELECT COUNT(*) FROM forum_posts WHERE thread_id = t.id) AS post_count
     FROM forum_threads t
     JOIN forum_categories c ON c.id = t.category_id
     JOIN users u ON u.id = t.author_id
     ORDER BY t.last_post_at DESC LIMIT 5`
  );

  return (
    <>
      <Hero />
      <Marquee />
      <Pillars />
      <CodeShowcase />
      <Architecture />
      <Numbers />
      <Philosophy />
      <RecentPosts posts={posts} />
      <ForumActivity threads={threads} />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b hairline">
      <div className="hero-mesh" aria-hidden />
      <div className="hero-grid" aria-hidden />
      <div className="container-x relative pt-20 pb-24 md:pt-32 md:pb-36">
        <div className="rise rise-1 inline-flex items-center gap-2.5 mb-8">
          <span className="tag tag-brand">v0.1.0-alpha</span>
          <span className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">
            commit eb3bc91 · x86_64 · SMP-ready
          </span>
        </div>
        <h1 className="rise rise-2 display text-[clamp(48px,8.4vw,116px)] max-w-[16ch]">
          A kernel that does not ask <em>Unix</em> for permission.
        </h1>
        <p className="rise rise-3 prose-body max-w-[58ch] mt-7 md:text-[19px]">
          BoxOS is a bare-metal operating-system kernel written from scratch in C and assembly.
          No POSIX. No vintage layering. A small set of primitives — Cabin, Pocket, Manifest, Deck — composed into a runtime that is honest about hardware.
        </p>
        <div className="rise rise-4 mt-10 flex flex-wrap items-center gap-3">
          <Link href="/docs" className="btn btn-primary btn-lg">
            Read the documentation
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M3 6H9M9 6L6 3M9 6L6 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link href="/forum" className="btn btn-ghost btn-lg">Visit the forum</Link>
          <a
            href="https://github.com/skripsaha/boxos"
            target="_blank"
            rel="noreferrer"
            className="btn btn-link ml-2 text-sm"
          >
            View source ↗
          </a>
        </div>
        <div className="rise rise-5 mt-14 grid grid-cols-2 md:grid-cols-4 gap-px bg-[color:var(--color-line)] border hairline rounded-[12px] overflow-hidden max-w-3xl">
          <Stat k="syscalls" v="83" sub="manifest ops" />
          <Stat k="cores" v="up to 64" sub="AMP scheduler" />
          <Stat k="ipc" v="≈ 480 ns" sub="pocket roundtrip" />
          <Stat k="boot" v="< 350 ms" sub="UEFI to userspace" />
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div className="bg-[color:var(--color-paper)] px-5 py-5">
      <p className="eyebrow">{k}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight tabular">{v}</p>
      <p className="mt-1 text-[12px] text-[color:var(--color-ink-3)] font-mono">{sub}</p>
    </div>
  );
}

function Marquee() {
  const items = [
    "asymmetric multiprocessing",
    "capability-mediated IPC",
    "content-addressed storage",
    "no global state",
    "no POSIX",
    "no inheritance from history",
    "first-class processes",
    "manifest-driven syscalls",
    "predictable latency",
    "x86_64 native",
  ];
  return (
    <section aria-hidden className="border-b hairline overflow-hidden">
      <div className="ticker-track py-5 font-mono text-[12px] tabular text-[color:var(--color-ink-3)] tracking-[0.06em]">
        {[...items, ...items].map((s, idx) => (
          <span key={idx} className="inline-flex items-center gap-3">
            <span className="dot" /> {s}
          </span>
        ))}
      </div>
    </section>
  );
}

function Pillars() {
  const pillars = [
    {
      tag: "01 / cabin",
      title: "Processes that own their memory.",
      body: "A Cabin is the unit of execution and isolation. Each one carries a private address space, its own capability table, and a bounded view of the system. No fork. No exec inheritance. Lifecycle is explicit and observable.",
      bullets: ["Private address space (PML4)", "Capability table per process", "Deterministic teardown"],
    },
    {
      tag: "02 / pocket",
      title: "Capability-mediated message passing.",
      body: "Pockets replace pipes, sockets, and signals with a single primitive: a typed, ring-buffered channel governed by a capability. Send and receive are non-blocking by default, and the kernel never copies more than necessary.",
      bullets: ["Lazy growable rings", "Bounded latency", "No ambient authority"],
    },
    {
      tag: "03 / manifest",
      title: "Syscalls as data, not numbers.",
      body: "The Manifest is a structured table that describes every kernel operation a process is allowed to invoke — what it accepts, what it returns, what side effects it produces. Sandboxing is a property of the table, not a permission bit.",
      bullets: ["83 ops, fully introspectable", "Compile-time validation", "Exposes capabilities, not numbers"],
    },
  ];
  return (
    <section className="container-x py-28 md:py-40">
      <div className="max-w-3xl">
        <p className="eyebrow eyebrow--brand">The primitives</p>
        <h2 className="display text-[clamp(34px,5.5vw,72px)] mt-5 leading-[1.02]">
          Four objects. <em>One</em> system that fits on a single page.
        </h2>
        <p className="prose-body mt-6 max-w-[58ch]">
          Most kernels grow inwards — adding subsystems until the model collapses into convention.
          BoxOS keeps the surface small. Everything is built from a handful of orthogonal pieces.
        </p>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-px bg-[color:var(--color-line)] border hairline rounded-[14px] overflow-hidden">
        {pillars.map((p) => (
          <article key={p.tag} className="bg-[color:var(--color-paper)] p-7 md:p-9 flex flex-col">
            <p className="eyebrow eyebrow--brand">{p.tag}</p>
            <h3 className="mt-5 text-[24px] font-medium tracking-tight leading-[1.2]">{p.title}</h3>
            <p className="prose-body mt-4 text-[15px]">{p.body}</p>
            <ul className="mt-7 space-y-2.5 pt-5 border-t hairline-2">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <span className="mt-[7px] inline-block h-[3px] w-[10px] bg-[color:var(--color-brand)] rounded-full flex-shrink-0" />
                  <span className="text-[color:var(--color-ink-2)]">{b}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function CodeShowcase() {
  return (
    <section className="border-t border-b hairline bg-[color:var(--color-paper-2)]">
      <div className="container-x py-28 md:py-40 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <p className="eyebrow eyebrow--brand">The interface</p>
          <h2 className="display text-[clamp(32px,4.6vw,56px)] mt-5">
            Programs talk to the kernel<br />
            <em>by name</em>, not by number.
          </h2>
          <p className="prose-body mt-6 max-w-[44ch]">
            A Manifest describes the kernel surface. boxlib maps named operations onto register-passed
            calls — typed, validated, and verifiable at compile time.
          </p>
          <div className="mt-8 space-y-4">
            <Feature label="Manifest" value="83 operations, all introspectable" />
            <Feature label="Latency" value="syscall ≈ 90 ns · IPC ≈ 480 ns (1c)" />
            <Feature label="Footprint" value="kernel: ~ 220 KB · boxlib: ~ 90 KB" />
          </div>
        </div>
        <div className="lg:col-span-7">
          <CodeBlock fileName="user/echo.c" language="c">
{`#include <boxlib/pocket.h>
#include <boxlib/cabin.h>

// minimal echo service — no main loop runtime, no buffering layer.
int main(void) {
    PocketId p = pocket_open("echo");
    if (p < 0) return 1;

    char buf[256];
    for (;;) {
        ResultCode r = pocket_recv(p, buf, sizeof buf);
        if (r == ERR_CLOSED) break;
        if (r < 0) continue;

        // send the same bytes back, no copy on the kernel side.
        pocket_send(p, buf, (size_t)r);
    }

    pocket_close(p);
    return 0;
}`}
          </CodeBlock>
        </div>
      </div>
    </section>
  );
}

function Feature({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b hairline-2">
      <span className="eyebrow">{label}</span>
      <span className="text-sm tabular text-[color:var(--color-ink)]">{value}</span>
    </div>
  );
}

function Architecture() {
  const layers = [
    { name: "User programs", ex: "shell · bench · text editor · network tools", ord: 1 },
    { name: "boxlib", ex: "pocket · manifest · stdio · framebuffer", ord: 2 },
    { name: "Kernel surface — Manifest", ex: "83 ops · capability-mediated · introspectable", ord: 3, brand: true },
    { name: "Subsystems", ex: "scheduler · vmm · pocket · deck/tagfs · pcie", ord: 4 },
    { name: "Hardware abstraction", ex: "apic · pci · acpi · ahci · framebuffer", ord: 5 },
    { name: "Boot — TagBoot UEFI", ex: "PE+ binary · GOP framebuffer · ACPI handoff", ord: 6 },
  ];
  return (
    <section className="container-x py-28 md:py-40">
      <div className="max-w-3xl">
        <p className="eyebrow eyebrow--brand">The shape</p>
        <h2 className="display text-[clamp(32px,4.6vw,56px)] mt-5">
          Six layers. Boundaries that hold.
        </h2>
        <p className="prose-body mt-6 max-w-[58ch]">
          The system is composed top-down. Each layer is responsible for a specific physical concern,
          and exposes a narrow contract to the layer above it. There are no shortcuts.
        </p>
      </div>

      <div className="mt-14 border hairline rounded-[14px] overflow-hidden bg-[color:var(--color-paper)]">
        {layers.map((l, idx) => (
          <div
            key={l.name}
            className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-8 px-6 md:px-10 py-6 md:py-7 ${idx > 0 ? "border-t hairline" : ""} ${l.brand ? "bg-[color:var(--color-brand-soft)]" : ""}`}
          >
            <div className="flex items-center gap-5 md:w-[220px] flex-shrink-0">
              <span className="font-mono text-[11px] tabular text-[color:var(--color-ink-3)] tracking-[0.14em] uppercase">
                L{l.ord}
              </span>
              <span className={`text-[17px] md:text-[19px] font-medium tracking-tight ${l.brand ? "text-[color:var(--color-brand-ink)]" : ""}`}>
                {l.name}
              </span>
            </div>
            <div className={`text-sm font-mono tabular ${l.brand ? "text-[color:var(--color-brand-ink)]" : "text-[color:var(--color-ink-2)]"}`}>
              {l.ex}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Numbers() {
  return (
    <section className="border-t hairline bg-[color:var(--color-paper-2)]">
      <div className="container-x py-24 md:py-32">
        <p className="eyebrow eyebrow--brand">Microbenchmarks</p>
        <h2 className="display text-[clamp(28px,4vw,48px)] mt-5 max-w-[24ch]">
          Numbers from <em>bench.elf</em>, single core, RDTSC-calibrated.
        </h2>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-[color:var(--color-line)] border hairline rounded-[14px] overflow-hidden">
          {[
            { k: "null syscall", v: "92 ns", sub: "1.6M ops/s" },
            { k: "pocket roundtrip", v: "478 ns", sub: "single producer" },
            { k: "cabin spawn", v: "21.4 µs", sub: "fresh PML4" },
            { k: "deck read 4 KB", v: "2.7 µs", sub: "cached page" },
          ].map((s) => (
            <div key={s.k} className="bg-[color:var(--color-paper)] px-7 py-7">
              <p className="eyebrow">{s.k}</p>
              <p className="mt-3 text-[34px] font-medium tracking-tight tabular leading-none">{s.v}</p>
              <p className="mt-2 text-xs tabular font-mono text-[color:var(--color-ink-3)]">{s.sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs tabular font-mono text-[color:var(--color-ink-3)]">
          QEMU 8.2 · -enable-kvm · 1 vCPU · 16 GB · numbers vary on hardware.
        </p>
      </div>
    </section>
  );
}

function Philosophy() {
  return (
    <section className="container-x py-32 md:py-44">
      <div className="max-w-[68ch] mx-auto text-center">
        <p className="eyebrow eyebrow--brand">Direction</p>
        <p className="mt-7 text-[clamp(28px,3.6vw,44px)] leading-[1.18] tracking-tight">
          BoxOS is not a Linux clone, a microkernel exercise, or a hobby toy.
          It is an attempt to ask <em className="font-serif italic font-normal">what an operating system would look like</em> if the past forty years of OS convention were optional.
        </p>
        <p className="mt-10 text-sm tabular font-mono text-[color:var(--color-ink-3)]">
          — project mission, written 2025
        </p>
      </div>
    </section>
  );
}

function RecentPosts({ posts }: { posts: { id: number; slug: string; title: string; excerpt: string; published_at: number; author_name: string }[] }) {
  return (
    <section className="border-t hairline">
      <div className="container-x py-24 md:py-28">
        <div className="flex items-end justify-between gap-6 mb-12">
          <div>
            <p className="eyebrow eyebrow--brand">Latest writing</p>
            <h2 className="display text-[clamp(28px,3.8vw,44px)] mt-4">From the blog</h2>
          </div>
          <Link href="/blog" className="btn-link text-sm">All posts ↗</Link>
        </div>
        {posts.length === 0 ? (
          <p className="prose-body">No posts yet — check back soon.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card p-7 hover:border-[color:var(--color-ink-4)] group">
                <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">{formatDate(p.published_at)} · {p.author_name}</p>
                <h3 className="mt-4 text-[20px] font-medium tracking-tight leading-snug group-hover:text-[color:var(--color-brand-deep)] transition-colors">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm text-[color:var(--color-ink-2)] line-clamp-3">{p.excerpt}</p>
                <span className="mt-6 text-sm font-medium inline-flex items-center gap-1.5">
                  Read <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ForumActivity({ threads }: { threads: { id: number; title: string; last_post_at: number; category_name: string; category_slug: string; author_name: string; post_count: number }[] }) {
  return (
    <section className="border-t hairline bg-[color:var(--color-paper-2)]">
      <div className="container-x py-24 md:py-28">
        <div className="flex items-end justify-between gap-6 mb-12">
          <div>
            <p className="eyebrow eyebrow--brand">Live discussion</p>
            <h2 className="display text-[clamp(28px,3.8vw,44px)] mt-4">Active in the forum</h2>
          </div>
          <Link href="/forum" className="btn-link text-sm">Open forum ↗</Link>
        </div>
        {threads.length === 0 ? (
          <div className="surface rounded-[12px] p-10 text-center">
            <p className="prose-body">The forum is quiet right now.</p>
            <Link href="/forum/new" className="btn btn-primary mt-6">Start the first thread</Link>
          </div>
        ) : (
          <div className="surface rounded-[14px] overflow-hidden">
            {threads.map((t, idx) => (
              <Link
                key={t.id}
                href={`/forum/t/${t.id}`}
                className={`flex items-center justify-between gap-4 px-6 py-5 hover:bg-[color:var(--color-paper-2)] transition-colors ${idx > 0 ? "border-t hairline-2" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="tag">{t.category_name}</span>
                    <span className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">
                      {timeAgo(t.last_post_at)} · by {t.author_name}
                    </span>
                  </div>
                  <p className="mt-2 text-[16px] font-medium tracking-tight truncate">{t.title}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end flex-shrink-0">
                  <p className="text-[20px] font-medium tabular leading-none">{t.post_count}</p>
                  <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">posts</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-x py-32 md:py-44">
      <div className="rounded-[20px] border hairline overflow-hidden relative">
        <div className="hero-mesh" aria-hidden />
        <div className="relative px-8 md:px-16 py-20 md:py-28 text-center">
          <p className="eyebrow eyebrow--brand">Get involved</p>
          <h2 className="display text-[clamp(32px,5vw,64px)] mt-5 max-w-[18ch] mx-auto">
            Build with us. Or watch us build.
          </h2>
          <p className="prose-body mt-7 max-w-[52ch] mx-auto">
            BoxOS is open and unpolished. Pull the source, run it under QEMU, file an issue, post in the forum.
            Every week the kernel grows a little.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn btn-primary btn-lg">Create an account</Link>
            <Link href="/docs" className="btn btn-ghost btn-lg">Read the docs</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
