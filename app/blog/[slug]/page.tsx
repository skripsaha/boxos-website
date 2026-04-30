import Link from "next/link";
import { notFound } from "next/navigation";
import { one, many } from "@/lib/db";
import { formatDate, readingMinutes, renderMarkdown, timeAgo } from "@/lib/markdown";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/RankBadge";
import { Reactions } from "@/components/Reactions";
import { CommentForm } from "@/components/CommentForm";
import { getCurrentUser } from "@/lib/auth";
import type { BlogPost } from "@/lib/types";

export const dynamic = "force-dynamic";

const REACTION_KINDS = ["agree", "interesting", "filed", "running"] as const;
type Kind = typeof REACTION_KINDS[number];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await one<{ title: string; excerpt: string }>(
    "SELECT title, excerpt FROM blog_posts WHERE slug = ?",
    [slug]
  );
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const me = await getCurrentUser();
  const post = await one<Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "body" | "published_at" | "author_name"> & {
    author_id: number; author_avatar: string | null; author_created: number;
    author_admin: 0 | 1; author_custom_rank: string | null; author_banned_at: number | null;
  }>(
    `SELECT p.id, p.slug, p.title, p.excerpt, p.body, p.published_at,
            u.id AS author_id, u.username AS author_name, u.avatar_data AS author_avatar,
            u.created_at AS author_created, u.is_admin AS author_admin,
            u.custom_rank AS author_custom_rank, u.banned_at AS author_banned_at
     FROM blog_posts p JOIN users u ON u.id = p.author_id
     WHERE p.slug = ?`,
    [slug]
  );

  if (!post) notFound();

  const html = renderMarkdown(post.body);
  const reading = readingMinutes(post.body);

  const [others, reactions, myReactions, comments] = await Promise.all([
    many<{ id: number; slug: string; title: string; published_at: number }>(
      `SELECT p.id, p.slug, p.title, p.published_at FROM blog_posts p
       WHERE p.id != ? ORDER BY p.published_at DESC LIMIT 3`,
      [post.id]
    ),
    many<{ kind: string; n: number }>(
      "SELECT kind, COUNT(*) AS n FROM blog_reactions WHERE post_id = ? GROUP BY kind",
      [post.id]
    ),
    me ? many<{ kind: string }>(
      "SELECT kind FROM blog_reactions WHERE post_id = ? AND user_id = ?",
      [post.id, me.id]
    ) : Promise.resolve([]),
    many<{
      id: number; body: string; created_at: number;
      author_id: number; author_name: string; author_avatar: string | null;
      author_created: number; author_admin: 0 | 1;
      author_custom_rank: string | null; author_banned_at: number | null;
    }>(
      `SELECT c.id, c.body, c.created_at,
              u.id AS author_id, u.username AS author_name, u.avatar_data AS author_avatar,
              u.created_at AS author_created, u.is_admin AS author_admin,
              u.custom_rank AS author_custom_rank, u.banned_at AS author_banned_at
       FROM blog_comments c JOIN users u ON u.id = c.author_id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      [post.id]
    ),
  ]);

  const counts: Record<Kind, number> = { agree: 0, interesting: 0, filed: 0, running: 0 };
  for (const r of reactions) {
    if ((REACTION_KINDS as ReadonlyArray<string>).includes(r.kind)) counts[r.kind as Kind] = Number(r.n);
  }
  const myActive = myReactions.map((r) => r.kind).filter((k): k is Kind => (REACTION_KINDS as ReadonlyArray<string>).includes(k));

  return (
    <article>
      <header className="relative overflow-hidden border-b hairline">
        <div className="page-mesh" aria-hidden />
        <div className="page-grid" aria-hidden />
        <div className="container-narrow relative py-20 md:py-28">
          <Link href="/blog" className="text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)] inline-flex items-center gap-1">
            <span className="text-[color:var(--color-ink-3)]">←</span> All posts
          </Link>
          <h1 className="display text-[clamp(36px,5.6vw,68px)] mt-10">{post.title}</h1>
          <div className="mt-8 flex items-center gap-4">
            <Link href={`/u/${post.author_name}`} className="flex-shrink-0">
              <Avatar username={post.author_name} avatarData={post.author_avatar} size={42} />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/u/${post.author_name}`} className="text-[15px] font-medium tracking-tight">{post.author_name}</Link>
                <RankBadge createdAt={post.author_created} isAdmin={post.author_admin} customRank={post.author_custom_rank} bannedAt={post.author_banned_at} size="xs" />
              </div>
              <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)] mt-1">
                {formatDate(post.published_at)} · {reading} min read
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-narrow py-16 md:py-20">
        <div className="article" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="mt-14 pt-10 border-t hairline">
          <p className="text-[14px] font-medium text-[color:var(--color-ink-2)] mb-4">Reactions</p>
          <Reactions postId={post.id} initialCounts={counts} initialActive={myActive} signedIn={!!me} />
        </div>

        <div className="mt-16 pt-10 border-t hairline">
          <h2 className="text-[20px] font-medium tracking-tight mb-6">
            Comments <span className="text-[color:var(--color-ink-3)] font-mono text-[14px] tabular">({comments.length})</span>
          </h2>
          {comments.length === 0 ? (
            <p className="prose-body text-sm">No comments yet.</p>
          ) : (
            <ol className="space-y-8">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-4">
                  <Link href={`/u/${c.author_name}`} className="flex-shrink-0">
                    <Avatar username={c.author_name} avatarData={c.author_avatar} size={36} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-2">
                      <Link href={`/u/${c.author_name}`} className="text-[14px] font-medium tracking-tight">{c.author_name}</Link>
                      <RankBadge createdAt={c.author_created} isAdmin={c.author_admin} customRank={c.author_custom_rank} bannedAt={c.author_banned_at} size="xs" />
                      <span className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] ml-auto">{timeAgo(c.created_at)}</span>
                    </div>
                    <div className="article" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-10">
            {me ? (
              <CommentForm postId={post.id} />
            ) : (
              <div className="surface rounded-[12px] p-6 text-center">
                <p className="prose-body text-sm">
                  <Link href="/login" className="link text-[color:var(--color-ink)] font-medium">Sign in</Link> to leave a comment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section className="border-t hairline">
          <div className="container-x py-20">
            <p className="text-[13px] font-medium text-[color:var(--color-ink-2)] mb-7">Read next</p>
            <ul className="grid md:grid-cols-3 gap-6">
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
