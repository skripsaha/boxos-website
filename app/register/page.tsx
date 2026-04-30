import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./form";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const u = await getCurrentUser();
  if (u) redirect("/account");
  return (
    <section className="container-narrow py-20 md:py-28">
      <p className="eyebrow eyebrow--brand">Join the project</p>
      <h1 className="display text-[clamp(34px,5vw,52px)] mt-4">Create a BoxOS account</h1>
      <p className="prose-body mt-4">
        An account lets you post in the forum, comment, and follow project updates. We do not require an email.
      </p>

      <div className="mt-12 surface rounded-[12px] p-7 md:p-9">
        <RegisterForm />
      </div>

      <p className="mt-8 text-sm text-[color:var(--color-ink-2)]">
        Already have an account? <Link href="/login" className="link text-[color:var(--color-ink)] font-medium">Sign in</Link>.
      </p>
    </section>
  );
}
