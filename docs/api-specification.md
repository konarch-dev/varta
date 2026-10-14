# VARTA REST API Specification (/api/v1)
**Architecture:** NestJS REST Controller Architecture  
**Format:** JSON (UTF-8, Indian Multilingual / Unicode Support)  
**Security:** Bearer JWT Access Token + HttpOnly Refresh Token Cookie

---

## 1. Authentication & Account Management (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Register new user with email, username, password, display name |
| `POST` | `/api/v1/auth/login` | None | Authenticate with username/email & password; returns accessToken + set-cookie refreshToken |
| `POST` | `/api/v1/auth/refresh` | Cookie | Exchange valid refresh token for a new access token & rotate refresh token |
| `POST` | `/api/v1/auth/logout` | User | Revoke active session and clear cookie |
| `GET` | `/api/v1/auth/me` | User | Fetch current authenticated user, profile, and roles |
| `POST` | `/api/v1/auth/verify-email` | None | Verify email address using token |
| `POST` | `/api/v1/auth/forgot-password`| None | Request password reset email |
| `POST` | `/api/v1/auth/reset-password` | None | Reset password with verification token |

---

## 2. Users & Profiles (`/api/v1/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/:username` | Optional | Retrieve public profile with counts and viewer relationship status |
| `PATCH` | `/api/v1/users/profile` | User | Update display name, bio, website, location |
| `POST` | `/api/v1/users/avatar` | User | Upload new avatar image (multipart/form-data) |
| `POST` | `/api/v1/users/cover` | User | Upload new header cover image (multipart/form-data) |
| `PATCH` | `/api/v1/users/settings/privacy`| User | Toggle private account (`isPrivate: boolean`) |
| `GET` | `/api/v1/users/:username/followers`| Optional | List followers with cursor pagination |
| `GET` | `/api/v1/users/:username/following`| Optional | List following with cursor pagination |

---

## 3. Posts & Content (`/api/v1/posts`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/posts` | User | Create a new post, reply (`parentId`), quote (`quotePostId`), with media/polls |
| `GET` | `/api/v1/posts/:id` | Optional | Get post detail, author info, media, poll results, and parent post |
| `GET` | `/api/v1/posts/:id/replies` | Optional | Get threaded replies tree with cursor pagination |
| `DELETE`| `/api/v1/posts/:id` | User | Soft-delete own post (or admin takedown) |
| `POST` | `/api/v1/posts/:id/like` | User | Like a post (idempotent, triggers notification) |
| `DELETE`| `/api/v1/posts/:id/like` | User | Remove like from post |
| `POST` | `/api/v1/posts/:id/repost` | User | Repost a post to followers |
| `DELETE`| `/api/v1/posts/:id/repost` | User | Remove repost |
| `POST` | `/api/v1/posts/:id/bookmark` | User | Save post to private bookmarks |
| `DELETE`| `/api/v1/posts/:id/bookmark` | User | Remove post from bookmarks |
| `POST` | `/api/v1/posts/poll/:pollId/vote`| User | Cast vote on poll option |

---

## 4. Feeds (`/api/v1/feed`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/feed/following` | User | Chronological feed of posts from followed users (cursor-based: `?cursor=...&limit=20`) |
| `GET` | `/api/v1/feed/for-you` | Optional | Algorithmic discovery feed based on engagement, recency, and topic tags |
| `GET` | `/api/v1/feed/user/:username` | Optional | User's post timeline (posts, replies, media tabs) |
| `GET` | `/api/v1/feed/bookmarks` | User | Current user's private bookmarked posts |

---

## 5. Follows, Blocks & Mutes (`/api/v1/social`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/social/follow/:username` | User | Follow public account or send follow request if private |
| `DELETE`| `/api/v1/social/follow/:username` | User | Unfollow user |
| `GET` | `/api/v1/social/follow-requests` | User | View pending follow requests (private accounts) |
| `POST` | `/api/v1/social/follow-requests/:id/accept` | User | Accept follow request |
| `POST` | `/api/v1/social/follow-requests/:id/reject` | User | Reject follow request |
| `POST` | `/api/v1/social/block/:username` | User | Block user (removes mutual follows, hides posts & DMs) |
| `DELETE`| `/api/v1/social/block/:username` | User | Unblock user |
| `POST` | `/api/v1/social/mute/:username` | User | Mute user |
| `DELETE`| `/api/v1/social/mute/:username` | User | Unmute user |

---

## 6. Explore, Search & Trending (`/api/v1/explore`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/explore/trending` | Optional | Trending hashtags and topics aggregated over past 24h |
| `GET` | `/api/v1/explore/search` | Optional | Search users, posts, and hashtags with filter (`?q=...&type=posts|users|tags`) |
| `GET` | `/api/v1/explore/hashtag/:tag`| Optional | Posts tagged with specific hashtag |
| `GET` | `/api/v1/explore/who-to-follow`| User | Recommended Indian creators and community accounts |

---

## 7. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | User | Fetch paginated notification feed with unread indicators |
| `GET` | `/api/v1/notifications/unread-count`| User | Quick count badge query |
| `PATCH` | `/api/v1/notifications/mark-all-read`| User | Mark all notifications as read |
| `PATCH` | `/api/v1/notifications/:id/read` | User | Mark single notification as read |
| `GET` | `/api/v1/notifications/preferences` | User | Get current email & push preferences |
| `PATCH` | `/api/v1/notifications/preferences` | User | Update notification preferences |

---

## 8. Direct Messaging (`/api/v1/messages`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/messages/conversations` | User | List active DM conversations with latest message snippet |
| `POST` | `/api/v1/messages/conversations` | User | Initiate 1-to-1 conversation with target user |
| `GET` | `/api/v1/messages/conversations/:id` | User | Get messages history for conversation (cursor paginated) |
| `POST` | `/api/v1/messages/conversations/:id` | User | Send text message or image attachment |
| `PATCH` | `/api/v1/messages/conversations/:id/read` | User | Send read receipt |

---

## 9. Trust, Safety, Moderation & Admin (`/api/v1/moderation`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/moderation/reports` | User | File grievance report against user, post, or message |
| `GET` | `/api/v1/admin/reports` | Admin/Mod | Moderation review queue with filter by status/category |
| `PATCH` | `/api/v1/admin/reports/:id` | Admin/Mod | Update report status (review, resolve, dismiss) |
| `POST` | `/api/v1/admin/actions` | Admin/Mod | Issue sanction (warning, content takedown, suspension, ban) |
| `GET` | `/api/v1/admin/audit-logs` | Admin | Query immutable audit log trail |
| `GET` | `/api/v1/admin/metrics` | Admin | Aggregate platform metrics (DAU, posts/day, active reports) |
| `GET` | `/api/v1/health` | None | System health check (DB, Redis, Worker status) |
