# 📦 Smart Warehouse Management (Quản Lý Kho Hàng Thông Minh)

Giải pháp quản lý kho hàng hiện đại tích hợp công nghệ Nhận dạng Ký tự Quang học (OCR) sử dụng Trí tuệ Nhân tạo (AI) để tự động hóa quy trình nhập liệu.

---

## 🚀 1. Giới Thiệu Dự Án

**Smart Warehouse Management** là hệ thống quản lý kho hàng được xây dựng để đơn giản hóa và tự động hóa các quy trình nghiệp vụ kho cho các doanh nghiệp vừa và nhỏ.

* **Điểm nhấn công nghệ:** Tích hợp **OCR bằng AI** để tự động trích xuất dữ liệu từ hình ảnh hóa đơn, giúp **giảm thiểu sai sót** và **đẩy nhanh tốc độ nhập liệu** so với phương pháp thủ công.
* **Phù hợp với:** Các doanh nghiệp muốn số hóa quy trình quản lý kho, theo dõi tồn kho chính xác và phân quyền rõ ràng cho nhân viên.

---

## 🛠️ 2. Kiến Trúc & Công Nghệ

Dự án được xây dựng theo **kiến trúc client-server tách biệt**, giúp dễ dàng cho việc phát triển, bảo trì và mở rộng.

### Frontend (Thư mục `/client`)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Framework** | React.js (TypeScript) |
| **Styling** | Tailwind CSS |
| **State Management** | React Hooks (`useState`, `useEffect`) |
| **HTTP Client** | Axios |

### Backend (Thư mục `/server`)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Framework** | Flask (Python) |
| **ORM & Migration** | Flask-SQLAlchemy & Flask-Migrate |
| **Xác thực** | Flask-JWT-Extended (JSON Web Tokens) |
| **CSDL** | SQLite (môi trường phát triển) |
| **Mô hình AI** | Tích hợp mô hình OCR tùy chỉnh để xử lý ảnh |

---

## ✨ 3. Tính Năng Nổi Bật

### 3.1. Quản lý Nhập/Xuất Kho

* **Nhập kho bằng AI (OCR):**
    * Quản lý upload hình ảnh hóa đơn.
    * Hệ thống AI tự động phân tích và điền thông tin sản phẩm (tên, số lượng, đơn giá, thành tiền) vào biểu mẫu.
    * Cho phép kiểm tra, chỉnh sửa, thêm/xóa sản phẩm trước khi xác nhận.
    * **Tự động cập nhật** số lượng tồn kho sau khi nhập thành công.
* **Xuất kho thủ công:**
    * Tạo phiếu xuất kho bằng cách chọn sản phẩm từ danh sách có sẵn.
    * Hệ thống kiểm tra tính hợp lệ của số lượng tồn kho.
    * Tự động cập nhật (giảm) số lượng tồn kho tương ứng.
* **Lịch sử Nhập/Xuất:** Lưu trữ và hiển thị chi tiết lịch sử của tất cả các phiếu nhập và phiếu xuất.

### 3.2. Quản lý Sản phẩm & Tồn kho

* **Danh mục sản phẩm trung tâm:** Quản lý tất cả sản phẩm tại một nơi duy nhất.
* **Theo dõi tồn kho thời gian thực:** Số lượng tồn kho (`quantity_in_stock`) được cập nhật tự động sau mỗi giao dịch nhập/xuất.

### 3.3. Xác thực & Phân quyền

* **Hệ thống tài khoản:** Hỗ trợ đăng ký và đăng nhập an toàn (mật khẩu được mã hóa).
* **Phân quyền theo vai trò (Roles):**
    * **Quản lý (Manager):** Toàn quyền truy cập (nhập/xuất kho, quản lý sản phẩm, xem báo cáo).
    * **Nhân viên (Employee):** Quyền truy cập hạn chế (xem thông tin sản phẩm, nhận thông báo xếp hàng vào kho).

### 3.4. Báo cáo & Thông báo

* **Hệ thống Thông báo:** Khi Quản lý thực hiện lệnh nhập kho, hệ thống tự động gửi thông báo đến các Nhân viên liên quan để họ thực hiện công việc sắp xếp hàng hóa.
* **Tính năng chưa làm:** Dashboard Tổng quan (cung cấp cái nhìn nhanh về tình hình kho hàng, sản phẩm sắp hết), Đăng nhập bằng Google (OAuth 2.0).

---

## ⚙️ 4. Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu

* **Node.js:** Phiên bản 18 trở lên.
* **Python:** Phiên bản 3.10 trở lên.
* **uv:** (Python package manager, cài bằng `pip install uv`).

### 4.1. Cài Đặt Backend (Server)

Mở Terminal và thực hiện các lệnh sau:

```bash
# Di chuyển vào thư mục server
cd server

# 1. Tạo và kích hoạt môi trường ảo
python -m venv .venv
.venv\Scripts\activate  # Dùng cho Windows PowerShell
# source .venv/bin/activate # Dùng cho macOS/Linux

# 2. Cài đặt các thư viện Python (bao gồm Flask)
python -m uv pip install -r requirements.txt

# 3. Thiết lập biến môi trường cho Flask (Cần chạy lại sau mỗi lần mở Terminal mới)
$env:FLASK_APP = "main.py"

# 4. Khởi tạo và cập nhật cơ sở dữ liệu (LƯU Ý: Bỏ qua 'flask db init' nếu thư mục migrations đã tồn tại)
# flask db init             
# flask db migrate -m "Initial database setup"
flask db upgrade # Áp dụng các bảng vào CSDL app.db

# 5. Chạy server Flask (Mặc định trên cổng 5000)
python -m flask run
```
### 4.2. Cài Đặt Frontend (Client)

Mở **Terminal mới** (giữ Terminal Server đang chạy) và thực hiện các lệnh sau:

```bash
# 1. Di chuyển vào thư mục client
cd client

# 2. Cài đặt các gói Node.js (npm)
npm install

# 3. Chạy ứng dụng React (Mặc định thường trên cổng 3000 hoặc 5173)
npm run dev
# Hoặc: npm start
```
Sau khi cả hai Server chạy thành công, truy cập địa chỉ Frontend (ví dụ: `http://localhost:5173/`) trên trình duyệt để sử dụng ứng dụng.
