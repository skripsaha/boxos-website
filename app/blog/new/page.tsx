import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NewPostForm } from "./form";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.is_admin) {
    return (
      <section className="container-narrow py-24">
        <p className="text-[13px] font-medium text-[color:var(--color-danger)]">Forbidden</p>
        <h1 className="display text-[clamp(28px,4vw,40px)] mt-3">Only admins can publish blog posts.</h1>
        <p className="prose-body mt-5">If this should be you, set <code className="font-mono">ADMIN_USERNAME</code> in <code className="font-mono">.env</code> and re-register.</p>
      </section>
    );
  }
  return (
    <section className="container-narrow py-20 md:py-24">
      <h1 className="display text-[clamp(34px,5vw,52px)]">Publish to the blog</h1>
      <p className="prose-body mt-4">
        Markdown is supported: headings, paragraphs, lists, fenced code, blockquotes, links.
      </p>
      <div className="mt-10">
        <NewPostForm />
      </div>
    </section>
  );
}
