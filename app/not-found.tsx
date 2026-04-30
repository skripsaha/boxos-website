import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <section className="container-narrow py-32 md:py-40 text-center">
      <div className="inline-block rotate-[-6deg] mb-10">
        <Logo size={96} />
      </div>
      <h1 className="display text-[clamp(36px,5.6vw,64px)]">
        Not in the box.
      </h1>
      <p className="prose-body mt-6">
        Try the documentation, the blog, or the forum.
      </p>
      <div className="mt-10 flex justify-center gap-3 flex-wrap">
        <Link href="/" className="btn btn-primary">Home</Link>
        <Link href="/docs" className="btn btn-ghost">Documentation</Link>
        <Link href="/forum" className="btn btn-ghost">Forum</Link>
      </div>
    </section>
  );
}
