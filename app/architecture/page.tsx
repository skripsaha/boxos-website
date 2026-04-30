import Link from "next/link";
import { CodeBlock } from "@/components/Code";

export const metadata = { title: "Architecture" };

export default function ArchitecturePage() {
  return (
    <article>
      <header className="border-b hairline">
        <div className="container-x py-20 md:py-28">
          <h1 className="display text-[clamp(40px,6vw,76px)] max-w-[18ch]">
            How BoxOS is shaped.
          </h1>
          <p className="prose-body mt-6 max-w-[60ch]">
            This page is a structural overview of the kernel. It is intentionally short:
            the deep details live in the source tree and the documentation.
          </p>
        </div>
      </header>

      <div className="container-narrow py-16 md:py-20 article">
        <h2>The four primitives</h2>
        <p>
          BoxOS keeps its user-visible surface small. Programs talk to the kernel and to each
          other through four objects.
        </p>
        <ul>
          <li><strong>Cabin</strong> — a process. Owns its address space, capabilities and lifecycle. There is no <code>fork</code>; spawn is explicit.</li>
          <li><strong>Pocket</strong> — a typed message channel. Replaces pipes, sockets and signals with a single primitive.</li>
          <li><strong>Manifest</strong> — a chain of named operations. Replaces the fixed table of system-call numbers.</li>
          <li><strong>Deck</strong> — content-addressed persistence, organised through <em>TagFS</em>. The filesystem is a tag graph, not a directory tree.</li>
        </ul>

        <h2>Asymmetric multiprocessing</h2>
        <p>
          BoxOS is asymmetric. The boot core runs the global scheduler, the IPC fabric and the
          storage layer; the remaining cores receive units of work. There is no shared runqueue
          and no big lock — what one CPU does is bounded by the contract it has with the boot core.
        </p>

        <h2>What programs look like</h2>
        <p>
          Programs are normal C. <code>boxlib</code> exposes the kernel through small headers
          (<code>box/print.h</code>, <code>box/ipc.h</code>, <code>box/system.h</code>, …) and a
          tiny runtime that handles arg passing and exit. A short userland utility — the actual{" "}
          <code>say</code> command from the project — looks like this:
        </p>
        <CodeBlock fileName="src/userspace/utils/say.c" language="c">
{`#include "box/print.h"
#include "box/ipc.h"
#include "box/system.h"

int main(void) {
    int argc;
    char argv[16][64];
    receive_args(&argc, argv, 16);

    if (argc < 2) {
        println("Usage: say <text...>");
        exit(1);
        return 1;
    }

    for (int i = 1; i < argc; i++) {
        if (i > 1) print(" ");
        print(argv[i]);
    }
    println("");

    exit(0);
    return 0;
}`}
        </CodeBlock>
        <p>
          That is the entire program. No POSIX, no FILE pointers, no implicit linking — just
          the parts the kernel actually exposes.
        </p>

        <h2>Source layout</h2>
        <p>The kernel and userland share a flat tree:</p>
        <CodeBlock language="plain">
{`boxos/
├── src/
│   ├── kernel/
│   │   ├── arch/        # x86_64 entry, idt, paging, apic, msr
│   │   ├── core/        # scheduler, vmm, pocket, manifest, security
│   │   ├── drivers/     # pcie, ahci, framebuffer, keyboard
│   │   ├── tagfs/       # content-addressed storage, decks
│   │   └── main.c
│   ├── userspace/
│   │   ├── apps/        # bench, chain, decks, ...
│   │   ├── boxlib/      # user-side runtime + headers
│   │   ├── shell/       # the interactive shell
│   │   └── utils/       # small commands (say, show, ...)
│   └── include/         # shared kernel/userspace ABI headers
├── tools/               # qemu wrappers, build helpers
└── build/               # produced by \`make\``}
        </CodeBlock>

        <h2>Read more</h2>
        <p>
          The <Link href="/docs">documentation</Link> walks the same primitives in more depth, and
          the <Link href="/changelog">changelog</Link> is the real commit history of the kernel.
          The <Link href="/forum">forum</Link> is where design changes get discussed.
        </p>
      </div>
    </article>
  );
}
