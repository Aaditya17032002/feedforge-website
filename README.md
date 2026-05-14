# FeedForge Portal

Marketing and product site for **FeedForge** — AI-optimized product feeds for Google, Meta, marketplaces, and discovery channels. Built with **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, and **Recharts**.

---

## Prerequisites

- **Node.js 18+** (matches the production Docker image)
- **npm** (lockfile: `package-lock.json`)

---

## Quick start (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run start`| Serve production build   |
| `npm run lint` | ESLint (Next.js config)  |

---

## Environment variables

Create **`.env.local`** for local development (Next.js loads it automatically). Copy from **`.env.example`** and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Required for | Description |
| -------- | ------------ | ----------- |
| `SENDGRID_API_KEY` | Contact & demo emails | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Same | Must be a **verified** sender in SendGrid (single sender or domain auth) |
| `DEMO_TEAM_EMAIL` | Demo form | Inbox for demo request notifications |
| `CONTACT_TEAM_EMAIL` | Contact form | Inbox for contact form notifications |
| `APP_URL` | Email templates / links | Public site base URL (e.g. `http://localhost:3000` locally, or your deployed URL) |
| `OPENROUTER_API_KEY` | Chatbot API | Key from [OpenRouter](https://openrouter.ai/) |
| `OPENROUTER_MODEL` | Chatbot API | Model id (default in example: `openai/gpt-oss-120b:free`) |
| `NEXT_PUBLIC_CHATBOT_ENABLED` | Chatbot UI | `true` / `1` / `yes` / `on` to show the widget; otherwise hidden |

Optional:

| Variable | Description |
| -------- | ----------- |
| `DOCS_URL` | Overrides docs link in emails (defaults to `${APP_URL}/docs`) |
| `OPENROUTER_BASE_URL` | OpenRouter-compatible API base (default `https://openrouter.ai/api/v1`) |

**SendGrid:** Unverified `SENDGRID_FROM_EMAIL` addresses are rejected. Each successful submission sends a team notification and a customer auto-reply.

**Production:** Use **`.env.prod`** with Docker Compose (see below). That file is gitignored; keep secrets out of version control.

---

## Project structure (high level)

- **`app/`** — Routes and layouts (`page.tsx`, `layout.tsx`)
- **`app/api/`** — Route handlers (`contact`, `demo-request`, `try-product`, `chat`)
- **`components/`** — UI sections, header/footer, chatbot
- **`lib/`** — Email, content, shared utilities, server helpers
- **`public/`** — Static assets (images, favicons)

Main routes include home, **Pricing**, **FAQs**, **Contact**, **Products**, and **Customers** (see `app/` directory).

---

## Docker

### Development (hot reload on port 3000)

From the repo root:

```bash
docker compose --env-file .env.local -f docker-compose.dev.yml up --build
```

Compose variable substitution uses the file passed with `--env-file`. The app container bind-mounts the project and uses `.env.local` as `env_file`. Next.js also reads `.env.local` from the mounted tree.

### Production (standalone Next.js, host port 3002)

Build and run with **`.env.prod`** (set `APP_URL` to your public URL, e.g. `http://<SERVER_IP>:3002` if you expose that port):

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

The image uses `output: 'standalone'` from `next.config.js`. Build arg **`NEXT_PUBLIC_CHATBOT_ENABLED`** is passed through Compose (default `false`).

---

## Features

- Marketing pages with hero, stats, product narrative, and demo CTA
- **Contact** and **demo** flows backed by `/api/contact` and `/api/demo-request` (SendGrid)
- Optional **AI chatbot** (`/api/chat`, OpenRouter) gated by `NEXT_PUBLIC_CHATBOT_ENABLED`
- Responsive layout and charts (**Recharts**)

---

## Tech stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS, PostCSS, Autoprefixer
- `@sendgrid/mail`, Recharts

---

## License / ownership

Private package (`"private": true` in `package.json`). Adjust licensing here if you publish or open-source the repo.
