import Link from "next/link";
import { notFound } from "next/navigation";
import { one, many } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/RankBadge";
import { formatDate, timeAgo } from "@/lib/markdown";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const me = await getCurrentUser();
  const u = await one<{
    id: number; username: string; created_at: number; bio: string | null;
    is_admin: 0 | 1; avatar_data: string | null; custom_rank: string | null; banned_at: number | null;
  }>(
    "SELECT id, username, created_at, bio, is_admin, avatar_data, custom_rank, banned_at FROM users WHERE username = ?",
    [username]
  );
  if (!u) notFound();

  const [posts, threads, replies, postCount] = await Promise.all([
    many<{ id: number; slug: string; title: string; published_at: number }>(
      "SELECT id, slug, title, published_at FROM blog_posts WHERE author_id = ? ORDER BY published_at DESC LIMIT 30",
      [u.id]
    ),
    many<{ id: number; title: string; last_post_at: number; category_name: string }>(
      `SELECT t.id, t.title, t.last_post_at, c.name AS category_name
       FROM forum_threads t JOIN forum_categories c ON c.id = t.category_id
       WHERE t.author_id = ? ORDER BY t.created_at DESC LIMIT 30`,
      [u.id]
    ),
    many<{ id: number; body: string; created_at: number; thread_id: number; thread_title: string }>(
      `SELECT p.id, p.body, p.created_at, t.id AS thread_id, t.title AS thread_title
       FROM forum_posts p JOIN forum_threads t ON t.id = p.thread_id
       WHERE p.author_id = ? ORDER BY p.created_at DESC LIMIT 30`,
      [u.id]
    ),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM forum_posts WHERE author_id = ?", [u.id]),
  ]);

  const isOwner = me?.id === u.id;
  const totalActivity = posts.length + threads.length + Number(postCount?.n ?? 0);

  return (
    <section className="relative">
      <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden pointer-events-none">
        <div className="page-mesh" />
        <div className="page-grid" />
      </div>
      <div className="container-x relative py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end gap-7 md:gap-10">
          <Avatar username={u.username} avatarData={u.avatar_data} size={112} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="display text-[clamp(34px,5vw,56px)] tracking-tight leading-none">
                {u.username}
              </h1>
              <RankBadge createdAt={u.created_at} isAdmin={u.is_admin} customRank={u.custom_rank} bannedAt={u.banned_at} />
            </div>
            <p className="mt-4 text-sm tabular font-mono text-[color:var(--color-ink-3)]">
              joined {formatDate(u.created_at)} · {totalActivity} {totalActivity === 1 ? "contribution" : "contributions"}
            </p>
            {u.bio && <p className="prose-body mt-4 max-w-[60ch]">{u.bio}</p>}
            {u.banned_at ? (
              <p className="mt-4 text-sm text-[color:var(--color-danger)]">This account is currently banned.</p>
            ) : null}
          </div>
          {isOwner && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link href="/account/avatar" className="btn btn-primary">Edit avatar</Link>
              <Link href="/account" className="btn btn-ghost">Account settings</Link>
            </div>
          )}
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-[18px] font-medium tracking-tight">Threads</h2>
            {threads.length === 0 ? (
              <p className="prose-body mt-5 text-sm">No threads yet.</p>
            ) : (
              <ul className="mt-5 surface rounded-[12px] divide-y divide-[color:var(--color-line-2)]">
                {threads.map((t) => (
                  <li key={t.id} className="px-5 py-4">
                    <Link href={`/forum/t/${t.id}`} className="block">
                      <p className="text-[15px] font-medium tracking-tight">{t.title}</p>
                      <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)] mt-1.5">
                        {t.category_name} · {timeAgo(t.last_post_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-[18px] font-medium tracking-tight">Replies</h2>
            {replies.length === 0 ? (
              <p className="prose-body mt-5 text-sm">No replies yet.</p>
            ) : (
              <ul className="mt-5 surface rounded-[12px] divide-y divide-[color:var(--color-line-2)]">
                {replies.map((p) => (
                  <li key={p.id} className="px-5 py-4">
                    <Link href={`/forum/t/${p.thread_id}`} className="block">
                      <p className="text-[15px] font-medium tracking-tight truncate">{p.thread_title}</p>
                      <p className="text-sm text-[color:var(--color-ink-2)] mt-1.5 line-clamp-2">{p.body}</p>
                      <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)] mt-2">{timeAgo(p.created_at)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {posts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-[18px] font-medium tracking-tight">Blog posts</h2>
            <ul className="mt-5 grid md:grid-cols-2 gap-5">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/blog/${p.slug}`} className="card p-6 group block h-full">
                    <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">{formatDate(p.published_at)}</p>
                    <p className="mt-3 text-[17px] font-medium tracking-tight group-hover:text-[color:var(--color-brand-deep)] transition-colors">{p.title}</p>
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
