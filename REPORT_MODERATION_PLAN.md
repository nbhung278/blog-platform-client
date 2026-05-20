# Report & Moderation — Implementation Plan

Tính năng báo cáo (report) post & user, kèm hệ quả enforcement (warn / suspend / ban). Tham khảo flow Medium.

---

## 1. Mental Model

3 actor: **reporter** (user thường) → **report** (record) → **moderator** (admin xử lý).

Lifecycle: `report → quyết định của admin → enforcement → user bị chặn ở các touchpoint`.

---

## 2. Schema

### 2.1. Bảng `reports` (polymorphic)

```sql
reports(
  id,
  reporter_id,
  target_type      -- 'post' | 'user' | 'comment' (mở rộng sau)
  target_id,
  reason           -- enum: harassment | spam | rules_violation | ai_generated | other
  details          -- text, optional, cho "different issue"
  status           -- pending | reviewing | resolved | dismissed
  resolution       -- nullable: no_action | content_removed | user_warned | user_suspended | user_banned
  resolved_by      -- admin user_id
  resolved_at,
  created_at
)
```

- **Index**: `(target_type, target_id, status)` để query nhanh "post X có bao nhiêu report pending".
- **Unique**: `(reporter_id, target_type, target_id)` WHERE `status = 'pending'` — 1 user không spam report cùng 1 target khi chưa xử lý xong. Cho phép report lại sau khi resolved.

### 2.2. Bổ sung vào bảng `users`

```sql
status              -- active | warned | suspended | banned (default: active)
suspended_until     -- timestamp, null nếu không suspend
banned_at           -- timestamp
ban_reason          -- text (admin note)
warning_count       -- int default 0, cho policy "3 strikes"
tokens_invalidated_at -- timestamp, để revoke JWT cũ
```

### 2.3. Bảng `user_sanctions` (lịch sử)

1 user có thể bị warn/suspend nhiều lần — cần giữ history.

```sql
user_sanctions(
  id, user_id,
  type           -- warning | suspension | ban
  reason,
  related_report_id,  -- FK nullable
  starts_at, ends_at, -- ends_at null = vĩnh viễn
  issued_by      -- admin id
  lifted_at, lifted_by, -- nếu admin gỡ sớm
  created_at
)
```

`users.status` là **denormalized cache** từ `user_sanctions` để query nhanh. Update mỗi khi sanction được tạo / hết hạn / gỡ.

---

## 3. Frontend — User-side

### 3.1. Report modal (xem screenshot Medium)

- Nút "..." trên post + profile → "Report"
- Modal: radio reasons (Harassment / Rules Violation / Spam / AI-generated / Other)
- Optional textarea cho "different issue"
- Checkbox "Also block the author" (block = feature riêng, scope khác — phase 3)
- Submit → toast "Thanks, we'll review"

### 3.2. Policy

- **Không** cho user thấy status xử lý report (tránh leak moderation, tránh harassment ngược)
- **Rate limit**: ~5 reports/giờ/user để chống abuse

---

## 4. Admin-side (queue + actions)

### 4.1. Views

- **Queue list**: reports `pending`, group theo target (1 post bị 50 report → 1 dòng với count, không phải 50 dòng)
- **Detail view**: content bị report + danh sách reporter + breakdown reasons
- **Filter**: theo `reason`, `target_type`, `status`

### 4.2. 2 nhánh quyết định

**Dismiss (không chấp nhận)**
- `reports.status = dismissed`, `resolution = no_action`
- Reporter: không notify (hoặc notify generic)
- Target: không biết gì cả

**Accept (chấp nhận)** — admin chọn mức:
- `content_removed` — chỉ ẩn post/comment
- `user_warned` — gửi cảnh báo, chưa khoá, `warning_count++`
- `user_suspended` — khoá tạm (vd 7 ngày), set `suspended_until`
- `user_banned` — khoá vĩnh viễn, set `banned_at`

Mỗi action → tạo record `user_sanctions` + update `users.status` + invalidate token.

### 4.3. Audit log

Reuse pattern audit từ permissions refactor — log ai resolve cái gì lúc nào.

### 4.4. Permissions mới (theo permission system hiện tại)

- `moderate_reports` — xem queue
- `take_moderation_action` — dismiss / remove / warn / suspend / ban
- Super-admin only: ban admin khác

---

## 5. Enforcement — User bị chặn ở đâu

