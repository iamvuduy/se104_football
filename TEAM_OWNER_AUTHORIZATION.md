# Triển khai Quyền Hạn Chủ Đội Bóng (Team Owner Authorization)

## Mô tả Yêu cầu

Vai trò **chủ đội bóng** (team_owner) chỉ có quyền quản lý thông tin của đội mà mình đã đăng ký, không có quyền sửa đổi thông tin của các đội khác.

## Các Thay đổi Thực hiện

### 1. Cơ sở Dữ liệu (Database)

**File**: `server/database/database.sqlite`

#### Thêm cột `team_id` vào bảng `users`

```sql
ALTER TABLE users ADD COLUMN team_id INTEGER REFERENCES teams(id);
```

**Mục đích**: Liên kết mỗi người dùng với đội bóng mà họ quản lý (nếu họ là team_owner).

---

### 2. Middleware Xác thực Quyền (Authorization Middleware)

**File**: `server/src/middleware/teamOwner.js` (NEW)

```javascript
const teamOwnerMiddleware = (req, res, next) => {
  // - System Admin & Tournament Admin: toàn quyền
  // - Viewer: không có quyền
  // - Team Owner: chỉ có quyền quản lý đội của mình
};
```

**Cách sử dụng**:

```javascript
router.put("/:id", teamOwnerMiddleware, updateTeamHandler);
router.delete("/:id", teamOwnerMiddleware, deleteTeamHandler);
```

**Xác thực**:

- Kiểm tra `req.params.id` (team_id) có bằng `req.user.team_id` không
- Nếu không, trả về lỗi 403 (Forbidden)
- System Admin & Tournament Admin tự động vượt qua

---

### 3. Cập nhật Routes Đội Bóng (Teams)

**File**: `server/src/routes/teams.js`

#### 3.1 POST `/api/teams` - Đăng ký Đội (Không thay đổi quyền, nhưng lưu team_id)

```javascript
// Khi chủ đội đăng ký thành công, lưu team_id vào user
if (req.user?.role === "team_owner") {
  db.run(`UPDATE users SET team_id = ? WHERE id = ?`, [teamId, req.user.id]);
}
```

#### 3.2 PUT `/api/teams/:id` - Chỉnh sửa Thông tin Đội

```javascript
router.put("/:id", teamOwnerMiddleware, async (req, res) => {
  // Chỉ team_owner có quyền sửa đội của họ
}
```

#### 3.3 DELETE `/api/teams/:id` - Xóa Đội

```javascript
router.delete("/:id", teamOwnerMiddleware, (req, res) => {
  // Chỉ team_owner có quyền xóa đội của họ
}
```

---

### 4. Bảo vệ Routes Lịch thi đấu (Schedules)

**File**: `server/src/routes/schedules.js`

Thêm `admin` middleware vào các route modify:

#### 4.1 POST `/api/schedules`

```javascript
router.post("/", admin, (req, res) => {
  // Chỉ admin có thể tạo lịch thi đấu
}
```

#### 4.2 PUT `/api/schedules/:id`

```javascript
router.put("/:id", admin, (req, res) => {
  // Chỉ admin có thể sửa lịch thi đấu
}
```

#### 4.3 DELETE `/api/schedules/:id`

```javascript
router.delete("/:id", admin, (req, res) => {
  // Chỉ admin có thể xóa lịch thi đấu
}
```

---

## Luồng Hoạt động

### 1. Đăng ký Đội Bóng (Register Team)

```
Chủ đội (team_owner) → POST /api/teams (với dữ liệu đội + cầu thủ)
                    ↓
        Server lưu team mới, lấy teamId
        Server cập nhật: UPDATE users SET team_id = teamId WHERE user_id = x
                    ↓
        Trả về: { message: "Team registered successfully!", teamId }
```

### 2. Chỉnh sửa Thông tin Đội (Edit Team)

```
Chủ đội → PUT /api/teams/{teamId} (với dữ liệu cập nhật)
       ↓
Middleware teamOwnerMiddleware kiểm tra:
  - Nếu user.team_id == teamId → Cho phép ✓
  - Nếu user.team_id != teamId → Trả về 403 Forbidden ✗
       ↓
Nếu được phép: cập nhật thông tin đội
Nếu bị từ chối: trả về { error: "Bạn chỉ có quyền quản lý đội bóng của mình." }
```

