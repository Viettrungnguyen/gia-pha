---
project: NguyenDinhHoaNgai
path: docs/02-design/SECURITY-PRIVACY.md
type: security-design
version: 1.0.0
updated: 2026-07-23
owner: "@dev-team"
status: draft
---

# Security & Privacy Design

## 1. Tổng quan

Bảo mật dự án dựa trên **3 lớp phòng thủ** (defense in depth):

1. **Middleware (proxy.ts)** - chặn truy cập `/admin/**` nếu không phải admin.
2. **RLS Supabase (DB level)** - chặn INSERT/UPDATE/DELETE nếu không phải admin.
3. **UI (client side)** - ẩn nút CRUD nếu không phải admin.

## 2. Threat Model

### 2.1 Tài sản cần bảo vệ

- **Dữ liệu thành viên** (PII: tên, ngày sinh, nơi ở, liên hệ).
- **Dữ liệu tài liệu** (ảnh gia đình, giấy tờ).
- **Tài khoản admin** (credentials).

### 2.2 Kẻ tấn công

- **Khách vô danh:** tìm cách ghi dữ liệu qua API trực tiếp.
- **User đăng nhập không phải admin:** cố truy cập `/admin/**`.
- **Bot / scraper:** scrape dữ liệu hàng loạt.
- **Attacker có service role key:** nếu lộ qua env hoặc commit nhầm.

### 2.3 Khả năng chấp nhận

- Tất cả thông tin thành viên + tài liệu đã được dòng họ đồng ý công khai.
- Có thể chấp nhận scrape nếu không quá tải Supabase.
- **Không chấp nhận** bất kỳ ai ngoài admin ghi dữ liệu.

## 3. Auth Flow

### 3.1 Đăng ký / Tạo tài khoản admin

- **Không có form đăng ký công khai.**
- Admin đầu tiên được tạo thủ công trong Supabase Dashboard:
  1. Vào `Authentication → Users → Add user → Create new user`.
  2. Email + password, bật "Auto Confirm User".
  3. Trigger `on_auth_user_created` tự động tạo row trong `profiles` với `role='admin'`.

### 3.2 Đăng nhập

```
┌─────────────────┐
│ User            │
│ nhập email/pwd  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Frontend gọi supabase.auth       │
│ .signInWithPassword(email, pwd)  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Supabase Auth                    │
│ - Verify email/password          │
│ - Tạo session JWT                │
│ - Set cookie HttpOnly            │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ proxy.ts (Next.js middleware)    │
│ - Đọc cookie session            │
│ - Query profiles.role            │
│ - Nếu admin → cho vào /admin    │
│ - Nếu không → redirect /        │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Admin vào /admin                 │
│ - CRUD qua data layer            │
│ - Mỗi query enforce RLS         │
└──────────────────────────────────┘
```

### 3.3 Đăng xuất

- Client gọi `supabase.auth.signOut()`.
- Supabase xóa session cookie.
- Redirect về `/`.

## 4. Privacy Settings (Future)

Theo BR-01, hiện tại **mọi thông tin là công khai**. Nếu sau này muốn giới hạn:

### 4.1 Thêm cột `privacy_level`

```sql
ALTER TABLE people ADD COLUMN privacy_level SMALLINT DEFAULT 0
  CHECK (privacy_level IN (0, 1, 2));
-- 0 = công khai, 1 = thành viên (đăng nhập), 2 = admin only

ALTER TABLE clan_documents ADD COLUMN privacy_level SMALLINT DEFAULT 0
  CHECK (privacy_level IN (0, 1, 2));
```

### 4.2 Đổi RLS policy

```sql
DROP POLICY "people_select_all" ON people;
CREATE POLICY "people_select_with_privacy" ON people
  FOR SELECT USING (
    privacy_level = 0
    OR (privacy_level = 1 AND auth.uid() IS NOT NULL)
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );
```

### 4.3 UI control

Trong form admin, thêm dropdown "Quyền riêng tư" với 3 lựa chọn tương ứng.

## 5. File Upload Security

### 5.1 RLS Storage

