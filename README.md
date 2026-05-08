# Strix — Public Client

The reader/author-facing SPA for the Strix blog platform. Lets visitors browse posts, authenticated users write and publish, follow other authors, message each other, and receive realtime notifications.

## Stack

- **React 19** + **Vite**
- **TanStack Router** (code-split routes)
- **TanStack Query** for server state
- **Zustand** for auth state
- **Tailwind CSS v4**
- **Tiptap** (rich-text editor)
- **DOMPurify** (sanitize Tiptap HTML before rendering)
- **Sonner** for toast notifications
- WebSocket client for live notifications + DMs (auto-reconnect with exponential backoff)
- **Source Serif 4** for post body, **Playfair Display** for branding/headings

## Features

- Public feed, per-author profile, per-category and search pages
- Auth: login / register, auto-refresh on 401, CSRF double-submit, route guards
- Editor (Tiptap) for drafts → submit-for-review flow
- Cover image upload to backend (proxies to S3/MinIO; sharp resize + WebP)
- Follow / unfollow authors with email-notification toggle
- Bookmarks ("Saved" page) + claps (Medium-style)
- Comments with replies (1-level nesting), comment claps
- Direct messaging: 1:1 conversations with reactions, edit, delete
- Bell with unread count + popover; full `/notifications` page; live updates over WebSocket
- Skeleton loaders on all main routes (matches site's cream/beige theme)

## Prerequisites

- [Bun](https://bun.sh/) ≥ 1.2
- The backend running locally (see `../blog-platform-backend`)

## Setup

```bash
bun install

cp .env.example .env
# VITE_API_URL=http://localhost:3000/api  (default — adjust if backend runs elsewhere)

bun run dev
```

Default dev URL: <http://localhost:5173>.

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Vite dev server with HMR |
| `bun run build` | Type-check + production bundle |
| `bun run preview` | Preview production build locally |
| `bun run lint` | ESLint |

## Architecture notes

- **Auth state** is hydrated from the backend's `/auth/me` on app mount — no localStorage persistence. Cookies are the source of truth, the store just mirrors them in memory.
- **Auto-refresh**: `src/api/client.ts` interceptor catches 401, calls `/auth/refresh` once (single-flight), retries the original request. If refresh fails, an `onAuthLost` callback clears auth state immediately.
- **CSRF cache**: read once from cookie, invalidated after login / refresh / logout / 403 CSRF mismatch.
- **WebSocket**: `useRealtime()` opens one socket once `userId` is set. Listens for `notification`, `unread_count`, `chat_message`, `message_reaction`, `message_edit`, `message_delete` events; updates React Query caches directly so badges + threads stay in sync.
- **XSS hardening**: post HTML is sanitized via `sanitizeHtml`. User-controlled URLs (avatars, covers) go through `safeImageUrl` which rejects anything that isn't `http(s):`.
- **Skeleton vs spinner**: all main loading states use shape-matched skeleton components instead of "Loading…" text. See `src/components/ui/Skeleton.tsx` and the route-specific skeletons in `components/blog/`, `components/chat/`, `components/layout/`.

## Project layout

```
src/
  api/client.ts              # axios instance + auto-refresh + CSRF interceptors
  App.tsx                    # mount Notify, kick off loadMe + useRealtime
  components/
    blog/                    # cards, FollowButton, sidebar items, skeletons
    chat/                    # DM components: ConversationList, MessageThread, MessageInput
    editor/                  # Tiptap wrapper
    layout/                  # SiteHeader, SiteFooter, NotificationBell, UserMenu
    ui/                      # Skeleton primitive, Button, Input, Pagination, EmptyState
    Notify.tsx               # Sonner mount point
    RequireAuth.tsx          # gate for protected routes
  hooks/
    useAuth.ts               # login / register / logout mutations
    useBookmark.ts useClap.ts useComments.ts
    useChat.ts               # conversations + messages + reactions
    useFollows.ts            # follow state + mutations
    useNotifications.ts      # list, mark-read, mark-all-read
    usePosts.ts              # feed, search, single, by-user, by-category
    useRealtime.ts           # WebSocket connection + cache sync
    useUpdateProfile.ts useUsers.ts
  lib/
    sanitize.ts              # sanitizeHtml + safeImageUrl
    notify.ts                # toast wrapper
    apiErrors.ts             # error message extractor
    password-rules.ts        # validation rules (mirrors backend)
  routes/
    index.tsx                # routeTree
    home.tsx                 # /
    login.tsx register.tsx
    blog.$username.tsx       # /blog/:username
    blog.$username.$slug.tsx # /blog/:username/:slug (post detail)
    category.$name.tsx       # /category/:name
    search.tsx               # /search?q=...
    editor.tsx               # /editor/new and /editor/:postId
    notifications.tsx        # /notifications
    saved.tsx                # /saved (bookmarks)
    chat.tsx                 # /chat (conversation list)
    chat.$conversationId.tsx # /chat/:id (single thread)
    settings.profile.tsx     # /settings/profile
  stores/auth.store.ts       # zustand store + loadMe + initialized flag
```

## Deploying

- `bun run build` → static site in `dist/`
- Hosted on AWS S3 + CloudFront (see `../scripts/DEPLOY.md`)
- `./scripts/deploy-frontend.sh` handles build + S3 sync + CloudFront invalidation
- Set `VITE_API_URL` to the production API origin **at build time** (Vite inlines env vars at build, not runtime)
- The backend must include the deployed URL in `APP_URL` so CORS + WebSocket origin checks pass

## Roadmap

See `ROADMAP.md` for performance/UX improvements (skeleton loaders, image optimization, etc.) — most done as of 2026-05-08.
