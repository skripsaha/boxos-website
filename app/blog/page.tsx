import Link from "next/link";
import { many } from "@/lib/db";
import { formatDate, readingMinutes } from "@/lib/markdown";
import { getCurrentUser } from "@/lib/auth";
import type { BlogPost } from "@/lib/types";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function BlogIndex() {
  const user = await getCurrentUser();
  const rows = await many<Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "body" | "published_at" | "author_name">>(
    `SELECT p.id, p.slug, p.title, p.excerpt, p.body, p.published_at, u.username AS author_name
     FROM blog_posts p JOIN users u ON u.id = p.author_id
     ORDER BY p.published_at DESC`
  );

  const posts = rows.map((r) => ({ ...r, reading: readingMinutes(r.body) }));
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <section className="relative">
      <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none">
        <div className="page-mesh" />
        <div className="page-grid" />
      </div>
      <div className="container-x relative py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display text-[clamp(40px,6vw,76px)]">
            Notes from the <em>kernel</em>.
          </h1>
          <p className="prose-body mt-5 max-w-[58ch]">
            Design decisions, post-mortems, weeknotes on building BoxOS in the open.
          </p>
        </div>
        {user?.is_admin ? (
          <Link href="/blog/new" className="btn btn-primary">Write a post</Link>
        ) : null}
      </div>

      {!featured ? (
        <div className="mt-16 surface rounded-[14px] p-10 text-center">
          <p className="prose-body">No posts yet.</p>
        </div>
      ) : (
        <>
          <Link
            href={`/blog/${featured.slug}`}
            className="mt-16 grid lg:grid-cols-12 gap-8 lg:gap-12 group border-b hairline pb-16"
          >
            <div className="lg:col-span-5">
              <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">
                {formatDate(featured.published_at)} · {featured.author_name} · {featured.reading} min read
              </p>
            </div>
            <div className="lg:col-span-7">
              <h2 className="display text-[clamp(28px,4.4vw,52px)] tracking-tight group-hover:text-[color:var(--color-brand-deep)] transition-colors">
                {featured.title}
              </h2>
              <p className="prose-body mt-6 max-w-[60ch]">{featured.excerpt}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium">
                Continue reading <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </Link>

          {rest.length > 0 && (
            <ul className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((p) => (
                <li key={p.id}>
                  <Link href={`/blog/${p.slug}`} className="card p-7 group h-full">
                    <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">
                      {formatDate(p.published_at)} · {p.reading} min
                    </p>
                    <h3 className="mt-4 text-[20px] font-medium tracking-tight leading-snug group-hover:text-[color:var(--color-brand-deep)] transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-sm text-[color:var(--color-ink-2)] line-clamp-3">{p.excerpt}</p>
                    <p className="mt-6 text-xs tabular font-mono text-[color:var(--color-ink-3)]">{p.author_name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      </div>
    </section>
  );
}
