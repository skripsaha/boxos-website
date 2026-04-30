import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const u = await getCurrentUser();
  if (u) redirect("/account");
  return (
    <section className="container-narrow py-20 md:py-28">
      <p className="eyebrow eyebrow--brand">Welcome back</p>
      <h1 className="display text-[clamp(34px,5vw,52px)] mt-4">Sign in to BoxOS</h1>
      <p className="prose-body mt-4">Use your username or email.</p>

      <div className="mt-12 surface rounded-[12px] p-7 md:p-9">
        <LoginForm />
      </div>

      <p className="mt-8 text-sm text-[color:var(--color-ink-2)]">
        New here? <Link href="/register" className="link text-[color:var(--color-ink)] font-medium">Create an account</Link>.
      </p>
    </section>
  );
}
