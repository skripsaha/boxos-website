import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = db().prepare("SELECT name FROM forum_categories WHERE slug = ?").get(category) as { name: string } | undefined;
  return { title: c ? c.name : "Category" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = db().prepare("SELECT id, slug, name, description FROM forum_categories WHERE slug = ?").get(category) as
    | { id: number; slug: string; name: string; description: string }
    | undefined;
  if (!cat) notFound();

  const threads = db().prepare(`
    SELECT t.id, t.title, t.created_at, t.last_post_at,
           u.username AS author_name,
           (SELECT COUNT(*) FROM forum_posts WHERE thread_id = t.id) AS post_count,
           (SELECT u2.username FROM forum_posts p JOIN users u2 ON u2.id = p.author_id WHERE p.thread_id = t.id ORDER BY p.created_at DESC LIMIT 1) AS last_author
    FROM forum_threads t JOIN users u ON u.id = t.author_id
    WHERE t.category_id = ?
    ORDER BY t.last_post_at DESC
  `).all(cat.id) as { id: number; title: string; created_at: number; last_post_at: number; author_name: string; post_count: number; last_author: string | null }[];

  return (
    <section className="container-x py-20 md:py-28">
      <Link href="/forum" className="text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)] inline-flex items-center gap-1">
        <span className="text-[color:var(--color-ink-3)]">←</span> Forum
      </Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow eyebrow--brand">Category</p>
          <h1 className="display text-[clamp(34px,5vw,60px)] mt-3">{cat.name}</h1>
          <p className="prose-body mt-4 max-w-[58ch]">{cat.description}</p>
        </div>
        <Link href={`/forum/new?cat=${cat.slug}`} className="btn btn-primary">New thread</Link>
      </div>

      <div className="mt-14 surface rounded-[14px] overflow-hidden">
        {threads.length === 0 ? (
          <div className="p-10 text-center">
            <p className="prose-body">No threads in this category yet.</p>
            <Link href={`/forum/new?cat=${cat.slug}`} className="btn btn-primary mt-6">Start a thread</Link>
          </div>
        ) : (
          <>
            <header className="hidden md:grid grid-cols-12 px-6 py-3 text-[11px] tabular font-mono uppercase tracking-[0.14em] text-[color:var(--color-ink-3)] border-b hairline-2">
              <span className="col-span-7">Thread</span>
              <span className="col-span-2 text-right">Posts</span>
              <span className="col-span-3">Last reply</span>
            </header>
            {threads.map((t, idx) => (
              <Link
                key={t.id}
                href={`/forum/t/${t.id}`}
                className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-6 py-5 hover:bg-[color:var(--color-paper-2)] transition-colors ${idx > 0 ? "border-t hairline-2" : ""}`}
              >
                <div className="md:col-span-7 min-w-0">
                  <p className="text-[16px] font-medium tracking-tight truncate">{t.title}</p>
                  <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1.5">
                    started {timeAgo(t.created_at)} by {t.author_name}
                  </p>
                </div>
                <div className="md:col-span-2 md:text-right">
                  <p className="text-[18px] font-medium tabular">{t.post_count}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-2)]">
                    {timeAgo(t.last_post_at)}
                  </p>
                  <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">
                    {t.last_author ?? t.author_name}
                  </p>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
