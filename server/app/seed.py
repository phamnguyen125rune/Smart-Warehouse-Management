# app/seed.py
import os
import json
import re
from sqlalchemy.exc import IntegrityError
from . import db
from .models import Role, User, Product, ImportSlip, ImportSlipDetail, NotificationCategory

def seed_data():
    print("--- START SEEDING ---")
    seed_roles_and_users()
    seed_notification_categories()
    seed_products_combined() # [MỚI] Hàm xử lý cả 2 file
    print("--- SEEDING COMPLETED ---")

def seed_roles_and_users():
    """Tạo Role và User mặc định."""
    if Role.query.count() == 0:
        print("Creating roles...")
        db.session.add_all([Role(name='manager'), Role(name='employee')])
        db.session.commit()
    
    if User.query.count() == 0:
        print("Creating users...")
        m_role = Role.query.filter_by(name='manager').first()
        e_role = Role.query.filter_by(name='employee').first()

        if not User.query.filter_by(employee_id='admin').first():
            manager = User(employee_id='admin', full_name='Quản lý Chính', role_id=m_role.id, email='manager@test.com')
            manager.set_password('123456')
            db.session.add(manager)
        
        if not User.query.filter_by(employee_id='NV001').first():
            employee = User(employee_id='NV001', full_name='Nhân viên A', role_id=e_role.id, email='nv1@test.com')
            employee.set_password('123456')
            db.session.add(employee)
        db.session.commit()

def seed_notification_categories():
    categories = [
        {"name": "Hệ thống", "icon": "bell"},
        {"name": "Bảo mật", "icon": "shield-check"},
        {"name": "Kho hàng", "icon": "box"},
        {"name": "Hộp thư", "icon": "mail"},
        {"name": "Nhân sự", "icon": "users"}
    ]
    for cat in categories:
        if not NotificationCategory.query.filter_by(name=cat["name"]).first():
            db.session.add(NotificationCategory(name=cat["name"], icon=cat["icon"]))
    db.session.commit()

def seed_products_combined():
    """
    Hàm tổng hợp:
    1. Nạp bookstore.json (Dữ liệu chuẩn, có giá, SKU cứng).
    2. Nạp all_products.json (Dữ liệu OCR, tự sinh SKU, giá = 0).
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Lấy dữ liệu hiện có để tránh trùng lặp giữa 2 file
    existing_products = Product.query.with_entities(Product.sku, Product.name).all()
    existing_skus = {p.sku for p in existing_products if p.sku}
    existing_names_lower = {p.name.lower().strip() for p in existing_products if p.name}
    
    # Biến đếm SKU tự động (dùng cho file all_products.json)
    # Tìm số SKU lớn nhất hiện tại (ví dụ SKU00150) để đếm tiếp
    current_auto_count = 0
    for sku in existing_skus:
        if sku.startswith("SKU") and sku[3:].isdigit():
            num = int(sku[3:])
            if num > current_auto_count:
                current_auto_count = num

    # --- PHẦN 1: NẠP BOOKSTORE.JSON ---
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
                
                # Check trùng
                if (p_sku in existing_skus) or (p_name.lower() in existing_names_lower):
                    continue

                new_prod = Product(
                    sku=p_sku,
                    name=p_name,
                    description=item.get('description', ''),
                    quantity_in_stock=item.get('quantity_in_stock', 0),
                    standard_price=item.get('price', 0),
                    is_active=True
                )
                
                try:
                    db.session.add(new_prod)
                    db.session.commit()
                    existing_skus.add(p_sku)
                    existing_names_lower.add(p_name.lower())
                    count_book += 1
                except:
                    db.session.rollback()
            print(f"✅ Đã thêm {count_book} sách từ bookstore.json")
        except Exception as e:
            print(f"❌ Lỗi đọc bookstore.json: {e}")
    else:
        print("⚠️ Không tìm thấy bookstore.json")

    # --- PHẦN 2: NẠP ALL_PRODUCTS.JSON ---
    ocr_path = os.path.join(current_dir, 'all_products.json')
    if os.path.exists(ocr_path):
        print(f"🛒 Processing all_products.json...")
        try:
            with open(ocr_path, 'r', encoding='utf-8') as f:
                ocr_data = json.load(f)
            
            # Làm phẳng danh sách
            raw_list = []
            for file_key, prod_list in ocr_data.items():
                raw_list.extend(prod_list)
            
            count_ocr = 0
            session_added_names = set() # Tránh trùng lặp nội bộ trong file OCR

            for name in raw_list:
                if not name or not name.strip(): continue
                
                # Clean tên (bỏ mã số đầu dòng)
                clean_name = re.sub(r'^\d{7,}\s*', '', name.strip())
                if not clean_name: continue
                
                name_check = clean_name.lower()

                # Check trùng với DB (bao gồm cả những sách vừa thêm ở Phần 1)
                if (name_check in existing_names_lower) or (name_check in session_added_names):
                    continue
                
                # Tạo SKU tự động
                current_auto_count += 1
                sku_code = f"SKU{current_auto_count:05d}"
                
                # Tạo sản phẩm (Giá = 0)
                new_prod = Product(
                    sku=sku_code,
                    name=clean_name,
                    description="",
                    quantity_in_stock=0,
                    standard_price=0,
                    is_active=True
                )

                try:
                    db.session.add(new_prod)
                    db.session.commit()
                    existing_names_lower.add(name_check)
                    session_added_names.add(name_check)
                    count_ocr += 1
                except:
                    db.session.rollback()
                    current_auto_count -= 1 # Lùi lại số SKU nếu lỗi
            
            print(f"✅ Đã thêm {count_ocr} sản phẩm tạp hóa từ all_products.json")
            
        except Exception as e:
            print(f"❌ Lỗi đọc all_products.json: {e}")
    else:
        print("⚠️ Không tìm thấy all_products.json")