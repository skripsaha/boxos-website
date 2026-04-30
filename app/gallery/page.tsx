import Link from "next/link";
import { many } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GalleryGrid } from "@/components/GalleryGrid";

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
          <GalleryGrid items={items} />
        )}
      </section>
    </article>
  );
}
