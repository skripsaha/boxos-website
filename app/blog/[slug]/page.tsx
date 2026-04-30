import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, readingMinutes, renderMarkdown } from "@/lib/markdown";
import type { BlogPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = db()
    .prepare("SELECT title, excerpt FROM blog_posts WHERE slug = ?")
    .get(slug) as { title: string; excerpt: string } | undefined;
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = db()
    .prepare(
      `SELECT p.id, p.slug, p.title, p.excerpt, p.body, p.published_at, u.username AS author_name
       FROM blog_posts p JOIN users u ON u.id = p.author_id
       WHERE p.slug = ?`
    )
    .get(slug) as (Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "body" | "published_at" | "author_name">) | undefined;

  if (!post) notFound();

  const html = renderMarkdown(post.body);
  const reading = readingMinutes(post.body);

  const others = db()
    .prepare(
      `SELECT p.id, p.slug, p.title, p.published_at FROM blog_posts p
       WHERE p.id != ? ORDER BY p.published_at DESC LIMIT 3`
    )
    .all(post.id) as { id: number; slug: string; title: string; published_at: number }[];

  return (
    <article>
      <header className="border-b hairline">
        <div className="container-narrow py-20 md:py-28">
          <Link href="/blog" className="text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)] inline-flex items-center gap-1">
            <span className="text-[color:var(--color-ink-3)]">←</span> All posts
          </Link>
          <p className="eyebrow eyebrow--brand mt-10">Blog</p>
          <h1 className="display text-[clamp(36px,5.6vw,68px)] mt-5">
            {post.title}
          </h1>
          <p className="mt-7 text-sm tabular font-mono text-[color:var(--color-ink-3)]">
            {formatDate(post.published_at)} · by {post.author_name} · {reading} min read
          </p>
        </div>
      </header>

      <div className="container-narrow py-16 md:py-20">
        <div className="article" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {others.length > 0 && (
        <section className="border-t hairline">
          <div className="container-x py-20">
            <p className="eyebrow eyebrow--brand">Read next</p>
            <ul className="mt-8 grid md:grid-cols-3 gap-6">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/blog/${o.slug}`} className="card p-6 group block h-full">
                    <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">{formatDate(o.published_at)}</p>
                    <p className="mt-3 text-[17px] font-medium tracking-tight group-hover:text-[color:var(--color-brand-deep)] transition-colors">
                      {o.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
