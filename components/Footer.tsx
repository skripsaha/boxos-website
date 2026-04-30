import Link from "next/link";
import { Wordmark } from "./Wordmark";

const cols = [
  {
    title: "Project",
    items: [
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "Forum", href: "/forum" },
      { label: "Source", href: "https://github.com/skripsaha/boxos", external: true },
    ],
  },
  {
    title: "Subsystems",
    items: [
      { label: "Cabin (process)", href: "/docs#cabin" },
      { label: "Pocket (IPC)", href: "/docs#pocket" },
      { label: "Manifest (capabilities)", href: "/docs#manifest" },
      { label: "Deck (storage)", href: "/docs#deck" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Forum index", href: "/forum" },
      { label: "Recent threads", href: "/forum#recent" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t hairline mt-32">
      <div className="container-x py-16 grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-10">
        <div className="col-span-2 md:col-span-4">
          <Wordmark size={26} />
          <p className="prose-body mt-5 max-w-[34ch] text-[14.5px]">
            A non-Unix kernel for x86_64. Written from first principles —
            asymmetric multiprocessing, capability-mediated IPC, content-addressed storage.
          </p>
          <p className="eyebrow mt-8">Status</p>
          <p className="mt-1.5 text-sm tabular text-[color:var(--color-ink-2)]">
            <span className="dot" /> &nbsp;Active development · v0.1.0-alpha
          </p>
        </div>

        {cols.map((col) => (
          <div key={col.title} className="md:col-span-2">
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.items.map((it) => (
                <li key={it.label}>
                  {"external" in it && it.external ? (
                    <a
                      href={it.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]"
                    >
                      {it.label}
                    </a>
                  ) : (
                    <Link
                      href={it.href}
                      className="text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-ink)]"
                    >
                      {it.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="col-span-2 md:col-span-2">
          <p className="eyebrow">License</p>
          <p className="mt-4 text-sm text-[color:var(--color-ink-2)]">
            Source under the project's open license. Site content © BoxOS contributors.
          </p>
        </div>
      </div>

      <div className="border-t hairline">
        <div className="container-x py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs tabular text-[color:var(--color-ink-3)] font-mono">
            © {year} BoxOS · built bare-metal on x86_64
          </p>
          <p className="text-xs tabular text-[color:var(--color-ink-3)] font-mono">
            handcrafted in C and assembly
          </p>
        </div>
      </div>
    </footer>
  );
}
