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
* **uv**: Trình quản lý gói Python, cài đặt bằng `pip install uv`.

### 4.1 Thiết đặt DB
#### PHẦN 1: TẢI MYSQL

**Hướng dẫn Tải và Cài đặt Chính xác**

Cách dễ dàng và an toàn nhất để cài đặt cả MySQL Server, Workbench và các công cụ cần thiết khác cùng một lúc là sử dụng **MySQL Installer**.

Hãy làm theo các bước sau:

1.  **Đi đến trang tải MySQL Installer:**
    *   Truy cập vào trang web chính thức của MySQL: [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)

2.  **Chọn phiên bản để tải:**
    *   Bạn sẽ thấy hai lựa chọn. Hãy chọn phiên bản **lớn hơn** (khoảng 300-400MB), có tên là `mysql-installer-community-...`. Phiên bản này đã bao gồm tất cả mọi thứ bạn cần.

3.  **Tải xuống:**
    *   Nhấn nút "Download".
    *   Trang tiếp theo sẽ yêu cầu bạn đăng nhập hoặc đăng ký tài khoản Oracle. Bạn **không cần làm vậy**. Hãy tìm và nhấn vào dòng chữ nhỏ ở phía dưới: **"No thanks, just start my download."**

4.  **Chạy file Installer (`.msi`) và Cài đặt:**
    *   Mở file bạn vừa tải về.
    *   **"Choosing a Setup Type":** Ở bước này, hãy chọn **"Developer Default"**. Lựa chọn này sẽ tự động cài đặt tất cả những gì bạn cần:
        *   MySQL Server (cái quan trọng nhất)
        *   MySQL Workbench (công cụ đồ họa)
        *   MySQL Shell
        *   Và các connector khác.
    *   **"Check Requirements":** Trình cài đặt có thể báo thiếu một số thứ như "Microsoft Visual C++ ...". Nếu có, hãy nhấn "Execute" và nó sẽ tự động tải và cài đặt giúp bạn.
    *   **"Installation":** Nhấn "Execute" để bắt đầu cài đặt các thành phần.
    *   **"Product Configuration":** Đây là các bước cấu hình quan trọng.
        *   **Type and Networking:** Giữ nguyên các thiết lập mặc định (Port: 3306).
        *   **Authentication Method:** Chọn **"Use Strong Password Encryption..."** (đây là lựa chọn được khuyến nghị).
        *   **Accounts and Roles:** **Đây là bước quan trọng nhất.** Bạn cần đặt mật khẩu cho người dùng `root`. Hãy đặt một mật khẩu mà bạn dễ nhớ và **ghi nó lại**. Bạn sẽ cần mật khẩu này để kết nối Workbench và cấu hình trong file `config.py`.
        *   **Windows Service:** Giữ nguyên các thiết lập mặc định. Điều này sẽ giúp MySQL tự động khởi động cùng Windows.
    *   **Hoàn tất:** Cứ nhấn "Next" và "Finish" cho đến khi quá trình cài đặt hoàn tất.

Sau khi cài đặt xong, MySQL Server sẽ đang chạy dưới dạng một dịch vụ (service) trên máy của bạn, và bạn sẽ có biểu tượng MySQL Workbench trên Desktop để bắt đầu sử dụng.

#### Cập nhật Chuỗi kết nối trong `config.py`

1.  Mở file `/server/config.py`.
2.  Tìm dòng `SQLALCHEMY_DATABASE_URI`.
3.  Sửa nó thành chuỗi kết nối đến CSDL MySQL bạn vừa tạo, nhớ thay `your_password` bằng mật khẩu root bạn đã đặt trong quá trình cài đặt.

# /server/config.py

class Config:
    # ...
    
    # Cấu hình kết nối MySQL
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:your_password@localhost/smart_warehouse'
    
    # ...

**Hiện tại đang là:**
`SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:phamtrungnguyen12c8@localhost/smart_warehouse'`
Hãy sửa theo mật khẩu của bạn.

#### Tạo lại Cấu trúc Bảng trong CSDL MySQL

