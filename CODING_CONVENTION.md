# Coding Conventions & Best Practices

Tài liệu này quy định các chuẩn mực viết mã (coding conventions) cho dự án quản lý giải đấu bóng đá. Mục tiêu là đảm bảo mã nguồn đồng nhất, dễ đọc, dễ bảo trì và giảm thiểu lỗi.

## 1. Quy tắc chung (General Rules)

### 1.1. Định dạng (Formatting)

- **Indentation (Thụt đầu dòng):** Sử dụng **2 spaces** (không dùng tab).
- **Line Length (Độ dài dòng):** Giới hạn mỗi dòng khoảng 80-100 ký tự.
- **Line Endings:** Sử dụng LF (Unix style) cho tất cả các file.
- **Encoding:** UTF-8 without BOM.
- **Semicolons:** **Luôn sử dụng dấu chấm phẩy (;)** ở cuối câu lệnh.
- **Quotes:** Sử dụng **Double Quotes (")** cho chuỗi (string) trong JavaScript để thống nhất với phần lớn code hiện tại (App.js, server files).
  - _Ngoại lệ:_ Sử dụng Single Quotes (') nếu chuỗi chứa ký tự " để tránh escape.

### 1.2. Comments

- Viết comment bằng tiếng Anh hoặc tiếng Việt (ưu tiên tiếng Việt cho team nội bộ).
- Comment giải thích "Tại sao" (Why) thay vì "Cái gì" (What).
- Sử dụng `//` cho single-line comment và `/* ... */` cho multi-line comment.
- **TODO:** Sử dụng `// TODO:` để đánh dấu các phần việc cần làm hoặc cải thiện sau này.

## 2. Quy ước đặt tên (Naming Conventions)

### 2.1. Files & Directories

- **React Components:** PascalCase (Ví dụ: `PlayerLeaderboard.js`, `TeamList.js`).
- **Non-component JS files:** camelCase (Ví dụ: `database.js`, `auth.js`, `permissions.js`).
- **CSS Files:** PascalCase trùng tên với Component (Ví dụ: `PlayerLeaderboard.css`).
- **Directories:** camelCase (Ví dụ: `components/`, `routes/`, `services/`).

### 2.2. Variables & Functions

- **Variables:** camelCase (Ví dụ: `allPlayers`, `teamCode`).
  - Boolean nên bắt đầu bằng `is`, `has`, `should` (Ví dụ: `isLoading`, `hasError`).
- **Functions:** camelCase, động từ đứng đầu (Ví dụ: `getPlayers`, `handleSubmit`, `calculateScore`).
- **Constants:** UPPER_SNAKE_CASE (Ví dụ: `ITEMS_PER_PAGE`, `MAX_PLAYERS`).
- **React Components:** PascalCase (Ví dụ: `const PlayerLeaderboard = () => { ... }`).

### 2.3. Database (SQLite)

- **Table Names:** snake_case, số nhiều (Ví dụ: `teams`, `players`, `match_results`).
- **Column Names:** snake_case (Ví dụ: `team_code`, `home_stadium`, `created_at`).

## 3. Cấu trúc Dự án (Project Structure)

Dự án được chia thành hai phần chính: `client` (Frontend) và `server` (Backend).

### 3.1. Client (`/client`)

Mã nguồn Frontend được đặt trong thư mục `src`.

- **`src/components/`**: Chứa các React Components.
  - Mỗi component nên bao gồm file logic (`.js`) và file style (`.css`) nếu cần.
  - Ví dụ: `TeamList.js` và `TeamList.css`.
- **`src/context/`**: Chứa các React Context để quản lý global state (ví dụ: `AuthContext.js` quản lý đăng nhập).
- **`src/utils/`**: Chứa các hàm tiện ích, helpers, hoặc constants dùng chung (ví dụ: `permissions.js`, `roles.js`).
- **`src/App.js`**: Component gốc, nơi định nghĩa Routing (React Router).
- **`public/`**: Chứa các file tĩnh (index.html, images, manifest).

### 3.2. Server (`/server`)

Mã nguồn Backend được đặt trong thư mục `src`.

- **`src/routes/`**: Định nghĩa các API endpoints.
  - Mỗi file đại diện cho một nhóm chức năng (ví dụ: `teams.js` cho các API liên quan đến đội bóng).
  - Logic xử lý request/response nằm tại đây (hoặc gọi đến Service).
- **`src/middleware/`**: Các hàm trung gian xử lý request (Authentication, Authorization, Logging).
  - Ví dụ: `auth.js` (xác thực token), `admin.js` (kiểm tra quyền admin).
- **`src/services/`**: (Khuyến khích) Chứa logic nghiệp vụ phức tạp, tách biệt khỏi Routes để dễ kiểm thử và tái sử dụng.
- **`src/database.js`**: File cấu hình kết nối cơ sở dữ liệu SQLite.
- **`scripts/`**: Các script tiện ích chạy độc lập (ví dụ: `cleanup_schedules.js`, `fix_ranking_criteria.js`).
- **`database/`**: Thư mục chứa file CSDL SQLite (`.sqlite` hoặc `.db`).

## 4. Frontend (React - Client)

### 3.1. Structure

- Sử dụng **Functional Components** và **Hooks** (`useState`, `useEffect`, `useMemo`, ...). Hạn chế dùng Class Components.
- Mỗi component nên được đặt trong một file riêng biệt trong thư mục `src/components/`.
- CSS nên được import trực tiếp vào file component tương ứng.

### 3.2. JSX

- Sử dụng destructuring cho props.
- Tên prop sự kiện nên bắt đầu bằng `on` (Ví dụ: `onClick`, `onChange`).
- Hàm xử lý sự kiện nên bắt đầu bằng `handle` (Ví dụ: `handleClick`, `handleInputChange`).

```javascript
// Tốt
const UserProfile = ({ user, onUpdate }) => {
  const handleSave = () => {
    onUpdate(user);
  };

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

### 3.3. State Management

- Sử dụng `useState` cho local state.
- Sử dụng Context API (`src/context/`) cho global state (như AuthContext).
- Tránh lạm dụng `useEffect`, chỉ dùng khi cần thiết (side effects).

### 3.4. API Calls

- Sử dụng `axios` cho các HTTP requests.
- Xử lý lỗi (try/catch hoặc .catch) cho mọi request.
- Hiển thị trạng thái loading (`isLoading`) khi đang gọi API.

## 5. Backend (Node.js/Express - Server)

### 5.1. Structure

- Sử dụng mô hình phân lớp:
  - **Routes (`src/routes/`):** Định nghĩa endpoints và gọi xử lý.
  - **Middleware (`src/middleware/`):** Xử lý xác thực, phân quyền, logging.
  - **Services/Controllers:** (Khuyến khích tách logic nghiệp vụ ra khỏi routes nếu file routes quá dài).
  - **Database (`src/database.js`):** Kết nối và truy vấn CSDL.

### 5.2. Module System

- Sử dụng **CommonJS** (`require`, `module.exports`) để thống nhất với code hiện tại.

### 5.3. Database Access

- Sử dụng thư viện `sqlite3` (hoặc wrapper hiện tại).
- **SQL Injection:** Luôn sử dụng **Parameterized Queries** (dấu `?`) khi truy vấn có tham số. Tuyệt đối không nối chuỗi trực tiếp vào câu lệnh SQL.

```javascript
// Tốt
const sql = "SELECT * FROM users WHERE id = ?";
db.get(sql, [userId], (err, row) => { ... });

// Xấu (Nguy hiểm)
const sql = "SELECT * FROM users WHERE id = " + userId;
```

### 5.4. Error Handling

- Luôn kiểm tra `err` trong callback của database.
- Trả về HTTP status code phù hợp (200 cho thành công, 400 cho lỗi client, 401/403 cho lỗi quyền, 500 cho lỗi server).
- Sử dụng `console.error` để log lỗi phía server.

## 6. Git Workflow

### 6.1. Branches

- `main` (hoặc `master`): Code ổn định, production-ready.
- `dev` (hoặc `develop`): Nhánh phát triển chính.
- Feature branches: `feature/ten-tinh-nang` (Ví dụ: `feature/add-player-search`).
- Bugfix branches: `fix/ten-loi` (Ví dụ: `fix/login-error`).

### 6.2. Commit Messages

- Viết rõ ràng, ngắn gọn, bắt đầu bằng động từ.
- Format: `[Type] Description`
- Types:
  - `Feat`: Tính năng mới.
  - `Fix`: Sửa lỗi.
  - `Refactor`: Tái cấu trúc code (không đổi tính năng).
  - `Style`: Thay đổi format, spacing (không đổi logic).
  - `Docs`: Thay đổi tài liệu.

Ví dụ:

- `Feat: Add player leaderboard component`
- `Fix: Resolve database connection timeout`
- `Style: Format code in TeamList.js`

## 7. Security Checklist

- [ ] Validate tất cả dữ liệu đầu vào từ client (req.body, req.query, req.params).
- [ ] Không lưu password dạng plain text (dùng bcrypt).
- [ ] Kiểm tra quyền truy cập (Authorization) cho các routes nhạy cảm (dùng middleware `auth`, `admin`, `teamOwner`).
- [ ] Sanitize dữ liệu trước khi hiển thị để tránh XSS.
