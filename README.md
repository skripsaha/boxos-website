# BoxOS website

Marketing site, blog, and forum for the BoxOS kernel project.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS 4 (no config — `@theme` in `app/globals.css`)
- SQLite via `better-sqlite3` (zero external services)
- JWT sessions via `jose`, bcrypt password hashing
- Mona Sans · Instrument Serif · JetBrains Mono (loaded from Google Fonts)

## Quick start

```sh
cd website
cp .env.example .env
# generate a real secret:
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# paste it as SESSION_SECRET in .env

npm install
npm run dev
```

Open [http://localhost:4000](http://localhost:4000).

The first time the site boots, the SQLite database is created at `data/boxos.db`,
forum categories are inserted, and a small set of sample blog posts and forum threads
is seeded so the homepage looks alive.

## Becoming the admin

Set `ADMIN_USERNAME` in `.env` (default: `skripsaha`). The first user that registers
with that exact username receives the admin flag, which lets them publish blog posts.

## Production

```sh
npm run build
npm start                      # serves on port 4000
```

The site has no external dependencies. Drop the project on any host that can run
Node 20+. Persist `data/boxos.db` across deploys — it holds users, posts, threads.

## Source layout

```
website/
├── app/              # Next.js routes
│   ├── api/          # auth, blog, forum endpoints
│   ├── blog/         # public blog + admin write page
│   ├── forum/        # categories, threads, replies
│   ├── docs/         # documentation overview
│   ├── login/  register/  account/
│   ├── layout.tsx    # nav + footer wrapper
│   ├── page.tsx      # homepage
│   └── globals.css   # design system (Tailwind v4 @theme)
├── components/       # Logo, Nav, Footer, Code, Wordmark
├── lib/              # db, auth, session, markdown
├── public/           # icon.svg
└── data/             # SQLite db (gitignored)
```

## Conventions

- Server components by default. Client components only where necessary
  (forms, scroll listener on the nav).
- All database mutations go through `/api/*` routes, never directly from the client.
- Markdown is rendered with a small in-tree renderer in `lib/markdown.ts` —
  no large dependency.
- The site is mobile-first. Test at 320 px, 768 px, 1280 px.

## License

The site source follows the project's open license.
