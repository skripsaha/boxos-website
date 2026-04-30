import Link from "next/link";
import { many } from "@/lib/db";
import { timeAgo } from "@/lib/markdown";

export const metadata = { title: "Forum" };
export const dynamic = "force-dynamic";

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  thread_count: number;
  post_count: number;
  last_thread_id: number | null;
  last_thread_title: string | null;
  last_post_at: number | null;
  last_author: string | null;
};

export default async function ForumIndex() {
  const cats = await many<CategoryRow>(`
    SELECT
      c.id, c.slug, c.name, c.description,
      (SELECT COUNT(*) FROM forum_threads WHERE category_id = c.id) AS thread_count,
      (SELECT COUNT(*) FROM forum_posts p JOIN forum_threads t ON t.id = p.thread_id WHERE t.category_id = c.id) AS post_count,
      (SELECT id FROM forum_threads WHERE category_id = c.id ORDER BY last_post_at DESC LIMIT 1) AS last_thread_id,
      (SELECT title FROM forum_threads WHERE category_id = c.id ORDER BY last_post_at DESC LIMIT 1) AS last_thread_title,
      (SELECT last_post_at FROM forum_threads WHERE category_id = c.id ORDER BY last_post_at DESC LIMIT 1) AS last_post_at,
      (SELECT u.username FROM forum_threads t JOIN users u ON u.id = t.author_id WHERE t.category_id = c.id ORDER BY t.last_post_at DESC LIMIT 1) AS last_author
    FROM forum_categories c
    ORDER BY c.position ASC
  `);

  const recent = await many<{ id: number; title: string; last_post_at: number; category_name: string; category_slug: string; author_name: string; post_count: number }>(`
    SELECT t.id, t.title, t.last_post_at, c.name AS category_name, c.slug AS category_slug, u.username AS author_name,
           (SELECT COUNT(*) FROM forum_posts WHERE thread_id = t.id) AS post_count
    FROM forum_threads t JOIN forum_categories c ON c.id = t.category_id JOIN users u ON u.id = t.author_id
    ORDER BY t.last_post_at DESC LIMIT 8
  `);

  return (
    <section className="relative">
      <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden pointer-events-none">
        <div className="page-mesh" />
        <div className="page-grid" />
      </div>
      <div className="container-x relative py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display text-[clamp(40px,6vw,76px)]">
            The <em>forum</em>.
          </h1>
          <p className="prose-body mt-5 max-w-[58ch]">
            Discuss design, report bugs, share patches, ask questions. The slow-tempo channel —
            long-form replies are welcome here.
          </p>
        </div>
        <Link href="/forum/new" className="btn btn-primary">New thread</Link>
      </div>

      <div className="mt-14 surface rounded-[14px] overflow-hidden">
        <header className="hidden md:grid grid-cols-12 px-6 py-3 text-[12px] text-[color:var(--color-ink-3)] border-b hairline-2">
          <span className="col-span-7">Category</span>
          <span className="col-span-2 text-right">Threads</span>
          <span className="col-span-3">Latest</span>
        </header>
        {cats.map((c, idx) => (
          <Link
            key={c.id}
            href={`/forum/c/${c.slug}`}
            className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-6 py-6 hover:bg-[color:var(--color-paper-2)] transition-colors ${idx > 0 ? "border-t hairline-2" : ""}`}
          >
            <div className="md:col-span-7">
              <p className="text-[18px] font-medium tracking-tight">{c.name}</p>
              <p className="text-sm text-[color:var(--color-ink-2)] mt-1.5 max-w-[60ch]">{c.description}</p>
            </div>
            <div className="md:col-span-2 md:text-right">
              <p className="text-[20px] font-medium tabular leading-none">{c.thread_count}</p>
              <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">{c.post_count} posts</p>
            </div>
            <div className="md:col-span-3">
              {c.last_thread_id ? (
                <>
                  <p className="text-sm font-medium truncate">{c.last_thread_title}</p>
                  <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">
                    {timeAgo(c.last_post_at!)} · {c.last_author}
                  </p>
                </>
              ) : (
                <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)]">No threads yet</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {recent.length > 0 && (
        <div id="recent" className="mt-20">
          <h2 className="text-[20px] font-medium tracking-tight mb-6">Recently active</h2>
          <ul className="surface rounded-[14px] overflow-hidden">
            {recent.map((t, idx) => (
              <li key={t.id} className={idx > 0 ? "border-t hairline-2" : ""}>
                <Link href={`/forum/t/${t.id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-[color:var(--color-paper-2)] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="tag">{t.category_name}</span>
                      <span className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)]">
                        {timeAgo(t.last_post_at)} · {t.author_name}
                      </span>
                    </div>
                    <p className="mt-2 text-[15px] font-medium tracking-tight truncate">{t.title}</p>
                  </div>
                  <span className="text-sm tabular text-[color:var(--color-ink-2)] flex-shrink-0">{t.post_count} posts</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </section>
  );
}
