import Link from "next/link";
import { CodeBlock } from "@/components/Code";

export const metadata = { title: "Download" };
export const revalidate = 600;

type GhAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};
type GhRelease = {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  assets: GhAsset[];
};

const REPO = "skripsaha/boxos";

async function getLatestRelease(): Promise<GhRelease | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as GhRelease;
  } catch {
    return null;
  }
}

const DESCRIPTIONS: Record<string, string> = {
  "boxos.iso":   "Bootable CD-ROM image. Use with QEMU or burn to USB.",
  "boxos.img":   "Raw 10 MB disk image. Mount as a virtual hard drive.",
  "BOOTX64.EFI": "UEFI bootloader (TagBoot). Drop on an EFI System Partition.",
  "kernel.bin":  "Flat kernel binary, no ELF header. Loaded by TagBoot.",
  "shell.elf":   "The userspace shell, ELF.",
};

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 10 * 1024 ? 1 : 0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DownloadPage() {
  const release = await getLatestRelease();
  return (
    <article>
      <header className="border-b hairline">
        <div className="container-x py-20 md:py-28">
          <h1 className="display text-[clamp(40px,6vw,76px)] max-w-[16ch]">
            Get the build.
          </h1>
          <p className="prose-body mt-6 max-w-[58ch]">
            BoxOS will publish bootable images, the UEFI loader and the kernel binary
            here as soon as the first release is cut. Until then, the source builds and runs.
          </p>
        </div>
      </header>

      {release ? <ReleaseSection release={release} /> : <NoReleaseYet />}

      <section className="container-narrow pb-20 md:pb-28">
        <h2 className="text-[24px] font-medium tracking-tight mt-2 mb-5">Build from source</h2>
        <p className="prose-body">
          Until a binary release is published, the recommended path is building from the source tree.
        </p>
        <CodeBlock language="shell">
{`git clone https://github.com/${REPO}
cd boxos
make clean && make
make run                  # single core
make run CORES=4 MEM=16G  # SMP test`}
        </CodeBlock>
        <p className="prose-body mt-6 text-sm">
          Toolchain: <code className="font-mono">x86_64-elf-gcc</code> and QEMU 7+.
        </p>

        <h2 className="text-[24px] font-medium tracking-tight mt-14 mb-5">Run it</h2>
        <p className="prose-body">
          Once the build is ready (<code className="font-mono">build/boxos.iso</code> in the repo
          tree), the fastest way to try BoxOS is QEMU:
        </p>
        <CodeBlock language="shell">
{`qemu-system-x86_64 \\
  -cdrom build/boxos.iso \\
  -m 1G \\
  -smp 4 \\
  -display sdl`}
        </CodeBlock>
      </section>
    </article>
  );
}

function NoReleaseYet() {
  return (
    <section className="container-x py-16 md:py-20">
      <div className="surface rounded-[16px] p-8 md:p-12 relative overflow-hidden">
        <div className="hero-mesh" aria-hidden style={{ opacity: 0.45 }} />
        <div className="relative max-w-[60ch]">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color:var(--color-paper-2)] border hairline text-[12px] tabular font-mono text-[color:var(--color-ink-2)]">
            <span className="dot" />
            <span>not released yet</span>
          </span>
          <h2 className="mt-6 text-[28px] md:text-[36px] font-medium tracking-tight leading-[1.15]">
            No public binaries — the kernel is still pre-release.
          </h2>
          <p className="prose-body mt-5 text-[15.5px]">
            BoxOS is in active development. There is no stable build yet, so we deliberately don't
            ship one. When the first tagged release is ready, this page will fetch its assets
            directly from GitHub Releases.
          </p>
          <p className="mt-4 text-xs tabular font-mono text-[color:var(--color-ink-3)]">
            <span className="opacity-70">/* TODO */</span> Replace this section with a real
            release once <code className="font-mono">v0.1.0</code> is cut.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://github.com/${REPO}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Browse the source
            </a>
            <Link href="/changelog" className="btn btn-ghost">See recent commits</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReleaseSection({ release }: { release: GhRelease }) {
  const primary = release.assets.find((a) => a.name === "boxos.iso") ?? release.assets[0];
  const others = release.assets.filter((a) => a !== primary);
  return (
    <>
      <section className="container-x py-16 md:py-20">
        <p className="text-sm tabular font-mono text-[color:var(--color-ink-3)] mb-5">
          Latest: <span className="text-[color:var(--color-ink-2)]">{release.tag_name}</span>
          {" · "}
          <a className="link" href={release.html_url} target="_blank" rel="noreferrer">view on GitHub</a>
        </p>
        {primary && (
          <div className="surface rounded-[16px] p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            <div className="flex-1 min-w-0">
              <h2 className="text-[28px] md:text-[34px] font-medium tracking-tight leading-tight">
                {primary.name}
              </h2>
              <p className="prose-body mt-3 text-[15px] max-w-[56ch]">
                {DESCRIPTIONS[primary.name] ?? "BoxOS build artifact."}
              </p>
              <p className="mt-4 text-xs tabular font-mono text-[color:var(--color-ink-3)]">
                {formatBytes(primary.size)}
              </p>
            </div>
            <a
              href={primary.browser_download_url}
              className="btn btn-primary btn-lg flex-shrink-0"
              download={primary.name}
            >
              Download {primary.name}
            </a>
          </div>
        )}
        {others.length > 0 && (
          <div className="mt-10 surface rounded-[14px] overflow-hidden">
            {others.map((a, idx) => (
              <a
                key={a.name}
                href={a.browser_download_url}
                download={a.name}
                className={`flex items-center justify-between gap-4 px-6 py-5 hover:bg-[color:var(--color-paper-2)] transition-colors ${idx > 0 ? "border-t hairline-2" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[15px] tabular tracking-tight">{a.name}</p>
                  <p className="prose-body mt-1.5 text-sm">{DESCRIPTIONS[a.name] ?? ""}</p>
                </div>
                <span className="text-sm tabular font-mono text-[color:var(--color-ink-2)] flex-shrink-0">{formatBytes(a.size)}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
