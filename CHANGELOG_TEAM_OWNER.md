# Tóm tắt Thay đổi - Quyền Hạn Chủ Đội Bóng

## 📋 Danh sách File Thay đổi

### ✅ File Mới Tạo

1. **`server/src/middleware/teamOwner.js`**
   - Middleware xác thực quyền chủ đội
   - Kiểm tra user chỉ có thể quản lý đội của mình
   - Cho phép Admin toàn quyền

### 🔄 File Cập nhật

2. **`server/src/routes/teams.js`**

   - Thêm import: `const teamOwnerMiddleware = require("../middleware/teamOwner");`
   - POST `/api/teams`: Lưu `team_id` khi team_owner đăng ký đội
   - PUT `/api/teams/:id`: Thêm `teamOwnerMiddleware`
   - DELETE `/api/teams/:id`: Thêm `teamOwnerMiddleware`

3. **`server/src/routes/schedules.js`**
   - Thêm import: `const admin = require("../middleware/admin");`
   - POST `/api/schedules`: Thêm `admin` middleware
   - PUT `/api/schedules/:id`: Thêm `admin` middleware
   - DELETE `/api/schedules/:id`: Thêm `admin` middleware

### 📊 Database Migration

- Chạy: `ALTER TABLE users ADD COLUMN team_id INTEGER REFERENCES teams(id);`
- Kết quả: ✅ Hoàn tất (đã thêm cột `team_id` vào bảng `users`)

---

## 🎯 Chức Năng Chính

### Quyền Hạn Chủ Đội (Team Owner)

- ✅ Xem tất cả các đội
- ✅ Đăng ký đội mới
- ✅ **Chỉ sửa đội của mình**
- ✅ **Chỉ xóa đội của mình**
- ❌ Quản lý lịch thi đấu
- ❌ Ghi nhận kết quả trận
- ❌ Quản lý người dùng

### Admin (System/Tournament)

- ✅ Toàn quyền tất cả
- ✅ Quản lý tất cả các đội
- ✅ Quản lý lịch thi đấu
- ✅ Ghi nhận kết quả trận
- ✅ Quản lý người dùng

### Viewer

- ✅ Xem tất cả thông tin
- ❌ Không thể đăng ký đội
- ❌ Không thể sửa/xóa đội

---

## 🔍 Cách Kiểm tra

### Kiểm tra 1: Team Owner sửa đội của mình

```
1. Đăng nhập với account "chủ đội"
2. PUT /api/teams/{team_id_của_họ}
3. Kết quả: 200 OK ✓
```

### Kiểm tra 2: Team Owner sửa đội khác

```
1. Đăng nhập với account "chủ đội 1"
2. PUT /api/teams/{team_id_của_đội_khác}
3. Kết quả: 403 Forbidden ✗
```

### Kiểm tra 3: Viewer không thể quản lý đội

```
1. Đăng nhập với account "khán giả"
2. PUT /api/teams/1
3. Kết quả: 403 Forbidden ✗
```

### Kiểm tra 4: Admin có toàn quyền

```
1. Đăng nhập với account "admin"
2. PUT /api/teams/1 (bất kỳ đội nào)
3. Kết quả: 200 OK ✓
```

---

## ⚙️ Chi tiết Kỹ thuật

### Middleware teamOwner.js

```javascript
// Roles được cho phép trực tiếp:
- system_admin → next()
- tournament_admin → next()

// Role team_owner:
- Kiểm tra: user.team_id === params.id
- Nếu đúng → next()
- Nếu sai → 403 Forbidden

// Role khác:
- 403 Forbidden
```

### Database Schema

```
users table
├── id (PK)
├── username
├── password
├── role (viewer | team_owner | tournament_admin | system_admin)
├── team_id (FK) ← NEW
├── full_name
├── email
├── dob
└── position
```

### API Response Examples

**Thành công (200 OK)**

```json
{
  "message": "Team updated successfully!",
  "teamId": 1
}
```

**Bị từ chối (403 Forbidden)**

```json
{
  "error": "Bạn chỉ có quyền quản lý đội bóng của mình."
}
```

---

## 📝 Lưu ý

1. **Team Owner có team_id**: Khi đăng ký đội, hệ thống tự động lưu `team_id` vào user
2. **Admin không bị hạn chế**: `team_id` không ảnh hưởng đến admin
3. **Existing users**: User hiện tại sẽ có `team_id = NULL` cho đến khi đăng ký đội mới
4. **One team per owner**: Mỗi owner chỉ quản lý 1 đội (nếu muốn nhiều đội, cần junction table)

---

## ✨ Status

- ✅ Database migration hoàn tất
- ✅ Middleware tạo mới
- ✅ Routes cập nhật
- ✅ Kiểm tra syntax - No errors
- ✅ Tài liệu viết xong
- 🔄 Ready for testing
