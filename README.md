1. Giới thiệu
Smart Warehouse Management là một giải pháp quản lý kho hàng hiện đại, được xây dựng để đơn giản hóa và tự động hóa quy trình nghiệp vụ kho. Điểm nhấn của dự án là việc tích hợp công nghệ Nhận dạng Ký tự Quang học (OCR) sử dụng Trí tuệ Nhân tạo (AI), cho phép hệ thống tự động trích xuất dữ liệu từ hình ảnh hóa đơn, giảm thiểu sai sót và đẩy nhanh tốc độ nhập liệu.
Ứng dụng này phù hợp cho các doanh nghiệp vừa và nhỏ muốn số hóa quy trình quản lý kho, theo dõi tồn kho chính xác và phân quyền rõ ràng cho nhân viên.
2. Kiến trúc & Công nghệ
Dự án được xây dựng theo kiến trúc client-server tách biệt, giúp dễ dàng phát triển, bảo trì và mở rộng.
Frontend (Thư mục /client)
Framework: React.js (sử dụng TypeScript)
Styling: Tailwind CSS
State Management: React Hooks (useState, useEffect)
HTTP Client: Axios
Backend (Thư mục /server)
Framework: Flask (Python)
ORM & Migration: Flask-SQLAlchemy & Flask-Migrate
Xác thực: Flask-JWT-Extended (sử dụng JSON Web Tokens)
CSDL: SQLite (cho môi trường phát triển)
Mô hình AI: Tích hợp mô hình OCR tùy chỉnh để xử lý ảnh.
3. Tính năng nổi bật
Quản lý Nhập/Xuất Kho
Nhập kho bằng AI (OCR):
Người dùng (Quản lý) upload hình ảnh hóa đơn.
Hệ thống AI tự động phân tích và điền thông tin sản phẩm (tên, số lượng, đơn giá, thành tiền) vào biểu mẫu.
Cho phép người dùng kiểm tra, chỉnh sửa, thêm hoặc xóa sản phẩm trước khi xác nhận nhập kho.
Tự động cập nhật số lượng tồn kho của sản phẩm sau khi nhập thành công.
Xuất kho thủ công:
Người dùng tạo phiếu xuất kho bằng cách chọn sản phẩm từ danh sách có sẵn.
Hệ thống kiểm tra số lượng tồn kho để đảm bảo tính hợp lệ.
Tự động cập nhật (giảm) số lượng tồn kho tương ứng.
Lịch sử Nhập/Xuất:
Lưu trữ và hiển thị chi tiết lịch sử của tất cả các phiếu nhập và phiếu xuất.
Quản lý Sản phẩm & Tồn kho
Danh mục sản phẩm trung tâm: Một nơi duy nhất để quản lý tất cả các sản phẩm trong kho.
Theo dõi tồn kho thời gian thực: Số lượng tồn kho (quantity_in_stock) được cập nhật tự động sau mỗi giao dịch nhập/xuất.
Xác thực & Phân quyền
Hệ thống tài khoản: Hỗ trợ đăng ký và đăng nhập an toàn (mật khẩu được mã hóa).
Phân quyền theo vai trò (Roles):
Quản lý (Manager): Có toàn quyền truy cập, bao gồm nhập/xuất kho, quản lý sản phẩm và xem báo cáo.
Nhân viên (Employee): Có quyền truy cập hạn chế, chủ yếu để xem thông tin sản phẩm và nhận thông báo xếp hàng vào kho.
Đăng nhập bằng Google (OAuth 2.0): (Chưa làm) Cung cấp phương thức đăng nhập tiện lợi, an toàn.
Báo cáo & Thông báo
Dashboard Tổng quan: (Chưa làm) Cung cấp cái nhìn nhanh về tình hình kho hàng, các sản phẩm sắp hết hàng, và hoạt động gần đây.
Hệ thống Thông báo:
Khi Quản lý thực hiện một lệnh nhập kho, hệ thống tự động gửi thông báo đến các Nhân viên liên quan để họ thực hiện công việc sắp xếp hàng hóa.
4. Hướng dẫn cài đặt & Chạy dự án
Yêu cầu:
Node.js (phiên bản 18 trở lên)
Python (phiên bản 3.10 trở lên)
uv (Python package manager, cài bằng pip install uv)
Cài đặt Backend (Server):

# 1. Di chuyển vào thư mục server
cd server

# 2. Tạo và kích hoạt môi trường ảo
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# 3. Cài đặt các thư viện Python bằng uv
uv pip install -r requirements.txt

# 4. Thiết lập biến môi trường cho Flask
# Windows (PowerShell)
$env:FLASK_APP = "main.py"
# macOS/Linux
export FLASK_APP=main.py

# 5. Khởi tạo và cập nhật cơ sở dữ liệu
flask db init      # (Chỉ chạy lần đầu tiên)
flask db migrate -m "Initial database setup"
flask db upgrade

# 6. Chạy server Flask (mặc định trên port 5000)
uv run python main.py
Cài đặt Frontend (Client):

# 1. Mở một terminal mới, di chuyển vào thư mục client
cd client

# 2. Cài đặt các gói Node.js
npm install

# 3. Chạy ứng dụng React (mặc định trên port 3000)
npm start
Sau khi hoàn tất, truy cập http://localhost:3000 trên trình duyệt để sử dụng ứng dụng.

5. Mô tả API Backend
POST /api/v1/imports/ocr-upload: Upload ảnh hóa đơn để xử lý OCR.
POST /api/v1/imports/invoices: Lưu một hóa đơn nhập kho mới vào CSDL.
POST /api/auth/register: Đăng ký tài khoản người dùng mới.
POST /api/auth/login: Đăng nhập và nhận về JWT access token.
(Chưa làm) GET /api/products: Lấy danh sách tất cả sản phẩm.
(Chưa làm) GET /api/invoices: Lấy lịch sử các hóa đơn.
(Chưa làm) GET /api/notifications: Lấy danh sách thông báo cho nhân viên.