Vì CSDL `smart_warehouse` trên MySQL của bạn hiện đang hoàn toàn trống, chúng ta cần chạy lại migration để Flask tạo các bảng cần thiết.
1.  Mở terminal trong thư mục `/server`.
2.  Kích hoạt môi trường ảo: `.venv\Scripts\activate`.
3.  Thiết lập biến môi trường Flask: `$env:FLASK_APP = "main.py"`.
4.  **Quan trọng:** Hãy chắc chắn rằng bạn đã xóa thư mục `migrations` cũ để bắt đầu lại từ đầu một cách sạch sẽ.

#### PHẦN 2: THIẾT ĐẶT CSDL

1.  **Mở MySQL Workbench:** Khởi động ứng dụng MySQL Workbench. Trên màn hình chính, bạn sẽ thấy một kết nối, thường có tên là "Local instance...". Click vào đó. Nhập mật khẩu root mà bạn đã tạo khi cài đặt MySQL và nhấn OK.

2.  **Mở một Tab Truy vấn (Query Tab):** Sau khi kết nối, bạn sẽ thấy giao diện chính. Click vào nút đầu tiên trên thanh công cụ có biểu tượng trông giống như một file SQL với dấu cộng màu vàng ("Create a new SQL tab for executing queries"). Một tab soạn thảo mới sẽ mở ra.

3.  **Chạy lệnh Tạo Database:** Trong tab soạn thảo đó, gõ chính xác lệnh sau:
    ```sql
    CREATE DATABASE smart_warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```

4.  **Thực thi lệnh:** Click vào biểu tượng tia sét màu vàng trên thanh công cụ để thực thi câu lệnh bạn vừa gõ.

5.  **Kiểm tra kết quả:** Ở khung "SCHEMAS" bên trái, click chuột phải và chọn "Refresh All". Bạn sẽ thấy một CSDL mới tên là `smart_warehouse` xuất hiện trong danh sách thì đã thành công.

#### HÀNH ĐỘNG TIẾP THEO

Sau khi bạn đã tạo thành công CSDL `smart_warehouse` trong Workbench, hãy quay lại terminal và chạy lại các lệnh `migrate` và `upgrade`:

```bash
# Di chuyển vào thư mục server
cd server

# Tạo và kích hoạt môi trường ảo
python -m venv .venv # Nếu chưa thực hiện
.venv\Scripts\activate  # Dùng cho Windows PowerShell

# Thiết lập lại biến môi trường
$env:FLASK_APP = "main.py"

# Bước 1: Khởi tạo
python -m flask db init

# Bước 2: Tạo file migration
python -m flask db migrate -m "Initial migration on MySQL"

# Bước 3: Áp dụng vào CSDL
python -m flask db upgrade

# Chạy lệnh seed
python -m flask seed

```


```
ngoài ra nếu muốn tạo lại csdl hãy thực hiện các bước sau.
# 1. (Thủ công) Xóa thư mục 'migrations' bằng chuột phải -> Delete
# 2. Chạy SQL: DROP DATABASE smart_warehouse; CREATE DATABASE smart_warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# 3. Hoặc xóa thủ công (Drop DB) và chạy ScriptS: CREATE DATABASE smart_warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 4. Trở về Dự án. Chạy lần lượt các lệnh sau tại terminal server:
$env:FLASK_APP = "main.py"
Remove-Item -Recurse -Force migrations  
python -m flask db init
python -m flask db migrate -m "Reset DB"
python -m flask db upgrade
python -m flask seed # Chạy seed với 2 user và khoảng 100 sản phẩm có sẵn
python -m app.utils.mongo_sync # Lệnh này sẽ đồng bộ hóa lên mongodb, hữu ích khi cả hai xung đột trong môi trường phát triển.

### 4.2. Cài Đặt Backend (Server)

Mở Terminal và thực hiện các lệnh sau:

```bash
# Di chuyển vào thư mục server
cd server

# 1. Tạo và kích hoạt môi trường ảo
python -m venv .venv # Nếu chưa thực hiện, chỉ thực hiện 1 lần
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
python -m flask seed # Chạy seed để demo

# 5. Chạy server Flask (Mặc định trên cổng 5000)
python -m flask run
```
### 4.3. Cài Đặt Frontend (Client)

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
