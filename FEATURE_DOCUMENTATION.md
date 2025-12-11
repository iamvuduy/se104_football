# Tài liệu: Hệ Thống Báo Cáo Bảng Xếp Hạng Đội Bóng

## Tổng Quan

Hệ thống cho phép **Tournament Admin** quản lý bảng xếp hạng đội bóng với 3 trạng thái chính:

1. **Draft** - Báo cáo được lập nhưng chưa công khai
2. **Published** - Báo cáo được công khai cho người dùng khác xem
3. **Unpublished** - Báo cáo được ẩn để chỉnh sửa

## Các Nút Điều Khiển (Chỉ Tournament Admin)

### 1️⃣ "📝 Lập Báo Cáo" (Create/Update Report)

**Mục đích:** Tạo hoặc cập nhật bảng xếp hạng cho vòng đấu đã chọn

**Logic:**

- Tính toán bảng xếp hạng dựa trên kết quả trận đấu hiện tại
- Lưu báo cáo ở trạng thái **Draft** (chưa công khai)
- Người dùng khác **KHÔNG THỂ** xem được
- Tournament Admin có thể chỉnh sửa trước khi công khai

**Khi nào bấm:**

- Sau khi nhập kết quả trận đấu mới
- Lần đầu tiên lập báo cáo cho một vòng
- Để cập nhật bảng xếp hạng với dữ liệu mới nhất

**Biểu thị cập nhật:** Khi có dữ liệu trận đấu mới, nút sẽ hiển thị dấu **!** đỏ

---

### 2️⃣ "✅ Đưa Báo Cáo" (Publish Report)

**Mục đích:** Công khai báo cáo để người dùng khác có thể xem

**Logic:**

- Thay đổi trạng thái báo cáo từ **Draft** → **Published**
- Người dùng khác (không phải tournament_admin) **CÓ THỂ** xem bảng xếp hạng này
- Chỉ xuất hiện khi báo cáo ở trạng thái Draft

**Khi nào bấm:**

- Sau khi kiểm tra và xác nhận báo cáo chính xác
- Khi sẵn sàng chia sẻ bảng xếp hạng với tất cả người dùng

**Quy trình:**

```
Lập Báo Cáo → Kiểm tra → Đưa Báo Cáo → Công khai cho tất cả
(Draft)                   (Published)
```

---

### 3️⃣ "🔒 Ẩn Báo Cáo" (Unpublish Report)

**Mục đích:** Ẩn báo cáo khỏi người dùng khác để chỉnh sửa

**Logic:**

- Thay đổi trạng thái báo cáo từ **Published** → **Draft**
- Người dùng khác **KHÔNG THỂ** xem bảng xếp hạng này
- Tournament Admin **CÓ THỂ** tiếp tục chỉnh sửa
- Chỉ xuất hiện khi báo cáo ở trạng thái Published

**Khi nào bấm:**

- Khi phát hiện lỗi trong báo cáo đã công khai
- Để cập nhật dữ liệu mới trước khi công khai lại
- Để chỉnh sửa thông tin không chính xác

**Quy trình:**

```
Đưa Báo Cáo → Phát hiện lỗi → Ẩn Báo Cáo → Chỉnh sửa → Đưa lại
(Published)                  (Draft)
```

---

## Quy Trình Công Việc

### Lần Đầu Tiên Lập Báo Cáo

```
1. Chọn vòng đấu
2. Bấm "📝 Lập Báo Cáo" → Báo cáo ở trạng thái Draft
3. Kiểm tra dữ liệu trong bảng
4. Bấm "✅ Đưa Báo Cáo" → Báo cáo được công khai
5. Người dùng khác có thể xem
```

### Cập Nhật Báo Cáo Đã Công Khai

```
1. Bấm "🔒 Ẩn Báo Cáo" → Báo cáo quay về Draft
2. Bấm "📝 Lập Báo Cáo" để cập nhật dữ liệu mới
3. Kiểm tra lại dữ liệu
4. Bấm "✅ Đưa Báo Cáo" → Công khai phiên bản mới
```

