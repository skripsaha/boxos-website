import Link from "next/link";
import { notFound } from "next/navigation";
import { one, many } from "@/lib/db";
import { formatDate, renderMarkdown, timeAgo } from "@/lib/markdown";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/RankBadge";
import { ReplyForm } from "./reply";

export const dynamic = "force-dynamic";

type ThreadRow = {
  id: number;
  title: string;
  created_at: number;
  category_id: number;
  category_slug: string;
  category_name: string;
  author_name: string;
};

type PostRow = {
  id: number;
  body: string;
  created_at: number;
  author_name: string;
  author_id: number;
  author_avatar: string | null;
  author_created: number;
  author_admin: 0 | 1;
  author_custom_rank: string | null;
  author_banned_at: number | null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await one<{ title: string }>("SELECT title FROM forum_threads WHERE id = ?", [Number(id)]);
  return { title: t ? t.title : "Thread" };
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tid = Number(id);
  if (!Number.isFinite(tid)) notFound();

  const thread = await one<ThreadRow>(
    `SELECT t.id, t.title, t.created_at, t.category_id,
            c.slug AS category_slug, c.name AS category_name,
            u.username AS author_name
     FROM forum_threads t
     JOIN forum_categories c ON c.id = t.category_id
     JOIN users u ON u.id = t.author_id
     WHERE t.id = ?`,
    [tid]
  );
  if (!thread) notFound();

  const posts = await many<PostRow>(
    `SELECT p.id, p.body, p.created_at, p.author_id,
            u.username AS author_name, u.avatar_data AS author_avatar,
            u.created_at AS author_created, u.is_admin AS author_admin,
            u.custom_rank AS author_custom_rank, u.banned_at AS author_banned_at
     FROM forum_posts p JOIN users u ON u.id = p.author_id
     WHERE p.thread_id = ? ORDER BY p.created_at ASC`,
    [tid]
  );

  const me = await getCurrentUser();

  return (
    <section className="container-narrow py-16 md:py-24">
      <nav className="text-sm text-[color:var(--color-ink-2)] flex items-center gap-2 flex-wrap">
        <Link href="/forum" className="hover:text-[color:var(--color-ink)]">Forum</Link>
        <span className="text-[color:var(--color-ink-4)]">/</span>
        <Link href={`/forum/c/${thread.category_slug}`} className="hover:text-[color:var(--color-ink)]">
          {thread.category_name}
        </Link>
      </nav>

      <h1 className="display text-[clamp(28px,4.4vw,48px)] mt-6 leading-[1.1]">
        {thread.title}
      </h1>
      <p className="mt-5 text-sm tabular font-mono text-[color:var(--color-ink-3)]">
        opened {formatDate(thread.created_at)} by {thread.author_name} · {posts.length} {posts.length === 1 ? "post" : "posts"}
      </p>

      <ol className="mt-12 space-y-10">
        {posts.map((p, idx) => (
          <li key={p.id} className="flex gap-4 md:gap-6">
            <Link href={`/u/${p.author_name}`} className="flex-shrink-0">
              <Avatar username={p.author_name} avatarData={p.author_avatar} size={40} />
            </Link>
            <article className="flex-1 min-w-0">
              <header className="flex items-baseline justify-between gap-3 mb-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <Link href={`/u/${p.author_name}`} className="text-[15px] font-medium tracking-tight">{p.author_name}</Link>
                  <RankBadge createdAt={p.author_created} isAdmin={p.author_admin} customRank={p.author_custom_rank} bannedAt={p.author_banned_at} size="xs" />
                  {idx === 0 && <span className="text-[11px] tabular font-mono text-[color:var(--color-brand-deep)]">op</span>}
                </div>
                <span className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)]">
                  {timeAgo(p.created_at)}
                </span>
              </header>
              <div className="article" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
            </article>
          </li>
        ))}
      </ol>

      <div className="mt-20 pt-12 border-t hairline">
        {me ? (
          <ReplyForm threadId={tid} />
        ) : (
          <div className="surface rounded-[12px] p-8 text-center">
            <p className="prose-body">
              <Link href="/login" className="link text-[color:var(--color-ink)] font-medium">Sign in</Link>{" "}
              or{" "}
              <Link href="/register" className="link text-[color:var(--color-ink)] font-medium">create an account</Link>{" "}
              to reply.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
