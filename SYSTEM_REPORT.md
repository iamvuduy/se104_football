# BÁO CÁO KIẾN TRÚC VÀ THÀNH PHẦN HỆ THỐNG
**Dự án:** Hệ Thống Quản Lý Giải Đấu Bóng Đá

---

## PHẦN 1: KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

### 1.1. Mô hình tổng quát
Hệ thống được xây dựng dựa trên mô hình **Client-Server phân tán (Decoupled Client-Server)**, cụ thể là kiến trúc **Thick Client (Client Dày) - Thin Server (Server Mỏng)**.

*   **Thick Client (Frontend):** Đóng vai trò chủ đạo trong việc xử lý giao diện, điều hướng trang và logic hiển thị. Trình duyệt tải về mã nguồn ứng dụng (Single Page Application) và tự thực hiện việc "vẽ" (render) giao diện mà không cần Server gửi về từng trang HTML.
*   **Thin Server (Backend):** Đóng vai trò là nhà cung cấp dữ liệu thuần túy (Data Provider). Server chỉ tập trung vào xử lý nghiệp vụ cốt lõi và trả về dữ liệu dưới dạng JSON, không tham gia vào việc định dạng giao diện.

### 1.2. Giao thức giao tiếp
Hai thành phần Client và Server giao tiếp với nhau hoàn toàn thông qua **RESTful API** sử dụng giao thức HTTP/HTTPS.
*   **Định dạng dữ liệu:** JSON (JavaScript Object Notation).
*   **Phương thức:** GET (Lấy dữ liệu), POST (Tạo mới), PUT (Cập nhật), DELETE (Xóa).

### 1.3. Sơ đồ kiến trúc

```mermaid
graph TD
    subgraph "Client Side (Thick Client)"
        Browser[Trình duyệt Người dùng]
        ReactApp[Ứng dụng ReactJS]
        Browser --> ReactApp
        ReactApp -- "Xử lý UI & Routing" --> ReactApp
    end

    subgraph "Communication"
        API[RESTful API (JSON)]
    end

    subgraph "Server Side (Thin Server)"
        NodeServer[Node.js + Express Server]
        Logic[Business Logic Layer]
        DataLayer[Data Access Layer]
        
        NodeServer --> Logic
        Logic --> DataLayer
    end

    subgraph "Database"
        SQLite[(SQLite Database)]
    end

    ReactApp <-->|HTTP Requests| API
    API <--> NodeServer
    DataLayer <-->|SQL Queries| SQLite
```

---

## PHẦN 2: MÔ TẢ CÁC THÀNH PHẦN TRONG HỆ THỐNG

### 2.1. Frontend (Giao diện người dùng)
Đây là thành phần tương tác trực tiếp với người dùng cuối (Ban tổ chức giải đấu).

*   **Công nghệ:** ReactJS, React Router, Bootstrap 5, Axios.
*   **Vai trò chính:**
    *   **Hiển thị dữ liệu:** Nhận JSON từ Server và hiển thị lên các bảng, biểu đồ, danh sách.
    *   **Điều hướng (Routing):** Chuyển đổi giữa các màn hình (Trang chủ, Đăng ký, Lịch thi đấu...) mượt mà không cần tải lại trang.
    *   **Xử lý logic hiển thị:** Kiểm tra dữ liệu đầu vào cơ bản (Form validation) trước khi gửi về Server.
*   **Các module chính:**
    *   *Quản lý đội bóng:* Form đăng ký, danh sách đội, hồ sơ cầu thủ.
    *   *Quản lý lịch thi đấu:* Tạo vòng đấu, sắp xếp cặp đấu.
    *   *Ghi nhận kết quả:* Nhập tỷ số, bàn thắng, thẻ phạt.
    *   *Báo cáo & Thống kê:* Xem bảng xếp hạng, danh sách vua phá lưới.
    *   *Cài đặt:* Cấu hình quy định giải đấu.

### 2.2. Backend (Máy chủ ứng dụng)
Đây là bộ não của hệ thống, nơi xử lý các quy tắc nghiệp vụ.

*   **Công nghệ:** Node.js (Runtime), Express.js (Framework).
*   **Kiến trúc nội tại (Layered Architecture):**
    *   **Routes (Controllers):** Tiếp nhận yêu cầu từ Frontend, phân loại yêu cầu (ví dụ: yêu cầu lấy danh sách đội hay yêu cầu cập nhật tỷ số).
    *   **Services (Business Logic):** Thực hiện các tính toán phức tạp. Ví dụ: Khi một trận đấu kết thúc, Service sẽ tính toán lại điểm số, hiệu số bàn thắng bại và cập nhật thứ hạng các đội trên bảng xếp hạng.
    *   **Middleware:** Các lớp trung gian để xác thực quyền quản trị (Admin Authentication) và kiểm tra lỗi.

### 2.3. Database (Cơ sở dữ liệu)
Nơi lưu trữ toàn bộ thông tin của giải đấu.

*   **Công nghệ:** SQLite (Relational Database Management System).
*   **Đặc điểm:** Cơ sở dữ liệu dạng file đơn giản, không cần cài đặt máy chủ cơ sở dữ liệu phức tạp, dễ dàng sao lưu và di chuyển.
*   **Các thực thể dữ liệu chính:**
    *   *Teams:* Lưu thông tin đội bóng.
    *   *Players:* Lưu thông tin cầu thủ.
    *   *Matches:* Lưu lịch thi đấu và kết quả.
    *   *Settings:* Lưu các tham số cấu hình giải đấu.
