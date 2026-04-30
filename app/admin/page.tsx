import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { many } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/RankBadge";
import { rankFor, RANKS_LIST } from "@/lib/ranks";
import { formatDate, timeAgo } from "@/lib/markdown";
import { UserActions } from "./user-actions";
import { ContentActions } from "./content-actions";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.is_admin) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="display text-[clamp(28px,4vw,40px)]">Forbidden.</h1>
        <p className="prose-body mt-4">This page is admin-only.</p>
      </section>
    );
  }

  const [users, posts, threads, hof, gallery] = await Promise.all([
    many<{
      id: number; username: string; created_at: number; is_admin: 0 | 1;
      avatar_data: string | null; custom_rank: string | null; banned_at: number | null;
      thread_count: number; post_count: number;
    }>(`
      SELECT u.id, u.username, u.created_at, u.is_admin, u.avatar_data, u.custom_rank, u.banned_at,
             (SELECT COUNT(*) FROM forum_threads WHERE author_id = u.id) AS thread_count,
             (SELECT COUNT(*) FROM forum_posts   WHERE author_id = u.id) AS post_count
      FROM users u ORDER BY u.created_at DESC LIMIT 200
    `),
    many<{ id: number; slug: string; title: string; published_at: number; author_name: string }>(`
      SELECT p.id, p.slug, p.title, p.published_at, u.username AS author_name
      FROM blog_posts p JOIN users u ON u.id = p.author_id
      ORDER BY p.published_at DESC LIMIT 50
    `),
    many<{ id: number; title: string; created_at: number; category_name: string; author_name: string }>(`
      SELECT t.id, t.title, t.created_at, c.name AS category_name, u.username AS author_name
      FROM forum_threads t JOIN forum_categories c ON c.id = t.category_id JOIN users u ON u.id = t.author_id
      ORDER BY t.created_at DESC LIMIT 50
    `),
    many<{ id: number; title: string; occurred_at: number }>(`
      SELECT id, title, occurred_at FROM hof_moments ORDER BY occurred_at DESC LIMIT 30
    `),
    many<{ id: number; title: string; created_at: number }>(`
      SELECT id, title, created_at FROM gallery_items ORDER BY created_at DESC LIMIT 30
    `),
  ]);

  return (
    <article>
      <header className="relative overflow-hidden border-b hairline">
        <div className="page-mesh" aria-hidden />
        <div className="page-grid" aria-hidden />
        <div className="container-x relative py-16 md:py-20">
          <h1 className="display text-[clamp(40px,6vw,76px)]">
            Admin <em>panel</em>.
          </h1>
          <p className="prose-body mt-5 max-w-[58ch]">
            Total control. Ban users, override ranks, prune content, manage the Hall of Fame.
          </p>
        </div>
      </header>

      <div className="container-x py-12 md:py-16">
        <div className="flex items-center gap-4 mb-10">
          <p className="text-[20px] font-medium tracking-tight">Users</p>
          <span className="text-sm tabular text-[color:var(--color-ink-3)] font-mono">{users.length}</span>
        </div>

        <ul className="surface rounded-[14px] overflow-hidden">
          {users.map((u, idx) => {
            const r = rankFor({ createdAt: u.created_at, isAdmin: !!u.is_admin, customRank: u.custom_rank, bannedAt: u.banned_at });
            return (
              <li key={u.id} className={idx > 0 ? "border-t hairline-2" : ""}>
                <div className="grid md:grid-cols-12 gap-4 items-center px-5 py-5">
                  <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                    <Avatar username={u.username} avatarData={u.avatar_data} size={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/u/${u.username}`} className="text-[15px] font-medium tracking-tight truncate">
                          {u.username}
                        </Link>
                        <RankBadge createdAt={u.created_at} isAdmin={u.is_admin} customRank={u.custom_rank} bannedAt={u.banned_at} size="xs" />
                      </div>
                      <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">
                        joined {formatDate(u.created_at)} · {u.thread_count} threads · {u.post_count} replies
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-7 flex flex-wrap items-center gap-2 justify-end">
                    {u.id === me.id ? (
                      <span className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)]">that's you</span>
                    ) : (
                      <UserActions userId={u.id} username={u.username} banned={!!u.banned_at} currentRank={r} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="grid lg:grid-cols-2 gap-10 mt-16">
          <section>
            <p className="text-[20px] font-medium tracking-tight mb-6">Recent blog posts</p>
            {posts.length === 0 ? (
              <p className="prose-body text-sm">None yet.</p>
            ) : (
              <ul className="surface rounded-[14px] overflow-hidden">
                {posts.map((p, idx) => (
                  <li key={p.id} className={idx > 0 ? "border-t hairline-2" : ""}>
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/blog/${p.slug}`} className="text-[14px] font-medium tracking-tight truncate block">{p.title}</Link>
                        <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">
                          {formatDate(p.published_at)} · {p.author_name}
                        </p>
                      </div>
                      <ContentActions kind="blog" id={p.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <p className="text-[20px] font-medium tracking-tight mb-6">Recent threads</p>
            {threads.length === 0 ? (
              <p className="prose-body text-sm">None yet.</p>
            ) : (
              <ul className="surface rounded-[14px] overflow-hidden">
                {threads.map((t, idx) => (
                  <li key={t.id} className={idx > 0 ? "border-t hairline-2" : ""}>
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/forum/t/${t.id}`} className="text-[14px] font-medium tracking-tight truncate block">{t.title}</Link>
                        <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">
                          {t.category_name} · {timeAgo(t.created_at)} · {t.author_name}
                        </p>
                      </div>
                      <ContentActions kind="thread" id={t.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[20px] font-medium tracking-tight">Hall of Fame</p>
            <Link href="/hof/new" className="btn btn-primary">Add moment</Link>
          </div>
          {hof.length === 0 ? (
            <p className="prose-body text-sm">No moments yet — start the timeline.</p>
          ) : (
            <ul className="surface rounded-[14px] overflow-hidden">
              {hof.map((m, idx) => (
                <li key={m.id} className={idx > 0 ? "border-t hairline-2" : ""}>
                  <div className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <Link href="/hof" className="text-[14px] font-medium tracking-tight truncate block">{m.title}</Link>
                      <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">
                        {formatDate(m.occurred_at)}
                      </p>
                    </div>
                    <ContentActions kind="hof" id={m.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[20px] font-medium tracking-tight">Gallery</p>
            <Link href="/gallery/new" className="btn btn-primary">Upload snapshot</Link>
          </div>
          {gallery.length === 0 ? (
            <p className="prose-body text-sm">No snapshots yet.</p>
          ) : (
            <ul className="surface rounded-[14px] overflow-hidden">
              {gallery.map((g, idx) => (
                <li key={g.id} className={idx > 0 ? "border-t hairline-2" : ""}>
                  <div className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <Link href="/gallery" className="text-[14px] font-medium tracking-tight truncate block">{g.title}</Link>
                      <p className="text-[11px] tabular font-mono text-[color:var(--color-ink-3)] mt-1">{formatDate(g.created_at)}</p>
                    </div>
                    <ContentActions kind="gallery" id={g.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-14 text-xs tabular font-mono text-[color:var(--color-ink-3)]">
          Available ranks: {RANKS_LIST.join(" · ")}
        </p>
      </div>
    </article>
  );
}
