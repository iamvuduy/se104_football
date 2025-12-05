# TÀI LIỆU THIẾT KẾ KIẾN TRÚC PHẦN MỀM
## (Software Architecture Design Document)

**Tên dự án:** Hệ Thống Quản Lý Giải Đấu Bóng Đá (Football Tournament Management System)
**Phiên bản:** 1.0
**Ngày tạo:** 04/12/2025

---

## 1. Giới thiệu (Introduction)

### 1.1. Mục đích
Tài liệu này mô tả kiến trúc phần mềm tổng thể của hệ thống quản lý giải đấu bóng đá. Hệ thống được thiết kế để hỗ trợ ban tổ chức quản lý các đội bóng, lịch thi đấu, ghi nhận kết quả trận đấu và tự động tính toán bảng xếp hạng.

### 1.2. Phạm vi
Hệ thống bao gồm một ứng dụng web trọn gói (Full-stack Web Application) với giao diện người dùng (Frontend) và máy chủ xử lý dữ liệu (Backend).

---

## 2. Kiến trúc Tổng quan (High-Level Architecture)

Hệ thống sử dụng mô hình **Client-Server phân tán (Decoupled Client-Server Architecture)** giao tiếp thông qua **RESTful API**.

*   **Client (Frontend):** Chạy trên trình duyệt của người dùng, chịu trách nhiệm hiển thị giao diện và tương tác với người dùng.
*   **Server (Backend):** Chạy trên máy chủ, chịu trách nhiệm xử lý logic nghiệp vụ, xác thực và quản lý dữ liệu.
*   **Database:** Lưu trữ dữ liệu bền vững dưới dạng file (SQLite).

### Sơ đồ kiến trúc mức cao:

```mermaid
graph LR
    User[Người dùng] <-->|HTTPS| Client[Frontend (ReactJS)]
    Client <-->|REST API (JSON)| Server[Backend (Node.js/Express)]
    Server <-->|SQL Queries| DB[(Database SQLite)]
```

---

## 3. Ngăn xếp Công nghệ (Technology Stack)

### 3.1. Frontend (Giao diện)
*   **Core Framework:** ReactJS (Single Page Application - SPA).
*   **Routing:** React Router DOM (Quản lý điều hướng trang không cần tải lại).
*   **Styling:** Bootstrap 5 kết hợp với CSS tùy chỉnh (Custom CSS) cho từng Component.
*   **HTTP Client:** Axios (Gửi yêu cầu API).
*   **Build Tool:** React Scripts (Webpack).

### 3.2. Backend (Máy chủ)
*   **Runtime Environment:** Node.js.
*   **Web Framework:** Express.js (Xử lý HTTP requests, routing).
*   **Middleware:** CORS (Cross-Origin Resource Sharing), Body-parser.
*   **Authentication:** JSON Web Token (JWT) (Dự kiến/Đang triển khai cho Admin).

### 3.3. Database (Cơ sở dữ liệu)
*   **Engine:** SQLite3.
*   **Đặc điểm:** Serverless, file-based, zero-configuration. Phù hợp cho ứng dụng quy mô vừa và nhỏ, dễ dàng triển khai và sao lưu.

---

## 4. Thiết kế Chi tiết (Detailed Design)

### 4.1. Frontend Design (Client-side)
Frontend được tổ chức theo kiến trúc **Component-based**. Mỗi thành phần giao diện là một module độc lập.

*   **Cấu trúc thư mục:**
    *   `src/components/`: Chứa các React Components (VD: `TeamRegistration.js`, `ScheduleManagement.js`).
    *   `src/App.js`: Component gốc, định nghĩa Routing.
    *   `src/api/`: (Khuyến nghị) Chứa các cấu hình gọi API tập trung.

