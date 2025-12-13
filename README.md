# 🏆 Hệ Thống Quản Lý Giải Đấu Bóng Đá

**Football Tournament Management System**

Hệ thống quản lý giải đấu bóng đá toàn diện với giao diện web hiện đại, hỗ trợ quản lý đội bóng, lịch thi đấu, ghi nhận kết quả và tự động tính toán bảng xếp hạng.

---

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt](#-cài-đặt)
- [Chạy Ứng Dụng](#-chạy-ứng-dụng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
- [Vai Trò Người Dùng](#-vai-trò-người-dùng)
- [API Endpoints](#-api-endpoints)

---

## ✨ Tính Năng

### Quản lý Đội Bóng

- ✅ Đăng ký đội bóng mới với mã đội (FC001, FC002,...)
- ✅ Quản lý danh sách cầu thủ (tên, ngày sinh, vị trí, mã cầu thủ)
- ✅ Chỉnh sửa và xóa thông tin đội

### Quản lý Lịch Thi Đấu

- ✅ Tạo lịch thi đấu theo vòng đấu
- ✅ Quản lý sân vận động, ngày giờ thi đấu
- ✅ Tự động tạo mã trận đấu

### Ghi Nhận Kết Quả

- ✅ Ghi nhận tỉ số trận đấu
- ✅ Ghi nhận bàn thắng (cầu thủ, phút ghi bàn, loại bàn thắng)
- ✅ Quản lý các loại bàn thắng (A, B, C)

### Bảng Xếp Hạng

- ✅ Tự động tính toán bảng xếp hạng đội
- ✅ Bảng xếp hạng vua phá lưới
- ✅ Hệ thống báo cáo (Draft/Published)
- ✅ Tùy chỉnh tiêu chí xếp hạng

### Quản lý Người Dùng

- ✅ Hệ thống đăng nhập/đăng ký
- ✅ Phân quyền theo vai trò (Admin, Tournament Admin, Team Owner, Viewer)
- ✅ Quản lý quyền hạn chi tiết

### Cài Đặt Giải Đấu

- ✅ Cấu hình quy định tuổi cầu thủ
- ✅ Cấu hình số lượng cầu thủ tối thiểu/tối đa
- ✅ Cấu hình điểm số (thắng/hòa/thua)
- ✅ Cấu hình thời gian ghi bàn tối đa

---

## 🛠 Công Nghệ Sử Dụng

### Frontend

| Công nghệ        | Phiên bản | Mô tả         |
| ---------------- | --------- | ------------- |
| React            | 18.2.0    | UI Framework  |
| React Router DOM | 6.30.1    | Routing       |
| Bootstrap        | 5.3.2     | CSS Framework |
| Axios            | 1.12.2    | HTTP Client   |
| React Icons      | 5.5.0     | Icon Library  |
| jsPDF            | 3.0.4     | Xuất PDF      |
| xlsx             | 0.18.5    | Xuất Excel    |

### Backend

| Công nghệ  | Phiên bản | Mô tả            |
| ---------- | --------- | ---------------- |
| Node.js    | >= 18.x   | Runtime          |
| Express.js | 4.18.2    | Web Framework    |
| SQLite3    | 5.1.6     | Database         |
| JWT        | 9.0.2     | Authentication   |
| bcrypt     | 6.0.0     | Password Hashing |
| CORS       | 2.8.5     | Cross-Origin     |

---

## 💻 Yêu Cầu Hệ Thống

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **Git**: >= 2.x
- **Trình duyệt**: Chrome, Firefox, Edge (phiên bản mới nhất)

---

## 🚀 Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/iamvuduy/se104_football.git
cd se104_football
```

### 2. Cài Đặt Dependencies cho Server

```bash
cd server
npm install
```

### 3. Cài Đặt Dependencies cho Client

```bash
cd ../client
npm install
```

---

## ▶️ Chạy Ứng Dụng

### Chạy Server (Backend)

```bash
cd server
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

### Chạy Client (Frontend)

Mở terminal mới:

```bash
cd client
npm start
```

Client sẽ chạy tại: `http://localhost:3000`

### Chạy Cả Hai Cùng Lúc (Development)

**Terminal 1 - Server:**

```bash
cd server
npm run dev
```

**Terminal 2 - Client:**

```bash
cd client
npm start
```

---

## 📁 Cấu Trúc Dự Án

```
se104_football/
├── client/                     # Frontend React App
│   ├── public/                 # Static files
│   │   └── index.html
│   ├── src/
│   │   ├── components/         # React Components
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── TeamRegistration.js
│   │   │   ├── TeamList.js
│   │   │   ├── TeamDetails.js
│   │   │   ├── EditTeam.js
│   │   │   ├── ScheduleManagement.js
│   │   │   ├── MatchResults.js
│   │   │   ├── RecordMatchResult.js
│   │   │   ├── TeamLeaderboard.js
│   │   │   ├── TopScorerLeaderboard.js
│   │   │   ├── PlayerLookup.js
│   │   │   ├── TournamentSettings.js
│   │   │   ├── UserManagement.js
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── AuthContext.js  # Authentication Context
│   │   ├── utils/
│   │   │   ├── permissions.js  # Permission utilities
│   │   │   └── roles.js        # Role definitions
│   │   ├── App.js              # Main App Component
│   │   └── index.js            # Entry Point
│   └── package.json
│
├── server/                     # Backend Node.js/Express
│   ├── database/
│   │   └── database.sqlite     # SQLite Database File
│   ├── src/
│   │   ├── routes/             # API Routes
│   │   │   ├── auth.js
│   │   │   ├── teams.js
│   │   │   ├── players.js
│   │   │   ├── schedules.js
│   │   │   ├── results.js
│   │   │   ├── leaderboard.js
│   │   │   ├── settings.js
│   │   │   ├── users.js
│   │   │   ├── permissions.js
│   │   │   ├── roles.js
│   │   │   └── groups.js
│   │   ├── middleware/         # Express Middleware
│   │   │   ├── auth.js         # JWT Authentication
│   │   │   ├── admin.js        # Admin Authorization
│   │   │   └── teamOwner.js    # Team Owner Authorization
│   │   ├── services/           # Business Logic
│   │   │   ├── settingsService.js
│   │   │   ├── permissionsService.js
│   │   │   ├── reportService.js
│   │   │   └── initializeDatabase.js
│   │   ├── app.js              # Express App Setup
│   │   ├── server.js           # Server Entry Point
│   │   └── database.js         # Database Connection
│   └── package.json
│
├── README.md                   # File này
├── ARCHITECTURE_DESIGN.md      # Tài liệu thiết kế kiến trúc
├── FEATURE_DOCUMENTATION.md    # Tài liệu tính năng
└── TEAM_OWNER_AUTHORIZATION.md # Tài liệu phân quyền
```

---

## 📖 Hướng Dẫn Sử Dụng

### 1. Đăng Ký Tài Khoản

1. Truy cập `http://localhost:3000`
2. Click **"Đăng ký"** trên thanh navigation
3. Điền thông tin: Username, Password, Họ tên, Email
4. Chọn vai trò (mặc định: Viewer)
5. Click **"Đăng ký"**

### 2. Đăng Nhập

1. Click **"Đăng nhập"**
2. Nhập Username và Password
3. Click **"Đăng nhập"**

### 3. Đăng Ký Đội Bóng

1. Vào menu **"Đăng ký đội"**
2. Điền thông tin đội:
   - Mã đội (VD: FC001)
   - Tên đội
   - Sân nhà
3. Thêm danh sách cầu thủ (tối thiểu theo quy định)
4. Click **"Đăng ký đội"**

### 4. Tạo Lịch Thi Đấu

1. Vào menu **"Quản lý lịch thi đấu"**
2. Click **"Thêm lịch mới"**
3. Chọn:
   - Vòng đấu
   - Đội 1 và Đội 2
   - Ngày, giờ, sân
4. Click **"Lưu"**

### 5. Ghi Nhận Kết Quả

1. Vào menu **"Ghi nhận kết quả"**
2. Chọn trận đấu từ danh sách
3. Nhập tỉ số
4. Thêm các bàn thắng (cầu thủ, phút, loại)
5. Click **"Lưu kết quả"**

### 6. Xem Bảng Xếp Hạng

1. Vào menu **"Bảng xếp hạng đội"** hoặc **"Vua phá lưới"**
2. Chọn vòng đấu muốn xem
3. Xem thống kê chi tiết

### 7. Lập Báo Cáo (Tournament Admin)

1. Vào **"Bảng xếp hạng đội"**
2. Chọn vòng đấu
3. Click **"📝 Lập Báo Cáo"** để tạo báo cáo Draft
4. Click **"✅ Chia Sẻ Báo Cáo"** để công khai

---

## 👥 Vai Trò Người Dùng

| Vai trò              | Quyền hạn                                                        |
| -------------------- | ---------------------------------------------------------------- |
| **System Admin**     | Toàn quyền hệ thống, quản lý người dùng                          |
| **Tournament Admin** | Quản lý giải đấu, lịch thi đấu, ghi nhận kết quả, lập báo cáo    |
| **Team Owner**       | Quản lý đội bóng của mình, đăng ký đội                           |
| **Viewer**           | Xem thông tin giải đấu, bảng xếp hạng (chỉ báo cáo đã công khai) |

### Ma Trận Quyền Hạn Chi Tiết

| Tính năng          | System Admin | Tournament Admin |  Team Owner  | Viewer |
| ------------------ | :----------: | :--------------: | :----------: | :----: |
| Xem Dashboard      |      ✅      |        ✅        |      ✅      |   ✅   |
| Xem đội bóng       |      ✅      |        ✅        |      ✅      |   ✅   |
| Đăng ký đội        |      ✅      |        ✅        |      ✅      |   ❌   |
| Sửa/Xóa đội        |      ✅      |        ✅        | Chỉ đội mình |   ❌   |
| Quản lý lịch       |      ✅      |        ✅        |      ❌      |   ❌   |
| Ghi nhận kết quả   |      ✅      |        ✅        |      ❌      |   ❌   |
| Lập báo cáo        |      ❌      |        ✅        |      ❌      |   ❌   |
| Quản lý người dùng |      ✅      |        ❌        |      ❌      |   ❌   |
| Cài đặt giải đấu   |      ✅      |        ✅        |      ❌      |   ❌   |

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register    # Đăng ký tài khoản
POST   /api/auth/login       # Đăng nhập
```

### Teams

```
GET    /api/teams            # Lấy danh sách đội
GET    /api/teams/:id        # Lấy chi tiết đội
POST   /api/teams            # Tạo đội mới
PUT    /api/teams/:id        # Cập nhật đội
DELETE /api/teams/:id        # Xóa đội
```

### Players

```
GET    /api/players          # Lấy danh sách cầu thủ
GET    /api/players/search   # Tìm kiếm cầu thủ
```

### Schedules

```
GET    /api/schedules        # Lấy lịch thi đấu
POST   /api/schedules        # Tạo lịch mới
PUT    /api/schedules/:id    # Cập nhật lịch
DELETE /api/schedules/:id    # Xóa lịch
```

### Results

```
GET    /api/results          # Lấy kết quả trận đấu
POST   /api/results          # Ghi nhận kết quả
PUT    /api/results/:id      # Cập nhật kết quả
DELETE /api/results/:id      # Xóa kết quả
```

### Leaderboard

```
GET    /api/leaderboard/teams         # Bảng xếp hạng đội
GET    /api/leaderboard/top-scorers   # Vua phá lưới
GET    /api/leaderboard/rounds        # Danh sách vòng đấu
POST   /api/leaderboard/reports/team  # Lập báo cáo đội
PUT    /api/leaderboard/reports/:type/:round/publish    # Công khai báo cáo
PUT    /api/leaderboard/reports/:type/:round/unpublish  # Ẩn báo cáo
```

### Settings

```
GET    /api/settings         # Lấy cài đặt
PUT    /api/settings         # Cập nhật cài đặt
```

### Users

```
GET    /api/users/me         # Thông tin user hiện tại
GET    /api/users            # Danh sách users (Admin)
PUT    /api/users/:id/role   # Cập nhật role (Admin)
DELETE /api/users/:id        # Xóa user (Admin)
```

### Permissions

```
GET    /api/permissions      # Lấy ma trận quyền
PUT    /api/permissions      # Cập nhật quyền (Admin)
```

---

## 🗄️ Database Schema

### Bảng `users`

| Cột       | Kiểu    | Mô tả                  |
| --------- | ------- | ---------------------- |
| id        | INTEGER | Primary Key            |
| username  | TEXT    | Tên đăng nhập (unique) |
| password  | TEXT    | Mật khẩu (hashed)      |
| role      | TEXT    | Vai trò                |
| full_name | TEXT    | Họ tên                 |
| email     | TEXT    | Email                  |
| team_id   | INTEGER | FK đến teams           |

### Bảng `teams`

| Cột          | Kiểu    | Mô tả           |
| ------------ | ------- | --------------- |
| id           | INTEGER | Primary Key     |
| team_code    | TEXT    | Mã đội (unique) |
| name         | TEXT    | Tên đội         |
| home_stadium | TEXT    | Sân nhà         |
| group_id     | INTEGER | FK đến groups   |

### Bảng `players`

| Cột         | Kiểu    | Mô tả               |
| ----------- | ------- | ------------------- |
| id          | INTEGER | Primary Key         |
| player_code | TEXT    | Mã cầu thủ (unique) |
| name        | TEXT    | Tên cầu thủ         |
| dob         | TEXT    | Ngày sinh           |
| type        | TEXT    | Loại cầu thủ        |
| team_id     | INTEGER | FK đến teams        |

### Bảng `schedules`

| Cột        | Kiểu    | Mô tả        |
| ---------- | ------- | ------------ |
| id         | INTEGER | Primary Key  |
| match_code | TEXT    | Mã trận đấu  |
| round      | TEXT    | Vòng đấu     |
| team1_id   | INTEGER | FK đến teams |
| team2_id   | INTEGER | FK đến teams |
| date       | TEXT    | Ngày thi đấu |
| time       | TEXT    | Giờ thi đấu  |
| stadium    | TEXT    | Sân vận động |

### Bảng `match_results`

| Cột        | Kiểu    | Mô tả             |
| ---------- | ------- | ----------------- |
| id         | INTEGER | Primary Key       |
| match_code | TEXT    | Mã trận đấu       |
| team1_id   | INTEGER | FK đến teams      |
| team2_id   | INTEGER | FK đến teams      |
| score      | TEXT    | Tỉ số (VD: "2-1") |
| match_date | TEXT    | Ngày thi đấu      |
| match_time | TEXT    | Giờ thi đấu       |
| stadium    | TEXT    | Sân vận động      |

### Bảng `goals`

| Cột             | Kiểu    | Mô tả                |
| --------------- | ------- | -------------------- |
| id              | INTEGER | Primary Key          |
| goal_code       | TEXT    | Mã bàn thắng         |
| match_result_id | INTEGER | FK đến match_results |
| player_id       | INTEGER | FK đến players       |
| team_id         | INTEGER | FK đến teams         |
| goal_type       | TEXT    | Loại bàn thắng       |
| goal_time       | INTEGER | Phút ghi bàn         |

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi "Port 5000 already in use"

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Lỗi "CORS Policy"

Đảm bảo client chạy trên port 3000 hoặc 3001 (đã được cấu hình trong server).

### Lỗi "Cannot find module"

```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
```

### Database bị lock

Restart server hoặc đóng tất cả kết nối đến file database.sqlite.

---

## 📞 Liên Hệ & Hỗ Trợ

- **Repository**: https://github.com/iamvuduy/se104_football
- **Issues**: Tạo issue trên GitHub để báo lỗi hoặc yêu cầu tính năng mới

---

## 📄 License

Dự án này được phát triển cho mục đích học tập - SE104 UIT.

---

**© 2025 Football Tournament Management System**
