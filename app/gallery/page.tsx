import Link from "next/link";
import { many } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/markdown";

export const metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

type Item = {
  id: number;
  title: string;
  caption: string | null;
  image_data: string;
  created_at: number;
  author_name: string;
};

export default async function GalleryPage() {
  const me = await getCurrentUser();
  const items = await many<Item>(`
    SELECT g.id, g.title, g.caption, g.image_data, g.created_at, u.username AS author_name
    FROM gallery_items g JOIN users u ON u.id = g.author_id
    ORDER BY g.created_at DESC
  `);

  return (
    <article>
      <header className="relative overflow-hidden border-b hairline">
        <div className="page-mesh" aria-hidden />
        <div className="page-grid" aria-hidden />
        <div className="container-x relative py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="display text-[clamp(40px,6vw,76px)] max-w-[16ch]">
                The <em>gallery</em>.
              </h1>
              <p className="prose-body mt-6 max-w-[58ch]">
                Snapshots of BoxOS in motion — boot logs, framebuffer captures, crashes worth
                framing, the kernel doing its thing.
              </p>
            </div>
            {me?.is_admin && (
              <Link href="/gallery/new" className="btn btn-primary">Upload a snapshot</Link>
            )}
          </div>
        </div>
      </header>

      <section className="container-x py-16 md:py-20">
        {items.length === 0 ? (
          <div className="surface rounded-[14px] p-12 text-center">
            <p className="prose-body">The gallery is empty for now. The first snapshot will land here.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((it) => (
              <li key={it.id} className="card p-0 overflow-hidden group">
                <div className="aspect-[4/3] bg-[color:var(--color-paper-2)] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.image_data}
                    alt={it.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[15px] font-medium tracking-tight leading-snug truncate">{it.title}</p>
                  {it.caption && (
                    <p className="mt-1.5 text-[13px] text-[color:var(--color-ink-2)] line-clamp-2">{it.caption}</p>
                  )}
                  <p className="mt-3 text-[10.5px] tabular font-mono text-[color:var(--color-ink-3)]">
                    {formatDate(it.created_at)} · {it.author_name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
