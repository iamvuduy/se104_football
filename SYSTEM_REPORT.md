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
90:     *   *Settings:* Lưu các tham số cấu hình giải đấu.
91: 
92: ---
93: 
94: ## PHẦN 3: DANH SÁCH CÁC MÀN HÌNH (SCREEN LIST)
95: 
96: | STT | Tên Màn hình (Route) | Loại màn hình | Diễn giải |
97: | :--- | :--- | :--- | :--- |
98: | 1 | **Đăng nhập** (`/login`) | Màn hình nhập liệu | Xác thực người dùng truy cập hệ thống. |
99: | 2 | **Đăng ký** (`/register`) | Màn hình nhập liệu | Tạo tài khoản quản trị viên mới. |
100: | 3 | **Trang chủ** (`/`) | Màn hình chính | Dashboard tổng quan, điều hướng đến các chức năng. |
101: | 4 | **Đăng ký hồ sơ** (`/register-team`) | Màn hình nhập liệu | Đăng ký đội bóng và danh sách cầu thủ. |
102: | 5 | **Danh sách đội bóng** (`/teams`) | Màn hình danh sách | Xem, tìm kiếm và quản lý các đội bóng tham gia. |
103: | 6 | **Chi tiết đội bóng** (`/teams/:id`) | Màn hình thông tin | Hiển thị thông tin chi tiết đội bóng và cầu thủ. |
104: | 7 | **Quản lý lịch thi đấu** (`/admin/schedules`) | Màn hình quản lý | Tạo vòng đấu, sắp xếp lịch thi đấu. |
105: | 8 | **Ghi nhận kết quả** (`/record-result`) | Màn hình nhập liệu | Cập nhật tỷ số, thẻ phạt, cầu thủ ghi bàn. |
106: | 9 | **Kết quả thi đấu** (`/match-results`) | Màn hình danh sách | Xem lại kết quả các trận đấu đã diễn ra. |
107: | 10 | **Bảng xếp hạng** (`/team-leaderboard`) | Màn hình báo cáo | Xem thứ hạng các đội dựa trên điểm số. |
108: | 11 | **Vua phá lưới** (`/top-scorer-leaderboard`) | Màn hình báo cáo | Thống kê cầu thủ ghi nhiều bàn thắng nhất. |
109: | 12 | **Tra cứu cầu thủ** (`/player-lookup`) | Màn hình tra cứu | Tìm kiếm thông tin cầu thủ theo nhiều tiêu chí. |
110: | 13 | **Thay đổi quy định** (`/admin/tournament-settings`) | Màn hình cấu hình | Cài đặt các tham số giải đấu (số đội, tuổi, v.v.). |
111: 111: | 14 | **Quản lý người dùng** (`/admin/users`) | Màn hình quản trị | Quản lý danh sách tài khoản được phép truy cập. |
112: 
113: ---
114: 
115: ## PHẦN 4: CHI TIẾT MÀN HÌNH (DETAILED SCREEN SPECIFICATIONS)
116: Dưới đây là mô tả chi tiết các đối tượng và xử lý biến cố cho các loại màn hình đại diện trong hệ thống.
117: 
118: ### 4.1. Màn hình Chính (Dashboard / Home)
119: **Loại màn hình:** Màn hình chính
120: 
121: #### 4.1.1. Danh sách các đối tượng
122: | STT | Tên đối tượng | Kiểu | Ràng buộc | Chức năng |
123: | :--- | :--- | :--- | :--- | :--- |
124: | 1 | `lblWelcome` | Label | - | Hiển thị lời chào và tên người dùng đang đăng nhập. |
125: | 2 | `cardTongDoi` | Card/Text | Read-only | Hiển thị tổng số đội bóng tham gia giải. |
126: | 3 | `cardTongTran` | Card/Text | Read-only | Hiển thị tổng số trận đấu đã diễn ra. |
127: | 4 | `btnTaiLai` | Button | - | Tải lại dữ liệu thống kê mới nhất từ Server. |
128: | 5 | `listTruyCapNhanh` | Link List | - | Danh sách các liên kết tắt đến các chức năng thường dùng (Đăng ký, Lịch thi đấu...). |
129: | 6 | `tblTopDoi` | Table/List | Max 3 items | Hiển thị Top 3 đội bóng đứng đầu bảng xếp hạng. |
130: | 7 | `tblTranGanNhat` | Table/List | Max 4 items | Hiển thị kết quả 4 trận đấu gần nhất. |
131: 
132: #### 4.1.2. Danh sách biến cố và xử lý
133: | STT | Biến cố | Xử lý |
134: | :--- | :--- | :--- |
135: | 1 | `Page_Load` | Hệ thống tự động gọi API lấy dữ liệu tổng quan (`/api/teams`, `/api/results`) và hiển thị lên các Card/Table. Nếu lỗi, hiển thị thông báo lỗi. |
136: | 2 | `Click btnTaiLai` | Gọi lại hàm tải dữ liệu (`fetchDashboardData`) để cập nhật các con số thống kê mới nhất mà không cần F5 trang. |
137: | 3 | `Click Link` | Điều hướng người dùng sang trang chức năng tương ứng (Client-side routing). |
138: 
139: ### 4.2. Màn hình Nhập liệu (Minh họa: Đăng ký đội bóng)
140: **Loại màn hình:** Màn hình nhập liệu
141: 
142: #### 4.2.1. Danh sách các đối tượng
143: | STT | Tên đối tượng | Kiểu | Ràng buộc | Chức năng |
144: | :--- | :--- | :--- | :--- | :--- |
145: | 1 | `txtMaDoi` | Text Input | Unique, format "FCxxx" | Nhập mã đội bóng. |
146: | 2 | `txtTenDoi` | Text Input | Not Null | Nhập tên đội bóng. |
147: | 3 | `txtSanNha` | Text Input | Not Null | Nhập tên sân nhà. |
148: | 4 | `tblCauThu` | Dynamic Table | Min/Max rows theo quy định | Danh sách cầu thủ đăng ký của đội. |
149: | 5 | `btnThemCauThu` | Button | Disable nếu max players | Thêm một dòng nhập liệu cầu thủ mới vào bảng. |
150: | 6 | `btnXoaCauThu` | Button | Disable nếu min players | Xóa dòng cầu thủ tương ứng khỏi bảng. |
151: | 7 | `btnDangKy` | Button | - | Gửi hồ sơ đăng ký về Server. |
152: 
153: #### 4.2.2. Danh sách biến cố và xử lý
154: | STT | Biến cố | Xử lý |
155: | :--- | :--- | :--- |
156: | 1 | `Click btnThemCauThu` | Kiểm tra số lượng hiện tại < Tối đa (setting). Nếu thỏa, thêm object cầu thủ rỗng vào mảng state `players`. |
157: | 2 | `Click btnXoaCauThu` | Kiểm tra số lượng hiện tại > Tối thiểu (setting). Nếu thỏa, xóa phần tử tại index tương ứng khỏi mảng `players`. |
158: | 3 | `Click btnDangKy` | 1. Validate dữ liệu (Mã đúng định dạng? Đủ số lượng cầu thủ? Tuổi cầu thủ hợp lệ?).<br>2. Nếu lỗi: Hiển thị Toast Error.<br>3. Nếu đúng: Gọi API `POST /api/teams`.<br>4. Thành công: Reset form và hiện Toast Success. |
159: 
160: ### 4.3. Màn hình Danh sách (Minh họa: Danh sách đội bóng)
161: **Loại màn hình:** Màn hình danh sách
162: 
163: #### 4.3.1. Danh sách các đối tượng
164: | STT | Tên đối tượng | Kiểu | Ràng buộc | Chức năng |
165: | :--- | :--- | :--- | :--- | :--- |
166: | 1 | `btnTaiLai` | Button | - | Tải lại danh sách từ Server. |
167: | 2 | `tblDanhSach` | Grid/List | - | Hiển thị danh sách các đội (Mã, Tên, Sân nhà). |
168: | 3 | `btnChiTiet` | Link/Button | - | Chuyển đến trang chi tiết của đội tương ứng. |
169: | 4 | `btnXoa` | Button | Admin only | Xóa đội bóng khỏi hệ thống. |
170: | 5 | `divPhanTrang` | Pagination | - | Các nút điều hướng trang (1, 2, Next, Prev). |
171: 
172: #### 4.3.2. Danh sách biến cố và xử lý
173: | STT | Biến cố | Xử lý |
174: | :--- | :--- | :--- |
175: | 1 | `Page_Load` | Gọi API `GET /api/teams` lấy toàn bộ danh sách. Lưu vào state `teams`. |
176: | 2 | `Click btnXoa` | 1. Hiển thị Popup xác nhận (Confirm Dialog).<br>2. Nếu Đồng ý: Gọi API `DELETE /api/teams/:id`.<br>3. Cập nhật giao diện: Loại bỏ đội vừa xóa khỏi danh sách hiện tại. |
177: | 3 | `Click Page Number` | Cập nhật state `currentPage`. Danh sách hiển thị sẽ được cắt (slice) tương ứng với trang được chọn. |
178: 
179: ### 4.4. Màn hình Cấu hình (Thay đổi quy định)
180: **Loại màn hình:** Màn hình cấu hình
181: 
182: #### 4.4.1. Danh sách các đối tượng
183: | STT | Tên đối tượng | Kiểu | Ràng buộc | Chức năng |
184: | :--- | :--- | :--- | :--- | :--- |
185: | 1 | `tblQuyDinh` | Table | Read-only view | Hiển thị các quy định hiện hành (Tuổi, Số người, Điểm thắng/thua). |
186: | 2 | `btnSua` | Button | Admin only | Mở Modal để chỉnh sửa giá trị quy định tương ứng. |
187: | 3 | `modalEdit` | Modal Dialog | - | Hộp thoại nhập giá trị mới. |
188: | 4 | `btnLuu` | Button (in Modal) | - | Lưu thay đổi. |
189: | 5 | `btnDatLaiMacDinh`| Button | - | Khôi phục toàn bộ quy định về giá trị gốc của hệ thống. |
190: 
191: #### 4.4.2. Danh sách biến cố và xử lý
192: | STT | Biến cố | Xử lý |
193: | :--- | :--- | :--- |
194: | 1 | `Click btnSua` | Mở `modalEdit`, điền giá trị hiện tại của quy định đó vào ô nhập liệu (`input`). |
195: | 2 | `Click btnLuu` | 1. Gọi API `PUT /api/settings` với giá trị mới.<br>2. Thành công: Đóng Modal, cập nhật lại giá trị trên bảng hiển thị, hiện Toast Success. |
196: | 3 | `Click btnDatLaiMacDinh`| 1. Hiển thị Confirm Dialog.<br>2. Nếu Đồng ý: Gọi API `POST /api/settings/reset`.<br>3. Tải lại toàn bộ cài đặt từ Server. |
