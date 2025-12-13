# QUY ĐỊNH LẬP TRÌNH VÀ KIỂM THỬ (LAPTRINH_KIEMTHU)

Tài liệu này mô tả các quy ước viết mã, cách thức quản lý phiên bản và tổ chức mã nguồn cho dự án Quản lý Giải đấu Bóng đá.

## 1. Chuẩn và phong cách viết mã (Coding Standards & Style)

Để đảm bảo tính nhất quán và dễ bảo trì của mã nguồn, nhóm tuân thủ các quy tắc sau:

### 1.1. Ngôn ngữ và Công nghệ

- **Frontend:** JavaScript (ReactJS), CSS.
- **Backend:** JavaScript (Node.js, Express).
- **Cơ sở dữ liệu:** SQLite.

### 1.2. Định dạng (Formatting)

- **Thụt đầu dòng (Indentation):** Sử dụng 2 spaces.
- **Dấu chấm phẩy:** Luôn sử dụng dấu chấm phẩy (`;`) ở cuối câu lệnh.
- **Chuỗi ký tự:** Ưu tiên sử dụng dấu ngoặc kép (`"`) cho chuỗi trong JavaScript.
- **Encoding:** UTF-8.

### 1.3. Quy ước đặt tên (Naming Conventions)

- **Biến (Variables):** `camelCase` (ví dụ: `teamName`, `playerList`).
  - Biến Boolean nên bắt đầu bằng `is`, `has` (ví dụ: `isLoading`).
- **Hàm (Functions):** `camelCase`, bắt đầu bằng động từ (ví dụ: `handleSubmit`, `fetchData`).
- **Hằng số (Constants):** `UPPER_SNAKE_CASE` (ví dụ: `MAX_PLAYERS`, `API_URL`).
- **React Components:** `PascalCase` (ví dụ: `TeamList`, `MatchSchedule`).
- **Tên tập tin (Files):**
  - Component React: `PascalCase.js` (ví dụ: `TeamList.js`).
  - File tiện ích/Server: `camelCase.js` (ví dụ: `server.js`, `auth.js`).
- **Cơ sở dữ liệu:**
  - Tên bảng: `snake_case`, số nhiều (ví dụ: `teams`, `players`).
  - Tên cột: `snake_case` (ví dụ: `team_id`, `full_name`).

### 1.4. Comment

- Sử dụng comment để giải thích logic phức tạp hoặc lý do nghiệp vụ.
- Sử dụng `//` cho comment một dòng và `/* */` cho comment nhiều dòng.

## 2. Cách tổ chức quản lý phiên bản của mã (Version Control)

Dự án sử dụng **Git** để quản lý phiên bản mã nguồn.

### 2.1. Mô hình phân nhánh (Branching Strategy)

- **main (hoặc master):** Nhánh chính chứa mã nguồn ổn định, sẵn sàng để triển khai (production-ready).
- **develop (nếu có):** Nhánh phát triển chính, nơi tích hợp các tính năng mới trước khi merge vào main.
- **feature/\*:** Các nhánh tính năng riêng biệt (ví dụ: `feature/login-screen`, `feature/schedule-api`). Được tạo từ `main` hoặc `develop` và merge lại sau khi hoàn thành.

### 2.2. Quy trình Commit

- Thông điệp commit (Commit message) cần rõ ràng, ngắn gọn và mô tả được thay đổi.
- Cấu trúc khuyến nghị: `[Loại] Mô tả ngắn gọn`.
  - Ví dụ: `[Feat] Thêm chức năng đăng ký đội bóng`, `[Fix] Sửa lỗi hiển thị bảng xếp hạng`.

## 3. Mô tả chi tiết cách tổ chức mã nguồn

Cấu trúc dự án được chia thành hai thư mục chính: `client` (Frontend) và `server` (Backend).

### 3.1. Thư mục `client/` (Frontend - ReactJS)

Chứa toàn bộ mã nguồn giao diện người dùng.

- **`public/`**: Chứa các file tĩnh như `index.html`, `manifest.json`.
- **`src/`**: Thư mục mã nguồn chính.
  - **`components/`**: Chứa các React Components. Mỗi màn hình hoặc thành phần giao diện là một file riêng biệt (ví dụ: `Home.js`, `TeamList.js`, `MatchResults.js`). Các file CSS đi kèm thường nằm cùng thư mục.
  - **`context/`**: Chứa React Context để quản lý trạng thái toàn cục (ví dụ: `AuthContext.js` quản lý đăng nhập).
  - **`utils/`**: Các hàm tiện ích dùng chung (ví dụ: `permissions.js`, `roles.js`).
  - **`App.js`**: Component gốc, định nghĩa các routes (đường dẫn) của ứng dụng.
  - **`index.js`**: Điểm khởi chạy của ứng dụng React.

### 3.2. Thư mục `server/` (Backend - Node.js)

Chứa mã nguồn server, API và xử lý cơ sở dữ liệu.

- **`database/`**: Chứa file cơ sở dữ liệu SQLite.
- **`scripts/`**: Các script chạy một lần hoặc định kỳ (ví dụ: `cleanup_schedules.js`).
- **`src/`**: Mã nguồn chính của server.
  - **`middleware/`**: Các hàm trung gian xử lý request (ví dụ: `auth.js` xác thực, `admin.js` kiểm tra quyền admin).
  - **`routes/`**: Định nghĩa các API endpoints (ví dụ: `teams.js` cho API đội bóng, `users.js` cho API người dùng).
  - **`services/`**: Chứa logic nghiệp vụ phức tạp, tách biệt khỏi controller/routes (ví dụ: `reportService.js`, `idGeneratorService.js`).
  - **`app.js`**: Cấu hình Express app.
  - **`server.js`**: Khởi chạy server.
  - **`database.js`**: Cấu hình kết nối cơ sở dữ liệu.

### 3.3. Các file tài liệu khác

- `README.md`: Hướng dẫn cài đặt và chạy dự án.
- `CODING_CONVENTION.md`: Chi tiết quy ước viết code.
- `ARCHITECTURE_DESIGN.md`: Thiết kế kiến trúc hệ thống.
