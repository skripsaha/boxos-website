import Link from "next/link";
import { CodeBlock } from "@/components/Code";
import { TagFsDiagram } from "@/components/TagFsDiagram";

export const metadata = { title: "Documentation" };

const TOC = [
  ["Overview", "overview"],
  ["Cabin — process", "cabin"],
  ["Pocket — IPC", "pocket"],
  ["Manifest — capabilities", "manifest"],
  ["Deck — storage", "deck"],
  ["TagFS — vs the file tree", "tagfs"],
  ["use — switching context", "use"],
  ["TagBoot — UEFI loader", "boot"],
  ["Build & run", "build"],
  ["Source layout", "source"],
] as const;

export default function DocsPage() {
  return (
    <section>
      <header className="relative overflow-hidden border-b hairline">
        <div className="page-mesh" aria-hidden />
        <div className="page-grid" aria-hidden />
        <div className="container-x relative py-20 md:py-28">
          <h1 className="display text-[clamp(40px,6vw,76px)] max-w-[20ch]">
            The kernel's <em>shape</em>, written down.
          </h1>
          <p className="prose-body mt-6 max-w-[58ch]">
            A living overview, written alongside the kernel. Sections labelled <em>draft</em> are
            in flux; sections labelled <em>stable</em> describe behaviour the kernel will not
            change without notice.
          </p>
        </div>
      </header>

      <div className="container-x py-16 md:py-20 grid lg:grid-cols-12 gap-12 lg:gap-16">
        <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
          <p className="text-[13px] font-medium text-[color:var(--color-ink-2)] mb-4">Contents</p>
          <ul className="space-y-2.5 text-sm">
            {TOC.map(([label, anchor]) => (
              <li key={anchor}>
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
              BoxOS is a 64-bit kernel for x86_64. It does not implement POSIX. There is no
              <code>fork</code>, no signals, no ambient file descriptors, no shared global
              filesystem namespace. Programs interact with the kernel through a chain of named
              operations called the <strong>Manifest</strong>, and with each other through typed
              message channels called <strong>Pockets</strong>.
            </p>
            <p>
              The kernel uses asymmetric multiprocessing. One core runs the scheduler and core
              services; the others run user work. There is no global runqueue and no big lock.
            </p>
            <p>
              Storage is content-addressed and organised through <strong>TagFS</strong>: durable
              persistence is a tag graph, not a directory tree. Programs store and retrieve data
              by description, not by path.
            </p>
          </Section>

          <Section id="cabin" tag="stable" title="Cabin — the process model">
            <p>
              A <strong>Cabin</strong> is a process. Each Cabin owns its own page tables (PML4),
              its own capability table, and its own scheduling shard. Cabins do not share memory,
              signals, or open handles by default.
            </p>
            <p>
              Cabin lifecycle is explicit. There is no <code>fork</code> — every spawn is a fresh
              start with a known entry point and a known capability set. When a Cabin exits, its
              memory and capabilities are reclaimed deterministically.
            </p>
          </Section>

          <Section id="pocket" tag="stable" title="Pocket — message-passing IPC">
            <p>
              A <strong>Pocket</strong> is a typed channel between Cabins, backed by a ring buffer
              that the kernel grows lazily as the conversation needs it. Senders and receivers each
              hold a capability that names a single role: read, write, or peek.
            </p>
            <p>
              Backpressure is observable rather than implicit: a send to a full ring returns an
              error code instead of blocking by default. Closing one end propagates to the other.
              The Pocket fabric — the kernel-side dispatcher of all Pocket traffic — runs on the
              boot core, so message ordering is straightforward to reason about.
            </p>
          </Section>

          <Section id="manifest" tag="stable" title="Manifest — capabilities as data">
            <p>
              Every kernel operation a Cabin can invoke is described as a row in the
              <strong> Manifest</strong>: name, register signature, side-effect descriptor,
              capability requirements. Programs do not invoke kernel operations by number — they
              use the <code>notify</code> mechanism, and <code>boxlib</code> resolves the row at
              link time against the Manifest.
            </p>
            <p>
              Sandboxing is a property of the table, not a permission bit. A Manifest that lists
              no <code>deck.*</code> rows produces a process that <em>literally cannot</em> speak
              to storage — there is no <code>notify</code> for it to send.
            </p>
          </Section>

          <Section id="deck" tag="draft" title="Deck — content-addressed storage">
            <p>
              <strong>Deck</strong> is the persistence layer. The bytes a program stores are
              indexed by their content; the relations between blobs are captured as tags. Two
              programs that store the same bytes share storage; two programs that store visually
              similar but distinct files do not.
            </p>
            <p>
              The on-disk format is called <em>TagFS</em>. Mounting it into a Cabin means binding
              a Deck capability into that Cabin's Manifest — there is no global mount table.
            </p>
          </Section>

          <Section id="tagfs" tag="draft" title="TagFS — vs the file tree">
            <p>
              POSIX organises persistence as a <em>tree</em>: directories nested inside directories,
              each file pinned to one path. TagFS replaces the tree with a small set of on-disk
              tables: a tag registry, a file table, and a metadata pool, all sitting on top of a
              4 KB block layer.
            </p>
            <TagFsDiagram />
            <p>
              Each file table entry carries the file's content hash, its size, the blocks it
              occupies and a list of tag IDs. The tag registry resolves each ID to a name; it has
              512 hash buckets. Identical content is stored once — that's where dedup lives.
            </p>
            <p>
              Below this sit three further submodules in <code>src/kernel/tagfs/</code>:{" "}
              <strong>Braid</strong> (per-block redundancy with three modes — mirror, stripe,
              weave), <strong>CoW</strong> with up to 64 snapshots, and <strong>self-heal</strong>{" "}
              backed by per-block <code>BoxHash</code> checksums.
            </p>
          </Section>

          <Section id="use" tag="draft" title="use — switching context">
            <p>
              The shell's <code>use</code> command sets the active <em>tag context</em> for
              subsequent commands. Each argument is a tag name; calling <code>use</code> with no
              arguments clears the context. The prompt updates to reflect what's currently in
              scope. Source: <code>src/userspace/shell/commands/cmd_use.c</code>.
            </p>
            <CodeBlock language="shell">
{`# set the context to two tags
use kernel notify

# the prompt now shows the active context
# (commands that operate on TagFS use it as a default filter)

# clear the context
use`}
            </CodeBlock>
            <p>
              Up to <code>SHELL_MAX_CONTEXT_TAGS</code> tags can be active at once. The shell
              persists them in <code>ShellState.context_tags</code> and forwards each one to
              <code> context_set()</code>, which the file commands read when they list or open
              entries.
            </p>
          </Section>

          <Section id="boot" tag="stable" title="TagBoot — the UEFI loader">
            <p>
              BoxOS ships its own UEFI loader, <strong>TagBoot</strong>, written in C using the
              <code> EFIAPI </code> calling convention. The loader maps the kernel image, hands
              over the GOP framebuffer and the ACPI tables, and jumps into the kernel entry point
              in long mode. The boot path is one of the few subsystems that prioritises being
              <em> short</em> over being general — it has one job.
            </p>
          </Section>

          <Section id="build" tag="stable" title="Build & run">
            <p>From the project root:</p>
            <CodeBlock language="shell">
{`make clean && make
make run                    # single core
make run CORES=4 MEM=16G    # multi-core test`}
            </CodeBlock>
            <p>
              You'll need a recent <code>x86_64-elf-gcc</code> cross-toolchain and QEMU 7+ for the
              run targets. The <code>tools/</code> directory has wrappers for headless runs and
              automated input.
            </p>
          </Section>

          <Section id="source" tag="stable" title="Source layout">
            <p>The repository is one shallow tree:</p>
            <CodeBlock language="plain">
{`boxos/
├── src/
│   ├── kernel/        # arch/, config/, core/, drivers/, entry/, tagfs/
│   ├── userspace/     # apps/, boxlib/, shell/, utils/, display/
│   └── include/       # shared kernel/userspace ABI headers
├── tools/             # qemu wrappers, build helpers
├── build/             # produced by \`make\` (gitignored)
└── Makefile`}
            </CodeBlock>
            <p>
              Found a bug or have a question that doesn't fit the docs? Open a thread in
              <Link href="/forum"> the forum</Link>, ideally in the
              <em> Kernel internals</em> category.
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
      <div className="flex items-baseline gap-3 not-prose">
        <h2 className="!mt-0 !mb-0">{title}</h2>
        <span className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] uppercase tracking-wider">
          {tag}
        </span>
      </div>
      {children}
    </section>
  );
}
