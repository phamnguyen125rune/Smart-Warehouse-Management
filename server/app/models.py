from datetime import datetime
from . import db, bcrypt
from werkzeug.security import generate_password_hash, check_password_hash

'''
Product (Mặt hàng):
    Lưu trữ danh sách duy nhất của tất cả các mặt hàng.
    Chứa cột quantity_in_stock (số lượng tồn kho)\
ImportSlip (Phiếu Nhập Kho):
    Mỗi phiếu nhập có một mã tham chiếu (code), ngày tạo, và tổng giá trị.
    Mỗi phiếu nhập sẽ có nhiều ImportSlipDetail(Chi tiết phiếu nhập).
ImportSlipDetail (Chi tiết Phiếu Nhập Kho):
    Là một dòng chi tiết trong một Phiếu Nhập.
    "Trong phiếu nhập X, đã nhập sản phẩm Y với số lượng Z và đơn giá là W".
    Liên kết trực tiếp đến ImportSlip và Product.
ExportSlip (Phiếu Xuất Kho):
    Có thể có lý do xuất kho (reason).
ExportSlipDetail (Chi tiết Phiếu Xuất Kho):
    "Trong phiếu xuất A, đã xuất sản phẩm B với số lượng C".
'''

# Bảng trung tâm: Quản lý tất cả mặt hàng và số lượng tồn kho
class Product(db.Model):
    __tablename__ = 'product'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), unique=True, nullable=False, index=True)
    sku = db.Column(db.String(50), unique=True, nullable=True)  # Stock Keeping Unit
    description = db.Column(db.Text, nullable=True)
    quantity_in_stock = db.Column(db.Integer, nullable=False, default=0)

    # Mối quan hệ với các chi tiết phiếu
    import_details = db.relationship('ImportSlipDetail', backref='product', lazy='dynamic')
    export_details = db.relationship('ExportSlipDetail', backref='product', lazy='dynamic')

    def __repr__(self):
        return f'<Product {self.name} (In Stock: {self.quantity_in_stock})>'

# Bảng cho nghiệp vụ Nhập Kho
class ImportSlip(db.Model):
    __tablename__ = 'import_slip'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=True, index=True) # Mã hóa đơn gốc
    created_at = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    total_amount = db.Column(db.Float, nullable=True, default=0)
    
    details = db.relationship('ImportSlipDetail', backref='import_slip', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<ImportSlip ID: {self.id}>'

class ImportSlipDetail(db.Model):
    __tablename__ = 'import_slip_detail'
    id = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)
    import_price = db.Column(db.Float, nullable=False) # Đơn giá tại thời điểm nhập
    total_price = db.Column(db.Float, nullable=False)

    # Khóa ngoại
    import_slip_id = db.Column(db.Integer, db.ForeignKey('import_slip.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)

# Bảng cho nghiệp vụ Xuất Kho
class ExportSlip(db.Model):
    __tablename__ = 'export_slip'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=True, index=True) # Mã tham chiếu
    reason = db.Column(db.String(200), nullable=True) # Lý do xuất kho
    created_at = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    
    details = db.relationship('ExportSlipDetail', backref='export_slip', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<ExportSlip ID: {self.id}>'

class ExportSlipDetail(db.Model):
    __tablename__ = 'export_slip_detail'
    id = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)
    export_price = db.Column(db.Float, nullable=True) # Giá bán/xuất (có thể có hoặc không)

    # Khóa ngoại
    export_slip_id = db.Column(db.Integer, db.ForeignKey('export_slip.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)

"""
User
Về User, và role, nó sẽ là các trường thông tin người dùng và phân quyền.
"""

class Role(db.Model):
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # 'manager', 'employee'
    users = db.relationship('User', backref='role', lazy='dynamic')

    def __repr__(self):
        return f'<Role {self.name}>'

# Bảng User đã được hoàn thiện
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # Dùng để đăng nhập
    full_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
        
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    # Email đăng nhập thứ cấp qua Google
    google_auth_email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    
    # Thông tin cá nhân có thể chỉnh sửa
    email = db.Column(db.String(120), nullable=True) # Email liên lạc
    phone_number = db.Column(db.String(20), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    
    # Địa chỉ
    country = db.Column(db.String(100), nullable=True)
    city_state = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    tax_id = db.Column(db.String(50), nullable=True)
    
    # Mạng xã hội
    facebook_url = db.Column(db.String(255), nullable=True)
    x_url = db.Column(db.String(255), nullable=True)
    linkedin_url = db.Column(db.String(255), nullable=True)
    instagram_url = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Khóa ngoại
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.full_name} ({self.employee_id})>'

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "full_name": self.full_name,
            "email": self.email,
            "google_auth_email": self.google_auth_email,
            "phone_number": self.phone_number,
            "bio": self.bio,
            "country": self.country,
            "city_state": self.city_state,
            "postal_code": self.postal_code,
            "tax_id": self.tax_id,
            "avatar_url": self.avatar_url,
            "role": self.role.name if self.role else None, # Lấy tên role
            "social_links": {
                "facebook": self.facebook_url,
                "x": self.x_url,
                "linkedin": self.linkedin_url,
                "instagram": self.instagram_url,
            }
        }


# Bảng ghi lại các hành động quan trọng
class AuditLog(db.Model):
    __tablename__ = 'audit_log'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # Ai thực hiện
    target_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Ai bị ảnh hưởng
    action = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text, nullable=True) # Chi tiết thêm

    actor = db.relationship('User', foreign_keys=[actor_id], backref='actions_performed')
    target_user = db.relationship('User', foreign_keys=[target_user_id], backref='actions_received')

"""
HỆ THỐNG THÔNG BÁO
"""
# Bảng để phân loại thông báo
class NotificationCategory(db.Model):
    __tablename__ = 'notification_category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False) # Ví dụ: "Kho hàng", "Bảo mật", "Nhân sự"
    icon = db.Column(db.String(50), nullable=True) # Tên icon (ví dụ: 'box', 'shield-lock')
    
    notifications = db.relationship('Notification', backref='category', lazy='dynamic')

    def __repr__(self):
        return f'<NotificationCategory {self.name}>'

# Bảng chính chứa các thông báo gửi đến người dùng
class Notification(db.Model):
    __tablename__ = 'notification'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    link_to = db.Column(db.String(255), nullable=True) # URL để điều hướng khi click

    # Khóa ngoại
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # Ai là người nhận
    category_id = db.Column(db.Integer, db.ForeignKey('notification_category.id'), nullable=False)

    # Mối quan hệ
    recipient = db.relationship('User', backref='notifications')

    def __repr__(self):
        return f'<Notification for User ID {self.recipient_id}>'
