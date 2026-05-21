# Strix — Public Client

SPA cho readers + authors của Strix blog. Browse posts, write/publish (Tiptap), follow, comment, DM, nhận realtime notifications.

**Stack**: React 19 + Vite + TanStack Router/Query + Zustand + Tailwind 4 + TipTap + DOMPurify + axios.

> Đọc [../CLAUDE.md](../CLAUDE.md) ở root project để nắm overview kiến trúc, cookie protocol, deploy workflow.

## Quick start

```bash
# Prerequisites: Bun ≥ 1.2, backend running

bun install
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
bun run dev               # http://localhost:5173
```

## Scripts

| Command | What |
| --- | --- |
| `bun run dev` | Vite dev server (CSP meta tự strip qua plugin) |
| `bun run build` | Type-check + production bundle |
| `bun run preview` | Preview production build local |
| `bun run check` | tsc + eslint + prettier check |

## Project layout

```
src/
  api/client.ts              # axios + auto-refresh on 401 + CSRF inject
  App.tsx                    # mount Notify, kick off loadMe + useRealtime
  main.tsx                   # Vite entry
  components/
    blog/                    # cards, FollowButton, sidebar, skeletons
    chat/                    # DM: ConversationList, MessageThread, MessageInput
    editor/PostEditor.tsx    # TipTap wrapper (95% giống admin's PostEditor)
    layout/                  # SiteHeader, NotificationBell, UserMenu
    ui/                      # Skeleton, Button, EmptyState, ...
    RequireAuth.tsx          # route guard
    Notify.tsx               # Sonner mount
  hooks/
    useAuth.ts useBookmark.ts useClap.ts useComments.ts useChat.ts
    useFollows.ts useNotifications.ts usePosts.ts useUsers.ts
    useRealtime.ts           # WebSocket + cache sync
    useReadingProgress.ts useAutoSave.ts
  lib/
    sanitize.ts              # sanitizeHtml + safeImageUrl (KEEP IN SYNC với admin)
    authConstants.ts         # ⚠ KEEP IN SYNC với backend cookies.ts + admin
    apiErrors.ts notify.ts password-rules.ts uploadsApi.ts
  routes/                    # TanStack file-based routing
    home.tsx login.tsx register.tsx
    blog.$username.tsx       # /blog/:username (author profile)
    blog.$username.$slug.tsx # /blog/:user/:slug (post detail — has dangerouslySetInnerHTML)
    category.$name.tsx search.tsx editor.tsx
    notifications.tsx saved.tsx
    chat.tsx chat.$conversationId.tsx
    settings.profile.tsx forgot-password.tsx reset-password.tsx
    auth.google-success.tsx
  stores/auth.store.ts       # zustand store, loadMe single-flight
vite.config.ts               # có stripCspInDev plugin: meta CSP gỡ ở dev, giữ ở build
```

## Key patterns

- **Auth state**: hydrated từ `/auth/me` lúc mount, không persist localStorage. Cookies là source of truth.
- **Auto-refresh**: interceptor catches 401, single-flight `/auth/refresh`, retry original. Fail → `onAuthLost` clear state.
- **CSRF**: read `web_csrf` cookie once, cache module-scope, invalidate sau login/refresh/logout/403.
- **WebSocket**: `useRealtime()` 1 socket per `userId`. Stop reconnect khi nhận close code 1008/4xxx (server reject).
- **XSS hardening**: post HTML qua `sanitizeHtml` (DOMPurify). User-controlled URLs qua `safeImageUrl` (reject `javascript:` + relative).

## Deploy

Xem [../scripts/DEPLOY.md](../scripts/DEPLOY.md). Build artifacts đi S3 `strix-blog-frontend` → CloudFront → `strix-blog.uk`.

```bash
./scripts/deploy-frontend.sh   # build + S3 sync + CloudFront invalidate + smoke test
```

`VITE_API_URL` baked at build time. Backend phải include URL deployed trong `APP_URL` (CORS + WS origin allowlist).

CSP: meta CSP trong `index.html` áp dụng production. Strict allowlist: `img-src` chỉ cho CDN/S3/Google avatars; `connect-src` chỉ `api.strix-blog.uk` + cloudflareinsights. Vite plugin `stripCspInDev` xoá meta khi `vite dev` để dev local gọi `localhost:3000` không bị block.
