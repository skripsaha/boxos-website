# BoxOS website

Marketing site, blog, and forum for the BoxOS kernel project.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS 4 (no config — `@theme` in `app/globals.css`)
- libSQL via `@libsql/client` — local file in dev, [Turso](https://turso.tech) in prod
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

### Deploy: Turso + Vercel (recommended)

The repo is wired for Turso libSQL on Vercel. Total cost: **$0**. Persistent
across deploys and cold starts. Five steps.

**1. Create a Turso database** (once)

```sh
brew install tursodatabase/tap/turso        # or: curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup                            # browser OAuth (free)
turso db create boxos                        # creates the DB
turso db show boxos --url                    # → libsql://boxos-<org>.turso.io
turso db tokens create boxos                 # → eyJ...long token
```

Save both values; you will paste them into Vercel.

**2. Push the repo to Vercel**

```sh
npm i -g vercel
vercel login                                 # browser OAuth
vercel                                       # accept defaults, first deploy goes to a preview URL
```

**3. Add environment variables**

Either via the Vercel dashboard (Project → Settings → Environment Variables) or
the CLI (`vercel env add NAME`):

| Variable               | Value                                              |
| ---------------------- | -------------------------------------------------- |
| `TURSO_DATABASE_URL`   | the `libsql://…turso.io` URL from step 1           |
| `TURSO_AUTH_TOKEN`     | the token from step 1                              |
| `SESSION_SECRET`       | `openssl rand -base64 48` (48+ chars)              |
| `ADMIN_USERNAME`       | your GitHub username (whoever can write blog posts)|

**4. Promote to production**

```sh
vercel --prod
```

Open the production URL. The first request runs migrations and seeds three
sample blog posts and six forum threads — the homepage will be populated
immediately. Register your `ADMIN_USERNAME` account; you'll get the admin flag
and the *Write a post* button on the blog index.

**5. (optional) Custom domain.** In the Vercel dashboard → Domains, add a
domain. Vercel handles SSL automatically.

### Local development

If `TURSO_DATABASE_URL` is unset, the client falls back to a local file
under `data/boxos.db`. No Turso account required to develop.

### Deploy: Railway / Fly.io

For a self-hosted feel: these platforms give a persistent disk. Set
`DATABASE_URL=file:/data/boxos.db` (or wherever the volume is mounted) and the
same `SESSION_SECRET` and `ADMIN_USERNAME`.

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