Đây là phần dễ bỏ sót. Phải chặn ở **mọi entry point**:

### 5.1. Login flow (password + Google OAuth)

Sau khi auth credential thành công, **trước khi cấp token**:
- `banned` → error "Account banned" + lý do, không cấp token
- `suspended` và `suspended_until > now` → error "Account suspended until X"
- `suspended` và `suspended_until <= now` → auto unsuspend (status=active), cho login

### 5.2. Token đang active (user đang logged-in lúc bị ban)

- **Cách chọn**: thêm `users.tokens_invalidated_at`. JWT có `iat < tokens_invalidated_at` → reject.
- Khi ban: set `tokens_invalidated_at = now()` → toàn bộ token cũ chết ngay lập tức.
- Rẻ hơn so với query `users.status` mỗi request.

### 5.3. OTP flow

- Banned user không được gửi OTP signup/login → check ở endpoint request-OTP
- Forgot password OTP của banned user: cũng chặn

### 5.4. Write endpoints

- Banned/suspended không được create post, comment, reaction, follow, repost...
- Làm middleware `requireActiveUser` apply cho mọi write route
- Read-only: tuỳ policy (Medium cho banned user xem nhưng không tương tác)

### 5.5. Cron/background

- Khi `suspended_until` đến hạn → cron tự set `status=active`
- Reuse cron infrastructure đã có

---

## 6. Hệ quả lên content khi user bị ban

**Quyết định**: ẩn post của banned user ở public feed (nhưng không hard-delete).

- Query public feed: join với `users.status`, nếu `banned` thì không serve
- Khi unban → content tự "sống lại"
- Không migrate hard, không xoá data

---

## 7. Edge cases cần xử lý

- Admin tự ban admin khác → check permission, super-admin only
- Admin tự report mình → block ở backend
- Reporter bị ban → vẫn giữ report họ đã tạo (có thể report đúng dù bản thân vi phạm)
- Race condition: 2 admin cùng resolve 1 report → unique constraint hoặc optimistic lock trên `reports.status`
- Unban: action rõ ràng, set `user_sanctions.lifted_at`, recompute `users.status`

---

## 8. Notifications

- User bị warn/suspend/ban → email + in-app notification + lý do
- Reporter: mặc định không tiết lộ kết quả
- Author bị remove content → notify "your post was removed because..."

---

## 9. Phase Plan

### Phase 1 — MVP

- `reports` table + report modal (post + user)
- `users.status` + `user_sanctions` tables
- Admin queue: dismiss / remove content / ban (chưa cần suspend có thời hạn)
- Enforcement: login check + write middleware + token invalidation via `tokens_invalidated_at`
- Hide post của banned user ở public feed

### Phase 2

- Suspension có `suspended_until` + cron auto-restore
- Warning system với `warning_count` (3 strikes → auto suspend?)
- Notify user khi bị action (email + in-app)
- Group-by-target view cho admin queue

### Phase 3

- Block user (user-to-user, khác moderation system)
- Appeal flow (user khiếu nại sau khi bị action)
- Auto-action threshold (N reports cùng reason → auto-hide chờ review)

---

## 10. Câu hỏi cần chốt trước khi code

- [ ] Banned user có được xem content không (read-only) hay block hoàn toàn?
- [ ] Notify reporter sau khi resolve hay im lặng?
- [ ] Warning count threshold trước khi auto-suspend? (3? 5?)
- [ ] Suspension default duration? (7 ngày? Cho admin chọn?)
- [ ] Email template cho từng loại action
- [ ] Có cần "soft ban" (shadowban — user vẫn login được nhưng content không ai thấy)?

---

## 11. File / Module dự kiến cần đụng

### Backend
- Migrations: `reports`, `user_sanctions`, alter `users`
- Models + services: `ReportService`, `SanctionService`
- Middleware: `requireActiveUser`, update JWT verify để check `tokens_invalidated_at`
- Routes: `/reports` (create), `/admin/reports` (list, resolve)
- Cron: auto-restore suspended users

### Frontend (blog-platform-frontend)
- Report modal component
- "..." menu trên post card + profile
- Toast/notification component (đã có)
- (Phase 2) In-app notification cho user bị action

### Admin (blog-platform-admin)
- Reports queue page
- Report detail page
- Sanction actions UI (dismiss / remove / warn / suspend / ban modals)
- User sanctions history view trong user detail page
- Permission gates với `moderate_reports`, `take_moderation_action`
