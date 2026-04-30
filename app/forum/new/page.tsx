import { redirect } from "next/navigation";
import { many } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NewThreadForm } from "./form";

export const metadata = { title: "New thread" };

export default async function NewThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { cat } = await searchParams;
  const cats = await many<{ id: number; slug: string; name: string }>(
    "SELECT id, slug, name FROM forum_categories ORDER BY position ASC"
  );

  return (
    <section className="container-narrow py-20 md:py-24">
      <p className="eyebrow eyebrow--brand">New thread</p>
      <h1 className="display text-[clamp(34px,5vw,52px)] mt-4">Start a discussion</h1>
      <p className="prose-body mt-4">
        Pick the category that fits best. Markdown is supported in the body.
      </p>
      <div className="mt-10">
        <NewThreadForm categories={cats} initialCat={cat} />
      </div>
    </section>
  );
}
