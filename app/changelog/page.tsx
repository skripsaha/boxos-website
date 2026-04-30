import Link from "next/link";

export const metadata = { title: "Changelog" };
export const revalidate = 300;

type GhCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
};
type GhRelease = {
  id: number;
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
  body: string;
  prerelease: boolean;
  draft: boolean;
};

const REPO = "skripsaha/boxos";
const COMMITS_PER_PAGE = 50;

async function getCommits(): Promise<GhCommit[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/commits?per_page=${COMMITS_PER_PAGE}`,
      { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return (await res.json()) as GhCommit[];
  } catch {
    return [];
  }
}

async function getReleases(): Promise<GhRelease[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return ((await res.json()) as GhRelease[]).filter((r) => !r.draft);
  } catch {
    return [];
  }
}

function splitMessage(msg: string): { subject: string; body: string } {
  const idx = msg.indexOf("\n");
  if (idx < 0) return { subject: msg.trim(), body: "" };
  return { subject: msg.slice(0, idx).trim(), body: msg.slice(idx).trim() };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function ChangelogPage() {
  const [releases, commits] = await Promise.all([getReleases(), getCommits()]);

  return (
    <article>
      <header className="relative overflow-hidden border-b hairline">
        <div className="page-mesh" aria-hidden />
        <div className="page-grid" aria-hidden />
        <div className="container-x relative py-20 md:py-28">
          <h1 className="display text-[clamp(40px,6vw,76px)] max-w-[16ch]">
            What <em>shipped</em>, when.
          </h1>
          <p className="prose-body mt-6 max-w-[58ch]">
            The kernel's history, fetched live from{" "}
            <a className="link" href={`https://github.com/${REPO}`} target="_blank" rel="noreferrer">
              github.com/{REPO}
            </a>
            . Tagged releases sit at the top; the full commit log follows.
          </p>
        </div>
      </header>

      <section className="container-narrow py-16 md:py-20">
        <h2 className="text-[22px] font-medium tracking-tight mb-6">Releases</h2>
        {releases.length === 0 ? (
          <div className="surface rounded-[12px] px-6 py-7 text-center">
            <p className="text-sm text-[color:var(--color-ink-2)]">
              No tagged releases yet. The first one will land here automatically.
            </p>
          </div>
        ) : (
          <ol className="surface rounded-[14px] overflow-hidden">
            {releases.map((r, idx) => (
              <li key={r.id} className={idx > 0 ? "border-t hairline-2" : ""}>
                <a href={r.html_url} target="_blank" rel="noreferrer" className="block px-6 py-5 hover:bg-[color:var(--color-paper-2)] transition-colors">
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <span className="text-[16px] font-medium tracking-tight">
                      {r.name && r.name.length > 0 ? r.name : r.tag_name}
                    </span>
                    <span className="font-mono text-[11px] tabular text-[color:var(--color-ink-3)]">
                      {formatDate(r.published_at)}
                      {r.prerelease ? " · pre-release" : ""}
                    </span>
                  </div>
                  <p className="font-mono text-[12px] tabular text-[color:var(--color-ink-3)]">{r.tag_name}</p>
                  {r.body && (
                    <p className="prose-body mt-3 text-[13.5px] leading-relaxed line-clamp-4 whitespace-pre-line">
                      {r.body}
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ol>
        )}

        <h2 className="text-[22px] font-medium tracking-tight mt-16 mb-6">Commits</h2>
        {commits.length === 0 ? (
          <div className="surface rounded-[12px] px-6 py-7 text-center">
            <p className="text-sm text-[color:var(--color-ink-2)]">Couldn't reach GitHub right now.</p>
          </div>
        ) : (
          <ol className="surface rounded-[14px] overflow-hidden">
            {commits.map((c, idx) => {
              const { subject, body } = splitMessage(c.commit.message);
              return (
                <li key={c.sha} className={idx > 0 ? "border-t hairline-2" : ""}>
                  <a href={c.html_url} target="_blank" rel="noreferrer" className="block px-6 py-5 hover:bg-[color:var(--color-paper-2)] transition-colors">
                    <div className="flex items-baseline justify-between gap-4 mb-2">
                      <span className="font-mono text-[11px] tabular text-[color:var(--color-ink-3)]">
                        {c.sha.slice(0, 7)}
                      </span>
                      <span className="font-mono text-[11px] tabular text-[color:var(--color-ink-3)]">
                        {formatDate(c.commit.author.date)} · {c.commit.author.name}
                      </span>
                    </div>
                    <p className="text-[15.5px] font-medium tracking-tight leading-snug">{subject}</p>
                    {body && (
                      <p className="prose-body mt-2 text-[13.5px] leading-relaxed line-clamp-3 whitespace-pre-line">
                        {body}
                      </p>
                    )}
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </article>
  );
}