### Khắc Phục Lỗi

```
1. Phát hiện lỗi trong báo cáo đã công khai
2. Bấm "🔒 Ẩn Báo Cáo" → Người dùng khác không thể xem
3. Bấm "📝 Lập Báo Cáo" để tính toán lại
4. Bấm "✅ Đưa Báo Cáo" → Công khai báo cáo sửa chữa
```

---

## Quyền Hạn Theo Vai Trò

| Chức Năng             | Tournament Admin | User Khác |
| --------------------- | ---------------- | --------- |
| Xem báo cáo Draft     | ✅ Có            | ❌ Không  |
| Xem báo cáo Published | ✅ Có            | ✅ Có     |
| Lập/Cập nhật báo cáo  | ✅ Có            | ❌ Không  |
| Đưa báo cáo           | ✅ Có            | ❌ Không  |
| Ẩn báo cáo            | ✅ Có            | ❌ Không  |

---

## Thông Báo & Trạng Thái

### Dấu Hiệu Có Dữ Liệu Mới

- Nút "📝 Lập Báo Cáo" hiển thị dấu **!** đỏ
- Có thông báo: "Có dữ liệu mới cần cập nhật"
- Nguyên nhân: Có kết quả trận đấu mới sau khi báo cáo được lập

### Thông Báo Thành Công

- **Lập Báo Cáo:** "✓ Báo cáo đã được lập thành công. Hãy ấn 'Đưa Báo Cáo' để công khai cho người dùng khác!"
- **Đưa Báo Cáo:** "✓ Báo cáo đã được công khai! Người dùng khác hiện có thể xem bảng xếp hạng này."
- **Ẩn Báo Cáo:** "✓ Báo cáo đã được ẩn khỏi người dùng khác. Bạn có thể chỉnh sửa và công khai lại sau."

---

## Câu Hỏi Thường Gặp

**Q: Người dùng khác có thể xem bảng xếp hạng nếu tôi không bấm "Đưa Báo Cáo"?**
A: Không. Chỉ khi báo cáo được **Published**, người dùng khác mới có thể xem.

**Q: Nếu tôi ẩn báo cáo, dữ liệu có bị xóa không?**
A: Không. Báo cáo vẫn được lưu, chỉ ẩn khỏi người dùng khác. Bạn vẫn có thể xem và công khai lại.

**Q: Tôi có thể sửa báo cáo sau khi đã công khai không?**
A: Có. Bấm "ẩn Báo Cáo" → "Lập Báo Cáo" để cập nhật → "Đưa Báo Cáo" để công khai lại.

**Q: Dấu "!" trên nút có ý nghĩa gì?**
A: Có trận đấu mới được nhập sau khi báo cáo được lập. Bấm "Lập Báo Cáo" để cập nhật dữ liệu mới nhất.

---

## API Endpoints (Backend)

### POST `/api/leaderboard/reports/team`

Tạo/cập nhật báo cáo (Draft state)

```json
{
  "round": 5
}
```

Phản hồi: Báo cáo được lưu ở trạng thái Draft

### PUT `/api/leaderboard/reports/team/{round}/publish`

Công khai báo cáo

```
Phản hồi: Báo cáo thay đổi thành Published
```

### PUT `/api/leaderboard/reports/team/{round}/unpublish`

Ẩn báo cáo

```
Phản hồi: Báo cáo thay đổi thành Draft
```

### GET `/api/leaderboard/reports/team/{round}`

Lấy báo cáo (chỉ Published cho non-admin)

```
Phản hồi: Dữ liệu báo cáo
```

---

## Tóm Tắt Nhanh

| Nút    | Trạng Thái Hiện Tại | Trạng Thái Sau | Ai Có Thể Xem       |
| ------ | ------------------- | -------------- | ------------------- |
| 📝 Lập | N/A                 | Draft          | Chỉ Admin           |
| ✅ Đưa | Draft               | Published      | Admin + Tất cả User |
| 🔒 Ẩn  | Published           | Draft          | Chỉ Admin           |
