# VARTA Security Threat Model & Mitigation Strategy

This document identifies primary security vectors, privacy exposures, and compliance mandates for VARTA, detailing the explicit technical mitigations implemented in the codebase.

---

## 1. Authentication & Session Risks

### Risk 1.1: Credential Stuffing & Brute Force
- **Threat:** Automated scripts attacking `/api/v1/auth/login` to compromise user accounts.
- **Mitigation:**
  - Password hashing via **Argon2id** (`t=3, m=65536, p=4`), which is resistant to GPU-accelerated hash cracking.
  - Rate limiting using NestJS `@nestjs/throttler` backed by Redis (5 failed attempts per 15-minute window per IP/username).
  - Constant-time verification to prevent timing side-channel attacks during password checks.
  - Generic authentication error messages ("Invalid credentials") preventing account enumeration.

### Risk 1.2: Token Theft & Cross-Site Scripting (XSS)
- **Threat:** Stolen tokens stored in `localStorage` leading to account takeover.
- **Mitigation:**
  - Refresh tokens stored exclusively in **`HttpOnly`, `SameSite=Lax` (or `Strict`), `Secure` cookies**, unreachable by client JavaScript.
  - Access tokens kept short-lived (15 minutes), held in-memory in the React/Next.js application state.
  - Refresh token rotation: Every token refresh issues a new refresh token and invalidates the previous token family in PostgreSQL.
  - Sanitization of all user-generated content (posts, bios, DMs) using strict HTML entity escaping and DOMPurify.

---

## 2. Authorization & Insecure Direct Object References (IDOR)

### Risk 2.1: Unauthorized Modification or Deletion
- **Threat:** Malicious user sending `DELETE /api/v1/posts/:id` for another user's post or reading private DMs.
- **Mitigation:**
  - Explicit ownership verification guards on all mutation endpoints:
    `if (post.authorId !== currentUser.id && currentUser.role !== Role.ADMIN) throw new ForbiddenException();`
  - Direct message endpoints query database with compound filter:
    `WHERE conversationId = :id AND EXISTS (SELECT 1 FROM ConversationMember WHERE conversationId = :id AND userId = :currentUserId)`
  - Follow-shielded queries: Posts of private accounts are strictly filtered at the database level using `EXISTS (SELECT 1 FROM Follow WHERE followerId = :viewerId AND followingId = :authorId)`.

### Risk 2.2: Block Bypass & Harassment
- **Threat:** Blocked users attempting to interact, reply, view profile posts, or send DMs.
- **Mitigation:**
  - Unified relationship checks: Any action between User A and User B verifies bidirectional `Block` absence:
    `NOT EXISTS (SELECT 1 FROM Block WHERE (blockerId = :a AND blockedId = :b) OR (blockerId = :b AND blockedId = :a))`
  - Feed generation and search engines exclude content from users who have blocked or been blocked by the requester.

---

## 3. Media Upload & Storage Vulnerabilities

### Risk 3.1: Remote Code Execution / Malicious File Uploads
- **Threat:** Uploading PHP, executable binaries, or polyglot files disguised as `.jpg` or `.png`.
- **Mitigation:**
  - File magic byte sniffing: MIME type is verified by inspecting file header bytes via `file-type`, not relying on client-supplied `Content-Type` header or file extensions.
  - Filename sanitization: Original client filenames are discarded. Files are renamed using cryptographic UUIDs (`uuidv4() + extension`).
  - Storage isolation: Uploaded files reside in a dedicated mounted directory outside the Next.js and NestJS source directories.
  - File size enforcement: Enforced at both Nginx proxy (`client_max_body_size 55M`) and NestJS Multer middleware (5MB images, 50MB videos).

---

## 4. Database & Query Performance Hazards

### Risk 4.1: SQL Injection
- **Threat:** Malicious inputs inside search or query parameters.
- **Mitigation:**
  - 100% parameterized queries via Prisma ORM. No raw string interpolation.
  - Input validation with `class-validator` and `zod` validating parameter types, string lengths, and allowed characters.

### Risk 4.2: Denial of Service via N+1 & Deep Pagination
- **Threat:** Querying page 10,000 via `OFFSET` causing severe PostgreSQL IO degradation.
- **Mitigation:**
  - Strict cursor-based pagination using composite indexed tuples `(createdAt DESC, id DESC)`.
  - Relation eager-loading via Prisma `include` with indexed foreign keys.
  - Batching and timeline caching in Redis.

---

## 5. Regulatory Compliance & Indian IT Intermediary Rules

### Mandate 5.1: Grievance Redressal Mechanism (IT Rules 2021/2023)
- **Requirement:** Platform must provide a transparent reporting mechanism and acknowledge grievances within 24 hours and resolve within 15 days.
- **Implementation:**
  - User-accessible "Report Post" and "Report Account" action sheets with categorized violations.
  - Admin moderation portal with SLA tracking timestamps (`createdAt`, `resolvedAt`, `status`).
  - Audit logs tracking which moderator took action, reason, and timestamp.

### Mandate 5.2: Right to Account Deletion & Data Minimization
- **Requirement:** Users must be able to delete their account and personal data.
- **Implementation:**
  - Account deletion workflow marking status as `DELETED`, revoking active sessions, and cascading deletion/anonymization of personal profile data.
  - Passwords never logged in server output, error messages, or telemetry.