*   **Các màn hình chính:**
    1.  **Dashboard/Home:** Trang chủ.
    2.  **Team Registration:** Đăng ký đội bóng và cầu thủ.
    3.  **Schedule Management:** Tạo và quản lý lịch thi đấu.
    4.  **Match Recording:** Ghi nhận kết quả, bàn thắng, thẻ phạt.
    5.  **Leaderboard:** Xem bảng xếp hạng và thống kê.
    6.  **Settings:** Cấu hình quy định giải đấu (Tuổi, số lượng cầu thủ, điểm số).

### 4.2. Backend Design (Server-side)
Backend áp dụng **Kiến trúc Phân lớp (Layered Architecture)** để tách biệt các mối quan tâm (Separation of Concerns).

*   **Layer 1: Routes (Controllers)**
    *   Vị trí: `server/src/routes/`
    *   Nhiệm vụ: Định nghĩa các API Endpoints (GET, POST, PUT, DELETE). Nhận request, validate dữ liệu cơ bản và gọi xuống tầng dưới.
    *   Ví dụ: `routes/teams.js`, `routes/settings.js`.

*   **Layer 2: Services (Business Logic)**
    *   Vị trí: `server/src/services/`
    *   Nhiệm vụ: Chứa logic nghiệp vụ phức tạp, tính toán, xử lý quy tắc (VD: Kiểm tra quy định tuổi, tính điểm xếp hạng).
    *   Ví dụ: `services/settingsService.js`.

*   **Layer 3: Data Access (Database)**
    *   Vị trí: `server/src/database.js`
    *   Nhiệm vụ: Khởi tạo kết nối SQLite và thực thi các câu lệnh SQL trực tiếp.

### 4.3. Database Schema (Lược đồ dữ liệu)
Các bảng chính trong hệ thống:

1.  **Users:** Quản lý tài khoản quản trị viên.
2.  **Settings:** Lưu cấu hình quy định giải đấu (Key-Value pair).
3.  **Teams:** Thông tin đội bóng (Mã, Tên, Sân nhà).
4.  **Players:** Thông tin cầu thủ (Tên, Ngày sinh, Loại cầu thủ, Mã đội).
5.  **Matches (Schedules):** Lịch thi đấu (Đội 1, Đội 2, Ngày, Giờ, Sân).
6.  **Match_Results:** Kết quả trận đấu (Tỷ số).
7.  **Goals:** Chi tiết bàn thắng (Cầu thủ ghi bàn, loại bàn thắng, thời điểm).

---

## 5. Luồng dữ liệu (Data Flow)

Ví dụ luồng xử lý khi người dùng **Đăng ký đội bóng**:

1.  **User Action:** Người dùng nhập thông tin đội và cầu thủ trên giao diện `TeamRegistration` -> Nhấn "Lưu".
2.  **Client Request:** React gọi `axios.post('/api/teams', data)`.
3.  **Route Handling:** `routes/teams.js` nhận request POST.
4.  **Validation:** Backend kiểm tra dữ liệu (Tên không rỗng, đủ số lượng cầu thủ, đúng độ tuổi theo `Settings`).
5.  **Database Interaction:**
    *   Thực thi SQL `INSERT INTO teams...`
    *   Lấy ID đội vừa tạo.
    *   Thực thi vòng lặp `INSERT INTO players...`
6.  **Response:** Server trả về JSON `{ message: "Success", teamId: ... }`.
7.  **UI Update:** React nhận phản hồi thành công -> Hiển thị thông báo Toast -> Cập nhật danh sách đội.

---

## 6. Kết luận & Hướng phát triển

### 6.1. Điểm mạnh
*   Kiến trúc tách biệt, dễ dàng phát triển song song Frontend và Backend.
*   Sử dụng công nghệ phổ biến, cộng đồng hỗ trợ lớn.
*   Triển khai đơn giản nhờ SQLite.

### 6.2. Cải tiến trong tương lai
*   Chuyển đổi hoàn toàn sang mô hình 3 lớp chuẩn (chuyển hết logic SQL từ Routes sang Services).
*   Thêm Unit Tests cho Backend.
*   Nâng cấp Database sang MySQL/PostgreSQL nếu dữ liệu lớn.