### 3. Xóa Đội Bóng (Delete Team)

```
Chủ đội → DELETE /api/teams/{teamId}
       ↓
Middleware teamOwnerMiddleware kiểm tra quyền (tương tự Edit)
       ↓
Nếu được phép: xóa đội + toàn bộ cầu thủ của đội
```

---

## Ma trận Quyền Hạn (Permission Matrix)

| Hành động               | System Admin | Tournament Admin |   Team Owner   | Viewer |
| ----------------------- | :----------: | :--------------: | :------------: | :----: |
| GET /teams              |      ✓       |        ✓         |       ✓        |   ✓    |
| POST /teams (Đăng ký)   |      ✓       |        ✓         |       ✓        |   ✗    |
| PUT /teams/:id (Sửa)    |      ✓       |        ✓         | Chỉ đội của họ |   ✗    |
| DELETE /teams/:id (Xóa) |      ✓       |        ✓         | Chỉ đội của họ |   ✗    |
| POST /schedules         |      ✓       |        ✓         |       ✗        |   ✗    |
| PUT /schedules/:id      |      ✓       |        ✓         |       ✗        |   ✗    |
| DELETE /schedules/:id   |      ✓       |        ✓         |       ✗        |   ✗    |

---

## Lỗi Trả về (Error Responses)

### 403 Forbidden - Chủ đội cố gắng sửa đội khác

```json
{
  "error": "Bạn chỉ có quyền quản lý đội bóng của mình."
}
```

### 403 Forbidden - Viewer cố gắng quản lý đội

```json
{
  "error": "Bạn không có quyền quản lý các đội bóng."
}
```

### 403 Forbidden - Chủ đội cố gắng quản lý lịch thi đấu

```json
{
  "error": "Bạn không có quyền thực hiện thao tác này."
}
```

---

## Cách Kiểm tra (Testing)

### Test 1: Chủ đội sửa đội của mình

```bash
# Đăng nhập với account team_owner
POST /api/auth/login
{ "username": "owner1", "password": "password" }
→ Nhận token

# Gọi API sửa đội
PUT /api/teams/1
Authorization: Bearer <token>
{ "teamCode": "FC001", "teamName": "Team A", ... }
→ Response: 200 OK (Thành công)
```

### Test 2: Chủ đội cố sửa đội khác

```bash
# Đăng nhập với account team_owner (team_id = 1)
PUT /api/teams/2  # Sửa đội khác
Authorization: Bearer <token>
→ Response: 403 Forbidden
{ "error": "Bạn chỉ có quyền quản lý đội bóng của mình." }
```

### Test 3: Viewer không thể quản lý đội

```bash
# Đăng nhập với account viewer
PUT /api/teams/1
Authorization: Bearer <token>
→ Response: 403 Forbidden
{ "error": "Bạn không có quyền quản lý các đội bóng." }
```

### Test 4: Admin có toàn quyền

```bash
# Đăng nhập với account system_admin hoặc tournament_admin
PUT /api/teams/1
Authorization: Bearer <token>
→ Response: 200 OK (Thành công, không phụ thuộc vào team_id)
```

---

## Ghi chú Quan trọng

1. **Cột `team_id` có thể NULL**: Khi user không phải team_owner, `team_id` sẽ là NULL.
2. **Một user, một đội**: Hiện tại mỗi team_owner chỉ có thể quản lý một đội. Nếu cần quản lý nhiều đội, cần thiết kế lại (ví dụ bảng `user_teams` junction table).
3. **Backward Compatibility**: Các user hiện tại sẽ có `team_id = NULL` cho đến khi họ đăng ký một đội mới.
4. **Admin Always Allowed**: System Admin và Tournament Admin không bị hạn chế bởi `team_id`.

---

## Liên hệ & Hỗ trợ

Để biết thêm thông tin về quyền hạn chi tiết, xem file `server/src/services/permissionsService.js`.
