# VARTA Architecture & Technical Specification
**Project:** VARTA — Baat Sabki  
**Version:** 1.0.0-mvp  
**Status:** Approved for Implementation

---

## 1. High-Level System Architecture

VARTA is architected as a high-throughput, low-latency social microblogging platform. It follows a modular monolith approach for the core API to maximize developer velocity, type safety, and transactional consistency, paired with decoupled background workers and real-time WebSocket conduits.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  - Next.js 15 App Router (React 19 / TypeScript / Strict Mode)                    |
|  - Tailwind CSS + Custom Dark Theme Tokens + Radix UI Primitives (shadcn/ui)       |
|  - TanStack Query v5 (Optimistic Updates, Cache Management)                       |
|  - Socket.io Client (Real-time notifications & DMs)                               |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS
+------------------------------------------v----------------------------------------+
|                              EDGE / REVERSE PROXY                                 |
|  - Nginx (Hostinger VPS)                                                          |
|  - SSL / TLS Termination via Let's Encrypt Certbot                                |
|  - Rate Limiting Zones & Gzip/Brotli Compression                                  |
|  - Reverse Proxy: Web -> :3000, API -> :3001                                      |
+------------------------------------------+----------------------------------------+
                                           | Internal Docker Bridge Network
+------------------------------------------v----------------------------------------+
|                                APPLICATION SERVICES                               |
|                                                                                   |
|  +----------------------------------+    +-------------------------------------+  |
|  |           NestJS API             |    |         BullMQ Worker               |  |
|  | - REST Endpoints (/api/v1/*)     |    | - Timeline Fanout Job               |  |
|  | - Swagger OpenAPI docs           |    | - Notification Dispatcher           |  |
|  | - Argon2id Auth & JWT Guards     |    | - Media Resizer & Video Probe       |  |
|  | - WebSocket Gateway (Socket.io)  |    | - Trending Metric Recalculator      |  |
|  | - Prisma Client Service          |    | - Audit Log Persister               |  |
|  +----------------+-----------------+    +------------------+------------------+  |
|                   |                                         |                     |
+-------------------+-----------------------------------------+---------------------+
                    |                                         |
+-------------------v-----------------------------------------v---------------------+
|                                 DATA & CACHE LAYER                                |
|                                                                                   |
|  +----------------------------------+    +-------------------------------------+  |
|  |         PostgreSQL 16            |    |              Redis 7.2              |  |
|  | - Primary ACID Relational Store  |    | - BullMQ Message Queues             |  |
|  | - Full-Text Search (tsvector)    |    | - Socket.io Redis Adapter           |  |
|  | - Foreign Keys, Cascades & Checks|    | - Rate Limiter Cache & Session TTL  |  |
|  | - Cursor-Based Tuple Indices     |    | - Timeline Fast-Cache               |  |
|  +----------------------------------+    +-------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                      Local Persistent Media Volume                          |  |
|  |  - Mounted at `/var/www/varta/media` (Avatars, Covers, Posts, Previews)      |  |
|  |  - Abstracted storage adapter: easy swap to AWS S3 / Cloudflare R2 / MinIO  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Layout (Monorepo)

```
d:/twitter/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.base.json
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-specification.md
│   └── security-risks.md
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   └── shared/
│       ├── src/
│       │   ├── constants/
│       │   ├── types/
│       │   └── dtos/
└── docker/
    ├── docker-compose.dev.yml
    ├── docker-compose.prod.yml
    ├── Dockerfile.web
    ├── Dockerfile.api
    ├── Dockerfile.worker
    ├── nginx/
    │   └── varta.conf
    └── scripts/
        ├── backup-db.sh
        └── restore-db.sh
```

---

## 3. Core Business Rules

1. **User Identity & Handles:**
   - Usernames are case-insensitive, normalized to lowercase, 3–30 characters, alphanumeric with underscores (`^[a-zA-Z0-9_]{3,30}$`).
   - Emails must be unique and validated via RFC 5322 regex.
2. **Follows & Privacy:**
   - Self-following is blocked at both DB constraint level and API level.
   - Public accounts: Follow requests transition immediately to `ACCEPTED`.
   - Private accounts: Follow requests remain `PENDING` until accepted or rejected by the recipient.
   - Follower and Following counts are maintained via triggers or transactional count aggregations to guarantee 100% authoritative accuracy.
3. **Posts & Microblogging:**
   - Max post length: 500 characters.
   - Attachments: Up to 4 images (JPG, PNG, WebP; max 5MB each) OR 1 video (MP4, WebM; max 50MB).
   - Polls: 2 to 4 options, 1 to 7 days duration. One vote per user per poll.
   - Reposts and Quotes: Max 1 active repost per user per post. Quotes are new posts referencing `quotePostId`.
4. **Feeds:**
   - **Following Feed:** Strictly chronological order of posts from followed accounts, filtering out soft-deleted posts, blocked accounts, and muted accounts.
   - **For You Feed:** Hybrid scoring prioritizing recent high-engagement posts within relevant Indian topics and network proximity, penalized by content age and report flags.
5. **Direct Messaging:**
   - 1-to-1 conversations. Can only initiate if mutual follow or recipient allows DMs from anyone.
   - Enforce participant authorization on every message fetch and WebSocket dispatch.
6. **Moderation & Indian Intermediary Compliance:**
   - Grievance reporting with categories: Spam, Harassment, Hate Speech, Impersonation, Misinformation, Adult Content.
   - Admin moderation queue: Warn, Content Takedown, Temporary Suspension (24h/7d), Permanent Ban.
   - Audit logs recorded for every admin and moderator action.
