import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/RankBadge";
import { formatDate } from "@/lib/markdown";
import { LogoutButton } from "./logout";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <section className="container-narrow py-16 md:py-24">
      <div className="flex flex-col md:flex-row md:items-center gap-7 md:gap-10">
        <Avatar username={user.username} avatarData={user.avatar_data} size={112} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="display text-[clamp(32px,5vw,52px)] tracking-tight leading-none">
              {user.username}
            </h1>
            <RankBadge
              createdAt={user.created_at}
              isAdmin={user.is_admin}
              customRank={user.custom_rank}
              bannedAt={user.banned_at}
            />
          </div>
          <p className="mt-3 text-sm tabular font-mono text-[color:var(--color-ink-3)]">
            joined {formatDate(user.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 gap-3">
        <Link href="/account/avatar" className="card p-6">
          <p className="text-[16px] font-medium tracking-tight">
            {user.avatar_data ? "Edit avatar" : "Draw your avatar"}
          </p>
          <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">Pixel-art editor — 24 × 24 grid.</p>
        </Link>
        <Link href={`/u/${user.username}`} className="card p-6">
          <p className="text-[16px] font-medium tracking-tight">View public profile</p>
          <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">All your posts, threads and replies.</p>
        </Link>
        <Link href="/forum/new" className="card p-6">
          <p className="text-[16px] font-medium tracking-tight">Start a thread</p>
          <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">Open a discussion in any forum category.</p>
        </Link>
        {user.is_admin ? (
          <Link href="/blog/new" className="card p-6">
            <p className="text-[16px] font-medium tracking-tight">Write a blog post</p>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">Markdown editor with image embedding.</p>
          </Link>
        ) : null}
        {user.is_admin ? (
          <Link href="/admin" className="card p-6">
            <p className="text-[16px] font-medium tracking-tight">Admin panel</p>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">Manage users, posts, threads, hall of fame.</p>
          </Link>
        ) : null}
        {user.is_admin ? (
          <Link href="/hof/new" className="card p-6">
            <p className="text-[16px] font-medium tracking-tight">Add to Hall of Fame</p>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">Pin a moment to the timeline.</p>
          </Link>
        ) : null}
        {user.is_admin ? (
          <Link href="/gallery/new" className="card p-6">
            <p className="text-[16px] font-medium tracking-tight">Upload to gallery</p>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">Drop a snapshot of BoxOS in motion.</p>
          </Link>
        ) : null}
      </div>

      <div className="mt-12 pt-8 border-t hairline">
        <LogoutButton />
      </div>
    </section>
  );
}
