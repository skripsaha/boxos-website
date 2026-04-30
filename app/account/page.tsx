import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { many } from "@/lib/db";
import { formatDate, timeAgo } from "@/lib/markdown";
import { LogoutButton } from "./logout";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const threads = await many<{ id: number; title: string; last_post_at: number; category_name: string }>(
    `SELECT t.id, t.title, t.last_post_at, c.name AS category_name
     FROM forum_threads t JOIN forum_categories c ON c.id = t.category_id
     WHERE t.author_id = ? ORDER BY t.created_at DESC LIMIT 20`,
    [user.id]
  );

  const posts = await many<{ id: number; body: string; created_at: number; thread_id: number; thread_title: string }>(
    `SELECT p.id, p.body, p.created_at, t.id AS thread_id, t.title AS thread_title
     FROM forum_posts p JOIN forum_threads t ON t.id = p.thread_id
     WHERE p.author_id = ? ORDER BY p.created_at DESC LIMIT 20`,
    [user.id]
  );

  return (
    <section className="container-x py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display text-[clamp(34px,5vw,52px)]">{user.username}</h1>
          <p className="prose-body mt-3">
            Member since {formatDate(user.created_at)} · {user.is_admin ? "admin" : "community member"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.is_admin ? <Link href="/blog/new" className="btn btn-primary">Write a post</Link> : null}
          <Link href="/forum/new" className="btn btn-ghost">New thread</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-16 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="text-[18px] font-medium tracking-tight">Your threads</h2>
          {threads.length === 0 ? (
            <p className="prose-body mt-5">You haven't started any threads yet.</p>
          ) : (
            <ul className="mt-5 surface rounded-[12px] divide-y divide-[color:var(--color-line-2)]">
              {threads.map((t) => (
                <li key={t.id} className="px-5 py-4">
                  <Link href={`/forum/t/${t.id}`} className="block">
                    <p className="text-[15px] font-medium tracking-tight">{t.title}</p>
                    <p className="text-xs tabular font-mono text-[color:var(--color-ink-3)] mt-1.5">
                      {t.category_name} · last activity {timeAgo(t.last_post_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-[18px] font-medium tracking-tight">Your replies</h2>
          {posts.length === 0 ? (
            <p className="prose-body mt-5">No replies yet.</p>
          ) : (
            <ul className="mt-5 surface rounded-[12px] divide-y divide-[color:var(--color-line-2)]">
              {posts.map((p) => (
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
    </section>
  );
}
