"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Wordmark";

type SessionUser = { id: number; username: string; isAdmin: boolean } | null;

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/forum", label: "Forum" },
];

export function Nav({ user }: { user: SessionUser }) {
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className="sticky top-0 z-40 transition-colors"
      style={{
        background: scrolled || mobileOpen ? "color-mix(in oklch, var(--color-paper) 86%, transparent)" : "transparent",
        backdropFilter: scrolled || mobileOpen ? "saturate(140%) blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid var(--color-line)" : "1px solid transparent",
      }}
    >
      <div className="container-x flex h-[64px] items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="BoxOS home" className="flex items-center">
            <Wordmark size={24} />
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                data-active={pathname === l.href || pathname.startsWith(l.href + "/")}
              >
                {l.label}
              </Link>
            ))}
            <a
              className="nav-link inline-flex items-center gap-1.5"
              href="https://github.com/skripsaha/boxos"
              target="_blank"
              rel="noreferrer"
            >
              Source
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/account" className="nav-link tabular">
                {user.username}
              </Link>
              <Link href="/forum/new" className="btn btn-ghost">New thread</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">Sign in</Link>
              <Link href="/register" className="btn btn-primary">
                Create account
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 6H9M9 6L6 3M9 6L6 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-[color:var(--color-paper-2)]"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            {mobileOpen ? (
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            ) : (
              <>
                <path d="M3 6h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M3 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[color:var(--color-line)]">
          <div className="container-x py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link py-2.5 text-base"
                data-active={pathname === l.href || pathname.startsWith(l.href + "/")}
              >
                {l.label}
              </Link>
            ))}
            <a className="nav-link py-2.5 text-base" href="https://github.com/skripsaha/boxos" target="_blank" rel="noreferrer">
              Source
            </a>
            <div className="mt-3 pt-3 border-t border-[color:var(--color-line)] flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/account" className="btn btn-ghost flex-1">{user.username}</Link>
                  <Link href="/forum/new" className="btn btn-primary flex-1">New thread</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-ghost flex-1">Sign in</Link>
                  <Link href="/register" className="btn btn-primary flex-1">Create account</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
