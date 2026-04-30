import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { HofForm } from "./form";

export const metadata = { title: "Add to Hall of Fame" };

export default async function NewHofPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.is_admin) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="display text-[clamp(28px,4vw,40px)]">Forbidden.</h1>
        <p className="prose-body mt-4">Only admins curate the Hall of Fame.</p>
      </section>
    );
  }
  return (
    <section className="container-narrow py-16 md:py-24">
      <h1 className="display text-[clamp(34px,5vw,52px)]">
        Pin a <em>moment</em>.
      </h1>
      <p className="prose-body mt-4 max-w-[58ch]">
        Title, body (markdown supported), the date it happened, and an optional photo. The
        timeline orders by the date the moment <em>occurred</em>, not when you posted it.
      </p>
      <div className="mt-10">
        <HofForm />
      </div>
    </section>
  );
}
