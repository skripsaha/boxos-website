import { createClient, type Client, type InValue, type Row, type ResultSet } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function clientUrl(): { url: string; authToken?: string } {
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;
  if (url) return { url, authToken };

  const local = path.join(process.cwd(), "data", "boxos.db");
  fs.mkdirSync(path.dirname(local), { recursive: true });
  return { url: `file:${local}` };
}

export function db(): Client {
  if (_client) return _client;
  const { url, authToken } = clientUrl();
  _client = createClient({ url, authToken, intMode: "number" });
  return _client;
}

export async function ready(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    await migrate();
    await seedCategoriesIfEmpty();
  })();
  return _initPromise;
}

export async function one<T = Row>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  await ready();
  const rs = await db().execute({ sql, args });
  return rs.rows[0] as unknown as T | undefined;
}

export async function many<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  await ready();
  const rs = await db().execute({ sql, args });
  return rs.rows as unknown as T[];
}

export async function run(sql: string, args: InValue[] = []): Promise<ResultSet> {
  await ready();
  return db().execute({ sql, args });
}

export const now = () => Math.floor(Date.now() / 1000);

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT NOT NULL UNIQUE,
     email TEXT UNIQUE,
     password_hash TEXT NOT NULL,
     is_admin INTEGER NOT NULL DEFAULT 0,
     bio TEXT,
     created_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS blog_posts (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     slug TEXT NOT NULL UNIQUE,
     title TEXT NOT NULL,
     excerpt TEXT NOT NULL,
     body TEXT NOT NULL,
     author_id INTEGER NOT NULL,
     published_at INTEGER NOT NULL,
     FOREIGN KEY (author_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published_at DESC)`,
  `CREATE TABLE IF NOT EXISTS forum_categories (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     slug TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     description TEXT NOT NULL,
     position INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS forum_threads (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     category_id INTEGER NOT NULL,
     title TEXT NOT NULL,
     author_id INTEGER NOT NULL,
     created_at INTEGER NOT NULL,
     last_post_at INTEGER NOT NULL,
     FOREIGN KEY (category_id) REFERENCES forum_categories(id),
     FOREIGN KEY (author_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_threads_cat ON forum_threads(category_id, last_post_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_threads_recent ON forum_threads(last_post_at DESC)`,
  `CREATE TABLE IF NOT EXISTS forum_posts (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     thread_id INTEGER NOT NULL,
     author_id INTEGER NOT NULL,
     body TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
     FOREIGN KEY (author_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_posts_thread ON forum_posts(thread_id, created_at ASC)`,

  /* phase 2 — avatars, ranks, banning, comments, reactions, hall of fame */
  `CREATE TABLE IF NOT EXISTS blog_comments (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     post_id INTEGER NOT NULL,
     author_id INTEGER NOT NULL,
     body TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
     FOREIGN KEY (author_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id, created_at ASC)`,
  `CREATE TABLE IF NOT EXISTS blog_reactions (
     post_id INTEGER NOT NULL,
     user_id INTEGER NOT NULL,
     kind TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     PRIMARY KEY (post_id, user_id, kind)
   )`,
  `CREATE TABLE IF NOT EXISTS hof_moments (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     body TEXT NOT NULL,
     photo_data TEXT,
     occurred_at INTEGER NOT NULL,
     created_at INTEGER NOT NULL,
     author_id INTEGER NOT NULL,
     FOREIGN KEY (author_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_hof_when ON hof_moments(occurred_at DESC)`,

  /* phase 3 — gallery of BoxOS screenshots */
  `CREATE TABLE IF NOT EXISTS gallery_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     caption TEXT,
     image_data TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     author_id INTEGER NOT NULL,
     FOREIGN KEY (author_id) REFERENCES users(id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_gallery_when ON gallery_items(created_at DESC)`,
];

const ADD_COLUMNS: { table: string; column: string; def: string }[] = [
  { table: "users", column: "avatar_data", def: "TEXT" },
  { table: "users", column: "custom_rank", def: "TEXT" },
  { table: "users", column: "banned_at",   def: "INTEGER" },
];

async function migrate() {
  const c = db();
  for (const stmt of DDL) {
    await c.execute(stmt);
  }
  for (const m of ADD_COLUMNS) {
    const cols = (await c.execute({
      sql: `SELECT name FROM pragma_table_info(?)`,
      args: [m.table],
    })).rows as unknown as { name: string }[];
    if (!cols.some((r) => r.name === m.column)) {
      try {
        await c.execute(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.def}`);
      } catch {
        /* race-safe: a parallel instance ran the same ALTER first */
      }
    }
  }
}

/** Only structural seed — empty categories. No fake users, posts, or threads. */
async function seedCategoriesIfEmpty() {
  const c = db();
  const cats = (await c.execute("SELECT COUNT(*) AS n FROM forum_categories")).rows[0] as unknown as { n: number };
  if (Number(cats.n) > 0) return;

  const data: [string, string, string, number][] = [
    ["announcements", "Announcements", "Releases, breaking changes, project news.", 0],
    ["kernel", "Kernel internals", "Scheduler, memory, AMP, IPC, notify — anything below the user boundary.", 1],
    ["userland", "Userland & boxlib", "Programs, shells, utilities, language ports.", 2],
    ["filesystem", "Storage & TagFS", "DiskBook, content addressing, manifests, persistence.", 3],
    ["porting", "Porting & hardware", "PCIe, drivers, ACPI, virtualization, real-iron reports.", 4],
    ["meta", "Meta & off-topic", "Project direction, design philosophy, community.", 5],
  ];
  await c.batch(
    data.map(([slug, name, desc, pos]) => ({
      sql: "INSERT INTO forum_categories (slug, name, description, position) VALUES (?, ?, ?, ?)",
      args: [slug, name, desc, pos],
    })),
    "write"
  );
}
