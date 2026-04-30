import Link from "next/link";
import { CodeBlock } from "@/components/Code";

export const metadata = { title: "Documentation" };

export default function DocsPage() {
  return (
    <section>
      <header className="border-b hairline">
        <div className="container-x py-20 md:py-28">
          <p className="eyebrow eyebrow--brand">Documentation · v0.1.0-alpha</p>
          <h1 className="display text-[clamp(40px,6vw,76px)] mt-4 max-w-[20ch]">
            How BoxOS is built, in twelve pages.
          </h1>
          <p className="prose-body mt-6 max-w-[58ch]">
            This is a living overview, written alongside the kernel. Sections marked
            <span className="tag tag-brand mx-1.5">draft</span>
            are still in flux. Sections marked
            <span className="tag mx-1.5">stable</span>
            describe behavior the kernel will not break without notice.
          </p>
        </div>
      </header>

      <div className="container-x py-16 md:py-20 grid lg:grid-cols-12 gap-12 lg:gap-16">
        <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
          <p className="eyebrow">Contents</p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {[
              ["Overview", "overview"],
              ["Cabin — process", "cabin"],
              ["Pocket — IPC", "pocket"],
              ["Manifest — capabilities", "manifest"],
              ["Deck — storage", "deck"],
              ["Boot & runtime", "boot"],
              ["Build & run", "build"],
              ["Source layout", "source"],
            ].map(([label, anchor]) => (
              <li key={anchor as string}>
                <a href={`#${anchor}`} className="text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <article className="lg:col-span-9 article">
          <Section id="overview" tag="stable" title="Overview">
            <p>
              BoxOS is a 64-bit kernel for x86_64. It does not implement POSIX. It has no fork, no signals, no
              ambient file descriptors, no shared global filesystem namespace. Programs interact with the
              kernel through a small, named operation table called the <strong>Manifest</strong>, and with each
              other through typed message channels called <strong>Pockets</strong>.
            </p>
            <p>
              The kernel uses asymmetric multiprocessing (AMP). One core runs the scheduler and core services;
              the others run user work in cooperative shards. There is no global runqueue and no big lock.
            </p>
            <p>
              Storage is content-addressed, organized through a structure called <strong>TagFS</strong>:
              durable persistence is a tag-graph, not a directory tree. Programs store, retrieve, and link
              data by description, not by path.
            </p>
          </Section>

          <Section id="cabin" tag="stable" title="Cabin — the process model">
            <p>
              A <strong>Cabin</strong> is a process. Each Cabin has its own PML4, its own capability table,
              and its own scheduling shard. Cabins do not share memory, signals, or open handles by default.
            </p>
            <p>
              Cabin lifecycle is explicit: <code>cabin_spawn</code>, <code>cabin_kill</code>,
              <code>cabin_wait</code>. There is no <code>fork</code> — every spawn is a fresh start with a known
              entry point and a known capability set.
            </p>
            <CodeBlock language="c">
{`CabinId child = cabin_spawn(&(CabinSpec){
    .image = "echo",
    .argv  = (const char*[]){ "echo", "hello", NULL },
    .pockets_in  = { my_input },
    .pockets_out = { my_output },
});
ResultCode rc = cabin_wait(child, /*timeout_ms=*/ 5000);`}
            </CodeBlock>
          </Section>

          <Section id="pocket" tag="stable" title="Pocket — message-passing IPC">
            <p>
              A <strong>Pocket</strong> is a typed, ring-buffered channel between Cabins. The kernel never
              copies the bytes more than once. Senders and receivers each hold a capability bound to a single
              role — read, write, or peek.
            </p>
            <ul>
              <li>Bounded, lazy-growable ring (4 KB → 1 MB).</li>
              <li>Backpressure is observable: <code>pocket_send</code> returns <code>ERR_FULL</code> instead of blocking by default.</li>
              <li>Closing one end propagates: the other side receives <code>ERR_CLOSED</code>.</li>
            </ul>
            <CodeBlock language="c">
{`PocketId p = pocket_create(/*capacity=*/ 16 * 1024);
PocketId reader = pocket_dup_role(p, ROLE_READ);
PocketId writer = pocket_dup_role(p, ROLE_WRITE);
pocket_close(p);  // original handle goes away`}
            </CodeBlock>
          </Section>

          <Section id="manifest" tag="draft" title="Manifest — capabilities as data">
            <p>
              Every system call is described as a row in the kernel's <strong>Manifest</strong>: name,
              register signature, side-effects, capability requirements. Programs do not invoke system calls
              by number; <code>boxlib</code> resolves them at link time.
            </p>
            <p>
              Sandboxing is not a permission bit, it is a Manifest restricted to a subset of rows. A program
              with no <code>deck.*</code> rows literally cannot speak to storage.
            </p>
          </Section>

          <Section id="deck" tag="draft" title="Deck — content-addressed storage">
            <p>
              <strong>Deck</strong> is the persistence layer. Files are content-addressed blobs; metadata is a
              tag graph. Two programs that write the same bytes share storage; two programs that store the same
              JPEG photographed from different angles do not.
            </p>
          </Section>

          <Section id="boot" tag="stable" title="Boot & runtime">
            <p>
              BoxOS ships its own UEFI loader, <strong>TagBoot</strong>, written in C using the EFIAPI calling
              convention. The loader maps the kernel image, hands off the GOP framebuffer and the ACPI tables,
              and jumps into the kernel entry point in long mode. Boot to first userland program is under
              350 ms on QEMU and under 600 ms on tested real hardware.
            </p>
          </Section>

          <Section id="build" tag="stable" title="Build & run">
            <p>From the project root:</p>
            <CodeBlock language="shell">
{`make clean && make
make run                  # single core
make run CORES=4 MEM=16G  # SMP
`}
            </CodeBlock>
            <p>
              The build assumes a recent <code>x86_64-elf-gcc</code> cross-toolchain and QEMU 7+ for the run
              targets. On Apple Silicon the run target uses TCG; on Linux it auto-detects KVM.
            </p>
          </Section>

          <Section id="source" tag="stable" title="Source layout">
            <p>The kernel tree is small and flat:</p>
            <CodeBlock language="plain">
{`boxos/
├── kernel/        # core: scheduler, vmm, pocket, manifest, deck
├── boxlib/        # userland support library
├── tagboot/       # UEFI loader
├── userland/      # programs: shell, bench, editor
├── tools/         # build helpers, qemu wrappers
└── docs/          # this site's source for prose docs`}
            </CodeBlock>
            <p>
              The forum is the right place for deeper questions; if you find a bug, file it via{" "}
              <Link href="/forum">the forum</Link> or open a thread in the <em>Kernel internals</em> category.
            </p>
          </Section>
        </article>
      </div>
    </section>
  );
}

function Section({ id, title, tag, children }: { id: string; title: string; tag: "stable" | "draft"; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 not-prose">
        <h2 className="!mt-0 !mb-0">{title}</h2>
        <span className={tag === "stable" ? "tag" : "tag tag-brand"}>{tag}</span>
      </div>
      {children}
    </section>
  );
}
