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
| `APP_URL` | Email links | Public site base URL passed to Platform email templates |
| `OPENROUTER_API_KEY` | Chatbot API | Key from [OpenRouter](https://openrouter.ai/) |
| `OPENROUTER_MODEL` | Chatbot API | Model id (default in example: `openai/gpt-oss-120b:free`) |
| `NEXT_PUBLIC_CHATBOT_ENABLED` | Chatbot UI | `true` / `1` / `yes` / `on` to show the widget; otherwise hidden |
| `LANDING_PORTAL_API_KEY` | Contact & demo forms | Shared secret with Application backend (header `X-Landing-Api-Key`) |
| `BACKEND_INTERNAL_URL` | Contact & demo forms | Application API inside Docker (e.g. `http://feedforge_backend:8000`) |
| `BACKEND_API_URL` | Contact & demo forms | Fallback for local `npm run dev` (e.g. `http://localhost:8000`) |

Optional:

| Variable | Description |
| -------- | ----------- |
| `DOCS_URL` | Overrides docs link in emails (defaults to `${APP_URL}/docs`) |
| `OPENROUTER_BASE_URL` | OpenRouter-compatible API base (default `https://openrouter.ai/api/v1`) |

**Email:** Contact and demo forms enqueue mail on Application via `POST /api/v1/email/enqueue`. SendGrid keys and team inboxes live on Platform only.

**Production:** Use **`.env.prod`** with Docker Compose (copy from **`.env.prod.example`**). Set `LANDING_PORTAL_API_KEY` to the **same value** as in Application `.env`. That file is gitignored; keep secrets out of version control.

**Lead storage:** Contact and demo submissions call Application `POST /api/v1/leads` from server route handlers, then enqueue emails. The browser never sees the API key.

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

### Production (via edge proxy on port 80)

Production images are built by **GitHub Actions** on push to `main` and published to Docker Hub as **`sonishivam1402/feedforge-website`** (`:latest` and `:<short-sha>`). The server only pulls and runs the image — do not use `--build` on the server.

**GitHub repo secrets / variables** (Settings → Secrets and variables → Actions):

| Name | Type | Purpose |
| ---- | ---- | ------- |
| `DOCKERHUB_USERNAME` | secret | Docker Hub username (`sonishivam1402`) |
| `DOCKERHUB_TOKEN` | secret | Docker Hub access token |
| `NEXT_PUBLIC_CHATBOT_ENABLED` | variable | Build-arg baked into the client bundle |
| `NEXT_PUBLIC_APP_URL` | variable | Build-arg (e.g. `https://app.feedforge.ai`) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | variable | Build-arg for GA4 |

Runtime secrets stay in server **`.env.prod`** only (`LANDING_PORTAL_API_KEY`, `BACKEND_INTERNAL_URL`, etc.). SendGrid is configured on Platform.

**Server deploy** (`APP_URL` = public site URL, e.g. `http://<SERVER_IP>`):

```bash
cp .env.prod.example .env.prod
# Edit .env.prod — set LANDING_PORTAL_API_KEY (same as Application)
# If the Docker Hub repo is private: docker login
docker compose --env-file .env.prod -f docker-compose.prod.yml pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

Requires **`edge_net`** and a running Application backend. The portal container reaches the API at `http://feedforge_backend:8000`.

The image uses `output: 'standalone'`. **`NEXT_PUBLIC_*`** values are set at **CI build time** (GitHub variables above). GA also reads **`GA_MEASUREMENT_ID`** at container runtime (set it in `.env.prod` for production analytics).

---

## Features

- Marketing pages with hero, stats, product narrative, and demo CTA
- **Contact** and **demo** flows: save to Application DB via `/api/v1/leads`, then enqueue email via `/api/v1/email/enqueue`
- Optional **AI chatbot** (`/api/chat`, OpenRouter) gated by `NEXT_PUBLIC_CHATBOT_ENABLED`
- Responsive layout and charts (**Recharts**)

---

## Tech stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS, PostCSS, Autoprefixer
- Recharts

---

## License / ownership

Private package (`"private": true` in `package.json`). Adjust licensing here if you publish or open-source the repo.
