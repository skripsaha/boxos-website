import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

let _db: Database.Database | null = null;

function resolveDbPath(): string {
  const raw = process.env.DB_PATH ?? "data/boxos.db";
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

export function db(): Database.Database {
  if (_db) return _db;

  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const handle = new Database(dbPath);
  handle.pragma("journal_mode = WAL");
  handle.pragma("foreign_keys = ON");
  handle.pragma("synchronous = NORMAL");

  migrate(handle);
  seedIfEmpty(handle);

  _db = handle;
  return handle;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      bio TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      published_at INTEGER NOT NULL,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published_at DESC);

    CREATE TABLE IF NOT EXISTS forum_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS forum_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      last_post_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES forum_categories(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_threads_cat ON forum_threads(category_id, last_post_at DESC);
    CREATE INDEX IF NOT EXISTS idx_threads_recent ON forum_threads(last_post_at DESC);

    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_posts_thread ON forum_posts(thread_id, created_at ASC);
  `);
}

function seedIfEmpty(d: Database.Database) {
  const cats = d.prepare("SELECT COUNT(*) AS n FROM forum_categories").get() as { n: number };
  if (cats.n === 0) {
    const insert = d.prepare(
      "INSERT INTO forum_categories (slug, name, description, position) VALUES (?, ?, ?, ?)"
    );
    const data = [
      ["announcements", "Announcements", "Releases, breaking changes, project news.", 0],
      ["kernel", "Kernel internals", "Scheduler, memory, AMP, IPC, syscalls — anything below the user boundary.", 1],
      ["userland", "Userland & boxlib", "Programs, shells, utilities, language ports.", 2],
      ["filesystem", "Storage & TagFS", "DiskBook, content addressing, manifests, persistence.", 3],
      ["porting", "Porting & hardware", "PCIe, drivers, ACPI, virtualization, real-iron reports.", 4],
      ["meta", "Meta & off-topic", "Project direction, design philosophy, community.", 5],
    ] as const;
    const tx = d.transaction(() => {
      for (const row of data) insert.run(...row);
    });
    tx();
  }

  // sample content (only on a fresh DB)
  const userCount = d.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (userCount.n === 0) {
    seedContent(d);
  }
}

function seedContent(d: Database.Database) {
  // pseudo-system author — bcrypt cannot match "!", so login as this user is impossible.
  const ts = Math.floor(Date.now() / 1000);
  const sysId = Number(
    d.prepare(
      "INSERT INTO users (username, email, password_hash, is_admin, created_at, bio) VALUES (?, NULL, ?, 0, ?, ?)"
    ).run("boxos", "!", ts - 86400 * 60, "BoxOS project announcements & seeded examples.").lastInsertRowid
  );

  // blog posts
  const insertPost = d.prepare(
    "INSERT INTO blog_posts (slug, title, excerpt, body, author_id, published_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  insertPost.run(
    "what-is-boxos",
    "What BoxOS is, and what it isn't",
    "An honest description of the project: not a Linux clone, not a microkernel exercise, not a research toy. A small kernel built on a non-Unix paradigm.",
    `BoxOS is a 64-bit kernel for x86_64 written from scratch.

It is not a Linux clone. It is not a microkernel exercise. It is not a teaching toy. It is a deliberate attempt to ask: *what would an operating system look like if the past forty years of Unix convention were optional?*

## The four primitives

The kernel exposes exactly four objects:

- **Cabin** — a process. Owns memory and capabilities.
- **Pocket** — a typed channel. Replaces pipes, sockets, signals.
- **Manifest** — a table of named operations. Replaces syscall numbers.
- **Deck** — content-addressed persistence. Replaces the file tree.

Together they describe the entire user-visible surface. Everything else — schedulers, drivers, the framebuffer — lives below this line and is not addressable from userland directly.

## What you can do today

\`\`\`shell
make clean && make
make run CORES=4 MEM=16G
\`\`\`

You will see a shell, a few sample programs, and a benchmark harness. The system boots in under half a second. It runs on real hardware as well as QEMU.

## What is missing

A networking stack. A windowing system. Anything resembling a package manager. Most drivers. The kernel is honest about its scope: small, predictable, and slowly growing.`,
    sysId,
    ts - 86400 * 14
  );
  insertPost.run(
    "asymmetric-multiprocessing",
    "Why BoxOS uses AMP, not SMP",
    "Symmetric multiprocessing is a default, not a law. We chose to give the boot core a special role — and the rest of the kernel got simpler as a result.",
    `Most kernels treat all CPU cores as equivalent. The same scheduler queue, the same locks, the same global state. This is symmetric multiprocessing — SMP — and it is the dominant design.

BoxOS is asymmetric. The boot core (CPU 0) runs the global scheduler, the IPC fabric, and the storage subsystem. The remaining cores are *workers* — they receive work units and execute them.

## Why

We tried SMP first. The big lock disappeared into a forest of small locks. Lock ordering rules grew. A bug in one subsystem could deadlock all of them. The model was correct but it was difficult to verify.

The asymmetric model trades a slightly worse worst-case throughput for a much better worst-case latency, and a much smaller kernel. There is exactly one place that schedules. There is exactly one place that arbitrates IPC. The other cores have no opinion.

## What we measured

\`\`\`
single core   pocket roundtrip:  478 ns
four core     pocket roundtrip:  511 ns  (cross-core)
four core     pocket roundtrip:  442 ns  (same-core sender/receiver)
\`\`\`

Cross-core IPC is slightly slower, as expected. But there are no lock contention spikes — the 99.9 percentile is within 1.6× of the median. With SMP we measured up to 14× under load.

## Tradeoffs

A misbehaving program cannot starve other workers. It can, however, queue up work that the boot core has to dispatch. This is a real cost. We accept it.`,
    sysId,
    ts - 86400 * 7
  );
  insertPost.run(
    "the-manifest-is-the-system-call-table",
    "The Manifest is the system call table",
    "We threw out syscall numbers. Programs invoke kernel operations by name, validated at link time, dispatched via a small table.",
    `In Linux, system calls are numbers: \`SYS_read\` is 0, \`SYS_write\` is 1, and so on. The numbers are part of the ABI; you cannot change them without breaking everything.

In BoxOS, system calls are *rows* in a table called the Manifest. Each row has a name, a register-passing signature, a side-effect descriptor, and a capability requirement. The kernel exposes the Manifest as a structured object; \`boxlib\` reads it and produces typed wrappers.

\`\`\`c
ResultCode rc = manifest_invoke("pocket.send", &(PocketSendArgs){
    .pocket = p,
    .data   = buf,
    .len    = (uint32_t)len,
});
\`\`\`

A typical program never calls \`manifest_invoke\` directly — it uses generated wrappers like \`pocket_send(p, buf, len)\`. But the underlying machinery is uniform.

## What this gets us

- **Sandboxing is a property of the table.** A restricted Manifest is a restricted process — there are no permission bits to forget.
- **Compile-time validation.** A misspelled operation is a link error, not a runtime trap.
- **Forward compatibility.** Adding an operation is appending a row, not editing an enumeration.
- **Introspectability.** Userland can ask the kernel which operations it has, what they take, and what they do.

The Manifest currently has 83 rows. Twelve more are pending. The number will grow, but each row is justified and reviewed.`,
    sysId,
    ts - 86400 * 2
  );

  // forum threads with replies
  const cats = d.prepare("SELECT id, slug FROM forum_categories").all() as { id: number; slug: string }[];
  const cat = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  function thread(category: number, title: string, body: string, when: number, replies: { body: string; offset: number }[] = []) {
    const tres = d.prepare(
      "INSERT INTO forum_threads (category_id, title, author_id, created_at, last_post_at) VALUES (?, ?, ?, ?, ?)"
    ).run(category, title, sysId, when, when);
    const tid = Number(tres.lastInsertRowid);
    d.prepare("INSERT INTO forum_posts (thread_id, author_id, body, created_at) VALUES (?, ?, ?, ?)")
      .run(tid, sysId, body, when);
    let last = when;
    for (const r of replies) {
      const rt = when + r.offset;
      d.prepare("INSERT INTO forum_posts (thread_id, author_id, body, created_at) VALUES (?, ?, ?, ?)")
        .run(tid, sysId, r.body, rt);
      last = Math.max(last, rt);
    }
    d.prepare("UPDATE forum_threads SET last_post_at = ? WHERE id = ?").run(last, tid);
  }

  thread(
    cat("announcements"),
    "v0.1.0-alpha is out",
    `The first tagged release of the kernel. Boots on UEFI, runs the shell and bench, exposes 83 Manifest operations.

Known limitations:

- No networking
- ATA only — no NVMe yet
- Single keymap (US)

If something doesn't work, file it in *Kernel internals* or *Porting & hardware*.`,
    ts - 86400 * 3
  );
  thread(
    cat("kernel"),
    "Lock ordering between scheduler and pocket fabric",
    `When a worker tries to send into a Pocket whose receiver is being descheduled, we currently take the receiver's Cabin lock from inside the Pocket fabric. This is the only lock-from-below in the system and it makes me nervous.

A safer pattern would be to push a "wakeup" message into the scheduler's mailbox and let it handle the descheduled-receiver case. That introduces one extra hop on the cold path, but the lock ordering becomes purely top-down.

Has anyone hit a deadlock here?`,
    ts - 86400 * 2,
    [
      {
        offset: 60 * 60 * 4,
        body: `I have not hit a deadlock, but I have hit a 200 µs latency spike that I traced to this exact path. The mailbox-based design sounds correct. If you push a patch I will benchmark it on the four-core run.`,
      },
      {
        offset: 60 * 60 * 9,
        body: `Pushed a draft to the *kernel* category. It uses the existing scheduler mailbox so no new infrastructure. Numbers tomorrow.`,
      },
    ]
  );
  thread(
    cat("userland"),
    "boxlib: a tiny stdio that doesn't pretend to be POSIX",
    `boxlib's stdio is intentionally small: \`print\`, \`println\`, \`printf\`, \`read_line\`. No FILE*, no buffering layers, no \`fflush\`. The shell uses it directly.

Question: should we expose a streaming \`writer\` interface that programs can compose, similar to Rust's \`io::Write\`? Or keep stdio dumb and let programs write to a Pocket directly?

I lean toward keeping it dumb.`,
    ts - 86400 * 5,
    [
      {
        offset: 60 * 60 * 12,
        body: `Dumb stdio + raw Pockets. Anything more is a leak of abstraction. If a program needs streaming, it should use the channel.`,
      },
    ]
  );
  thread(
    cat("filesystem"),
    "TagFS: how to handle name collisions in a content-addressed world",
    `If two programs store distinct files that happen to share a SHA-256 (extremely unlikely but cryptographically possible), Deck currently treats them as one. This is correct for content addressing but surprises programs that expect identity.

Two options:

1. Add a salt per Cabin so identical bytes produce distinct addresses for distinct origins.
2. Keep deduplication, but require programs to opt out via a per-write flag.

I prefer option 2 — the default is what makes Deck cheap.`,
    ts - 86400 * 8
  );
  thread(
    cat("porting"),
    "Real-iron report: ASUS ROG Strix B550",
    `Booted from a USB stick, UEFI mode, no compatibility shims. Framebuffer came up at native resolution. ATA driver picked up the SSD as expected. Reboot survived without corruption.

Did NOT work:
- Onboard NIC (no driver — expected)
- USB keyboard hot-plug (kernel sees insertion, doesn't enumerate)

Boot time, cold: 0.61 s to shell prompt.`,
    ts - 86400 * 11
  );
  thread(
    cat("meta"),
    "Why we are not a microkernel",
    `Periodic question from drive-by readers: "this looks like a microkernel, why don't you call it one?"

Because we are not. The scheduler, vmm, pocket fabric, and storage layer all run in ring 0 and share the same address space. We don't have message-passed device servers. We don't have a separate file-system process.

What we *do* have is a small, named operation table — and that's a different axis of design. Microkernels separate by privilege. We separate by *contract*.`,
    ts - 86400 * 16,
    [
      {
        offset: 60 * 60 * 30,
        body: `This framing is helpful. "Separate by contract, not by privilege" — I am stealing that.`,
      },
    ]
  );
}

/** convenience: timestamp as unix seconds */
export const now = () => Math.floor(Date.now() / 1000);
