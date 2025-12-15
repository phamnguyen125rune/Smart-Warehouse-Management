import os
import json
import re
from sqlalchemy.exc import IntegrityError
from . import db
from .models import Role, User, Product, ImportSlip, ImportSlipDetail, NotificationCategory, ExportSlip, ExportSlipDetail, AuditLog

def seed_data():
    """
    Hàm này sẽ XÓA SẠCH database cũ và nạp lại dữ liệu mới từ đầu.
    """
    print("--- START SEEDING ---")
    
    # [QUAN TRỌNG] Xóa toàn bộ bảng cũ và tạo lại bảng mới
    # Điều này giúp cập nhật cấu trúc cột mới (is_active, standard_price)
    # và xóa dữ liệu rác.
    print("WARNING: Dropping all tables and recreating...")
    db.drop_all()
    db.create_all()
    print("Database reset successfully.")

    # Bắt đầu nạp dữ liệu theo thứ tự
    seed_roles_and_users()
    seed_notification_categories()
    seed_products_combined()
    
    print("--- SEEDING COMPLETED ---")

def seed_roles_and_users():
    """Tạo Role và User mặc định."""
    print("Creating roles and users...")
    
    # Tạo Role
    manager_role = Role(name='manager')
    employee_role = Role(name='employee')
    db.session.add_all([manager_role, employee_role])
    db.session.commit()
    
    # Tạo User Admin
    m_role = Role.query.filter_by(name='manager').first()
    manager = User(
        employee_id='admin', 
        full_name='Quản lý Chính', 
        role_id=m_role.id, 
        email='manager@test.com'
    )
    manager.set_password('123456')
    db.session.add(manager)
    
    # Tạo User Nhân viên
    e_role = Role.query.filter_by(name='employee').first()
    employee = User(
        employee_id='NV001', 
        full_name='Nhân viên A', 
        role_id=e_role.id, 
        email='nv1@test.com'
    )
    employee.set_password('123456')
    db.session.add(employee)

    db.session.commit()

def seed_notification_categories():
    """Tạo các danh mục thông báo."""
    categories = [
        {"name": "Hệ thống", "icon": "bell"},
        {"name": "Bảo mật", "icon": "shield-check"},
        {"name": "Kho hàng", "icon": "box"},
        {"name": "Hộp thư", "icon": "mail"},
        {"name": "Nhân sự", "icon": "users"}
    ]
    for cat in categories:
        db.session.add(NotificationCategory(name=cat["name"], icon=cat["icon"]))
    db.session.commit()

def seed_products_combined():
    """
    Hàm tổng hợp:
    1. Nạp bookstore.json -> Hàng chuẩn (Active)
    2. Nạp all_products.json -> Hàng OCR (Inactive)
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Bộ nhớ đệm để kiểm tra trùng lặp
    existing_skus = set()
    existing_names_lower = set()
    current_auto_count = 0

    # =========================================================================
    # PHẦN 1: NẠP BOOKSTORE.JSON (HÀNG CHUẨN - ACTIVE)
    # =========================================================================
    bookstore_path = os.path.join(current_dir, 'bookstore.json')
    if os.path.exists(bookstore_path):
        print(f"📚 Processing bookstore.json...")
        try:
            with open(bookstore_path, 'r', encoding='utf-8') as f:
                books = json.load(f)
                
            count_book = 0
            for item in books:
                p_sku = item.get('sku', '').strip()
                p_name = item.get('name', '').strip()
                
                # Bỏ qua nếu thiếu tên hoặc SKU
                if not p_name or not p_sku: continue
                # Bỏ qua nếu trùng
                if (p_sku in existing_skus) or (p_name.lower() in existing_names_lower): continue

                new_prod = Product(
                    sku=p_sku,
                    name=p_name,
                    description=item.get('description', ''),
                    quantity_in_stock=item.get('quantity_in_stock', 0),
                    standard_price=item.get('price', 0),
                    is_active=True # [QUAN TRỌNG] Sản phẩm này đang kinh doanh
                )
                
                try:
                    db.session.add(new_prod)
                    db.session.commit()
                    
                    # Cập nhật vào bộ nhớ đệm
                    existing_skus.add(p_sku)
                    existing_names_lower.add(p_name.lower())
                    count_book += 1
                except:
                    db.session.rollback()
                    
            print(f"✅ Đã thêm {count_book} sản phẩm từ bookstore.json")
        except Exception as e:
            print(f"❌ Lỗi đọc bookstore.json: {e}")
    else:
        print("⚠️ Không tìm thấy bookstore.json")

    # =========================================================================
    # PHẦN 2: NẠP ALL_PRODUCTS.JSON (HÀNG OCR - INACTIVE)
    # =========================================================================
    ocr_path = os.path.join(current_dir, 'all_products.json')
    if os.path.exists(ocr_path):
        print(f"🛒 Processing all_products.json...")
        try:
            with open(ocr_path, 'r', encoding='utf-8') as f:
                ocr_data = json.load(f)
            
            # Làm phẳng danh sách sản phẩm từ các file con
            raw_list = []
            for file_key, prod_list in ocr_data.items():
                raw_list.extend(prod_list)
            
            count_ocr = 0
            
            for name in raw_list:
                if not name or not name.strip(): continue
                
                # Làm sạch tên (bỏ mã số đầu dòng)
                clean_name = re.sub(r'^\d{7,}\s*', '', name.strip())
                if not clean_name: continue
                
                name_check = clean_name.lower()

                # Kiểm tra trùng với DB (bao gồm cả sách vừa thêm ở phần 1)
                # Nếu trùng -> Bỏ qua (ưu tiên dữ liệu từ bookstore hơn)
                if name_check in existing_names_lower:
                    continue
                
                # Tạo SKU tự động
                current_auto_count += 1
                sku_code = f"SKU{current_auto_count:05d}"
                
                # Tạo sản phẩm (Giá = 0, Inactive)
                new_prod = Product(
                    sku=sku_code,
                    name=clean_name,
                    description="Sản phẩm gốc từ dữ liệu OCR",
                    quantity_in_stock=0,
                    standard_price=0,
                    is_active=False # [QUAN TRỌNG] Sản phẩm này ngừng kinh doanh (chỉ dùng để map AI)
                )

                try:
                    db.session.add(new_prod)
                    db.session.commit()
                    
                    existing_names_lower.add(name_check)
                    count_ocr += 1
                except:
                    db.session.rollback()
                    current_auto_count -= 1 
            
            print(f"✅ Đã thêm {count_ocr} sản phẩm tạp hóa từ all_products.json")
            
        except Exception as e:
            print(f"❌ Lỗi đọc all_products.json: {e}")
    else:
        print("⚠️ Không tìm thấy all_products.json")