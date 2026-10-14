# VARTA — Baat Sabki
> **A Scalable, India-Focused Microblogging & Social Networking Platform**

VARTA ("Baat Sabki") is a modern, high-performance social networking platform built with Next.js, NestJS, PostgreSQL, Redis, and BullMQ. Inspired by the conversational format of Twitter/X, VARTA presents an original brand identity, distinctive electric blue & deep obsidian design system, robust relational data integrity, and compliance-ready moderation pipelines.

---

## 1. System Architecture

- **Web Frontend (`apps/web`):** Next.js 15 (App Router), React 19, TypeScript strict mode, Tailwind CSS, shadcn/ui primitives, Lucide icons, TanStack Query v5, React Hook Form + Zod.
- **Backend API (`apps/api`):** NestJS modular architecture, REST APIs under `/api/v1`, WebSocket Gateway (Socket.io) with JWT auth, Swagger/OpenAPI documentation, Argon2id password hashing, Redis throttling.
- **Background Worker (`apps/worker`):** BullMQ workers for timeline fanout, asynchronous notifications, media resizing, and metric recalculations.
- **Database & Shared Packages (`packages/database`, `packages/shared`):** Normalized PostgreSQL schema via Prisma ORM, migrations, seed data, and shared TypeScript contract DTOs.
- **Infrastructure:** Docker Compose (dev & prod configurations), Nginx reverse proxy, Hostinger VPS isolated deployment, automated backups.

---

## 2. Directory Layout

```
varta/
├── apps/
│   ├── web/               # Next.js 15 App Router Frontend
│   ├── api/               # NestJS Modular Backend API (/api/v1)
│   └── worker/            # BullMQ Asynchronous Background Worker
├── packages/
│   ├── database/          # Prisma ORM, Schema, Migrations, Seeds
│   └── shared/            # Shared DTOs, Enums, Types, Validation Schemas
├── docker/                # Dockerfiles, Compose setups, Nginx configs, backup scripts
├── docs/                  # Architecture, Schema, API Specs, Security guides
├── .env.example           # Environment template
└── README.md              # Project manual
```

---

## 3. Quickstart & Local Development

### Prerequisites
- Node.js >= 20 (v24.x recommended)
- npm >= 10
- Docker Desktop with Docker Compose

### Step 1: Clone & Install Dependencies
```bash
git clone <repo-url> varta
cd varta
npm install
```

### Step 2: Environment Configuration
```bash
cp .env.example .env
```
Update database and secret keys as needed in `.env`.

### Step 3: Start Infrastructure (PostgreSQL & Redis)
```bash
npm run docker:dev:up
```

### Step 4: Run Database Migrations & Seeds
```bash
npm run db:migrate
npm run db:seed
```

### Step 5: Start Development Servers
```bash
# Starts Web (:3000) and API (:3001) concurrently
npm run dev
```

- Web Application: [http://localhost:3000](http://localhost:3000)
- API Documentation (Swagger): [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- Health Check: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

---

## 4. Key Commands

| Command | Action |
|---|---|
| `npm run dev` | Launch Next.js web, NestJS API, and Worker in development mode |
| `npm run build` | Compile all packages and applications for production |
| `npm run test` | Execute unit and integration tests across all workspaces |
| `npm run lint` | Run ESLint and TypeScript type checking |
| `npm run db:migrate` | Apply pending Prisma database migrations |
| `npm run db:studio` | Launch Prisma Studio GUI database explorer |
| `npm run db:seed` | Populate database with realistic test users, posts, and Indian trending tags |
| `npm run docker:dev:up` | Spin up local PostgreSQL 16 and Redis containers |
| `npm run docker:dev:down` | Stop and tear down local development containers |

---

## 5. Security & Privacy Highlights

- **Argon2id Hashing:** Industry-standard memory-hard password protection.
- **Token Security:** Short-lived access tokens + HttpOnly SameSite refresh token rotation.
- **Relational Integrity:** Zero fake interactions; unique constraints ensure at most one active like/repost per post and one vote per poll.
- **Grievance Redressal:** Built-in reporting, SLA tracking, and audit logging aligning with Indian Intermediary Rules.
- **Media Safety:** MIME validation via magic bytes, cryptographic UUID renaming, and strict upload boundaries.

---

## 6. Hostinger VPS Deployment

Detailed VPS deployment instructions are provided in [docs/deployment-vps.md](docs/deployment-vps.md), including:
- Isolated Docker network (`varta-network`) and dedicated container prefixes (`varta-*`)
- Zero port collision with pre-existing VPS services
- Host Nginx configuration with SSL certs
- Daily off-server automated database backup cron script
