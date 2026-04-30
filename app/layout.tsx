import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "BoxOS — A non-Unix kernel for x86_64",
    template: "%s · BoxOS",
  },
  description:
    "BoxOS is a bare-metal kernel built on a non-Unix paradigm — asymmetric multiprocessing, capability-mediated IPC, content-addressed storage. Written from scratch in C and assembly.",
  metadataBase: new URL("https://boxos.dev"),
  openGraph: {
    title: "BoxOS",
    description: "A non-Unix kernel for x86_64.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Mona+Sans:ital,wght@0,300..900;1,300..900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <Nav user={user ? { id: user.id, username: user.username, isAdmin: !!user.is_admin } : null} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