Đã định nghĩa ở [DATA-MODEL.md §4.3](DATA-MODEL.md#43-storage-rls).

### 5.2 Validation phía client (UX, không phải security)

```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',  // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
  'video/mp4', 'video/webm',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File quá lớn (tối đa 50MB). File của bạn: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Định dạng không hỗ trợ: ${file.type}`;
  }
  return null;
}
```

### 5.3 Sanitize tên file

```typescript
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
}

const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
```

### 5.4 Upload Flow

```
1. Admin chọn file trong form
2. Client validate MIME + size (toast lỗi nếu fail)
3. Client upload file lên Storage bucket 'clan-documents' (Supabase client)
4. RLS check: nếu user.role != 'admin' → INSERT fail
5. Nếu thành công, lấy public URL
6. Insert row vào clan_documents với file_url
7. UI refresh danh sách
```

## 6. Secrets Management

### 6.1 Env vars

| Name | Prefix | Where |
|------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | NEXT_PUBLIC_ | Vercel Production/Preview/Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | NEXT_PUBLIC_ | Vercel Production/Preview/Dev |

**KHÔNG BAO GIỜ** dùng `SUPABASE_SERVICE_ROLE_KEY` ở client. Service role bypass RLS, chỉ dùng ở backend scripts (nếu có, và không có trong MVP).

### 6.2 `.env.example`

```env
# Lấy từ Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 6.3 `.gitignore`

```
.env
.env.local
.env.*.local
.vercel
node_modules
.next
*.log
```

## 7. Cookie Configuration

Supabase SSR tự cấu hình cookie HttpOnly, secure (production), sameSite=lax.

Cookie name pattern: `sb-{hostname-part}-auth-token`.

Để verify, mở DevTools → Application → Cookies khi đã đăng nhập.

## 8. Rate Limiting

Trong MVP, không cần rate limiting phía app vì:

- Form đăng nhập hiển thị công khai nhưng chỉ admin biết URL.
- Supabase Auth có rate limit built-in (60 requests/hour per IP cho signin).

Nếu sau này phát hiện abuse, thêm rate limit trong `proxy.ts`:

```typescript
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMITS = { '/dang-nhap': { max: 10, windowMs: 60_000 } };
```

## 9. CSRF

Next.js App Router tự bảo vệ CSRF cho Server Actions và Route Handlers. Form submit thông thường dùng POST + origin check.

## 10. XSS

- React tự escape khi render string vào JSX.
- Không dùng `dangerouslySetInnerHTML` ngoài các trường hợp đã whitelist (ví dụ: nội dung bài viết markdown từ admin).
- Tài liệu user-upload: nếu sau này cho phép hiển thị nội dung, sanitize DOMPurify.

## 11. SQL Injection

- Supabase client dùng parameterized queries.
- KHÔNG BAO GIỜ string concatenate user input vào SQL.
- Nếu dùng RPC function, validate input ở function.

## 12. Audit Logging (Optional MVP+)

Nếu sau này cần audit log, thêm bảng `audit_log`:

```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  action      VARCHAR(50),  -- 'create'|'update'|'delete'
  table_name  VARCHAR(50),
  record_id   UUID,
  changes     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Trigger ghi log mỗi UPDATE/DELETE trên `people`, `events`, `clan_documents`.

Trong MVP, dùng Supabase built-in logs (Dashboard → Logs → API).

## 13. Backup

- Supabase tự backup DB hàng ngày (chỉ Pro plan; free tier dùng Point-in-Time Recovery trong 7 ngày).
- Admin có thể export DB thủ công: `Dashboard → Settings → Database → Download backup`.
- Lưu backup local ở nơi an toàn (password manager, cloud storage cá nhân).

## 14. Incident Response

Nếu phát hiện:

- **Lộ admin credentials:** đổi password ngay trong Supabase Dashboard → Authentication → Users.
- **Lộ anon key:** rotate trong Dashboard → Settings → API → Generate new anon key. Update env trên Vercel.
- **Data bị sửa sai:** restore từ backup Supabase (Dashboard → Database → Backups).
- **Service down:** check status.supabase.com và vercel.com/status.

## 15. Liên kết

- [DATA-MODEL.md §4](DATA-MODEL.md#4-rls-policies) - RLS chi tiết.
- [TECHNICAL-DESIGN.md §5](TECHNICAL-DESIGN.md#5-middleware--auth-flow) - Middleware.
- [BRD.md §BR-01](../01-planning/BRD.md) - Quyết định công khai.