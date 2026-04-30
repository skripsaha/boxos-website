import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GalleryForm } from "./form";

export const metadata = { title: "Add to gallery" };

export default async function NewGalleryPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.is_admin) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="display text-[clamp(28px,4vw,40px)]">Forbidden.</h1>
        <p className="prose-body mt-4">Only admins curate the gallery.</p>
      </section>
    );
  }
  return (
    <section className="container-narrow py-16 md:py-24">
      <h1 className="display text-[clamp(34px,5vw,52px)]">
        Add a <em>snapshot</em>.
      </h1>
      <p className="prose-body mt-4 max-w-[58ch]">
        Upload an image (≤ 2 MB), give it a title and an optional caption.
      </p>
      <div className="mt-10">
        <GalleryForm />
      </div>
    </section>
  );
}
