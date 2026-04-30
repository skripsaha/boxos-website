import Link from "next/link";
import { many } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/markdown";
import { renderMarkdown } from "@/lib/markdown";

export const metadata = { title: "Hall of Fame" };
export const dynamic = "force-dynamic";

type Moment = {
  id: number;
  title: string;
  body: string;
  photo_data: string | null;
  occurred_at: number;
  author_name: string;
};

export default async function HallOfFamePage() {
  const me = await getCurrentUser();
  const moments = await many<Moment>(`
    SELECT m.id, m.title, m.body, m.photo_data, m.occurred_at, u.username AS author_name
    FROM hof_moments m JOIN users u ON u.id = m.author_id
    ORDER BY m.occurred_at ASC
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
                Hall of <em>Fame</em>.
              </h1>
              <p className="prose-body mt-6 max-w-[60ch]">
                A timeline of moments worth remembering — milestones, breakthroughs, ridiculous bugs we'd rather not repeat.
                Curated by the project's creator.
              </p>
            </div>
            {me?.is_admin && (
              <Link href="/hof/new" className="btn btn-primary">Add a moment</Link>
            )}
          </div>
        </div>
      </header>

      <section className="border-b hairline">
        {moments.length === 0 ? (
          <div className="container-narrow py-20 md:py-24 text-center">
            <p className="prose-body">The timeline is empty for now. The first moment will appear here.</p>
          </div>
        ) : (
          <div className="hof-rail">
            <div className="hof-track">
              <div className="hof-line" aria-hidden />
              {moments.map((m, idx) => (
                <Card key={m.id} m={m} side={idx % 2 === 0 ? "top" : "bot"} />
              ))}
            </div>
          </div>
        )}
      </section>
    </article>
  );
}

function Card({ m, side }: { m: Moment; side: "top" | "bot" }) {
  return (
    <div className={`hof-card hof-card--${side}`}>
      <span className="hof-tick" aria-hidden />
      {m.photo_data && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={m.photo_data}
          alt=""
          className="block w-full h-44 object-cover border-b hairline"
          aria-hidden="true"
        />
      )}
      <div className="p-5">
        <p className="text-[11px] tabular font-mono text-[color:var(--color-brand-deep)]">
          {formatDate(m.occurred_at)}
        </p>
        <h3 className="mt-2 text-[18px] font-medium tracking-tight leading-snug">{m.title}</h3>
        <div
          className="prose-body mt-3 text-[13.5px] leading-relaxed line-clamp-5"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(m.body) }}
        />
        <p className="mt-4 text-[11px] tabular font-mono text-[color:var(--color-ink-3)]">curated by {m.author_name}</p>
      </div>
    </div>
  );
}
