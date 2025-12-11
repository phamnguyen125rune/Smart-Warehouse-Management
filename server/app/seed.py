# app/seed.py
import os
import json
import re
from sqlalchemy.exc import IntegrityError  # Import thêm để bắt lỗi trùng lặp
from . import db
from .models import Role, User, Product, ImportSlip, ImportSlipDetail, NotificationCategory

def seed_data():
    print("--- START SEEDING ---")
    seed_roles_and_users()
    seed_notification_categories()
    seed_products_from_json()
    print("--- SEEDING COMPLETED ---")

def seed_roles_and_users():
    if Role.query.count() == 0:
        print("Creating roles...")
        manager_role = Role(name='manager')
        employee_role = Role(name='employee')
        db.session.add_all([manager_role, employee_role])
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

def seed_products_from_json():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, 'all_products.json')

    if not os.path.exists(json_path):
        print(f"WARNING: Không tìm thấy file {json_path}.")
        return

    print(f"Reading products from {json_path}...")

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"ERROR: Lỗi đọc file JSON: {e}")
        return

    # 1. Lấy danh sách tên đã có để lọc bớt
    existing_products = Product.query.with_entities(Product.name).all()
    existing_names_lower = {p.name.lower().strip() for p in existing_products if p.name}
    current_count = Product.query.count()

    # 2. Xử lý danh sách từ JSON
    raw_product_list = []
    for filename, prod_list in data.items():
        raw_product_list.extend(prod_list)

    print(f"Processing {len(raw_product_list)} items from JSON...")
    
    success_count = 0
    duplicate_count = 0
    error_count = 0

    # Set tạm để tránh trùng trong chính lần chạy này
    session_names = set()

    for name in raw_product_list:
        if not name or not name.strip():
            continue

        # Làm sạch tên
        clean_name = re.sub(r'^\d{7,}\s*', '', name.strip())
        
        if not clean_name:
            continue
        
        # Check trùng sơ bộ (Python check)
        if clean_name.lower() in existing_names_lower or clean_name.lower() in session_names:
            duplicate_count += 1
            continue

        # Chuẩn bị Insert
        session_names.add(clean_name.lower())
        current_count += 1
        sku_code = f"SKU{current_count:05d}"
        
        new_product = Product(
            name=clean_name,
            sku=sku_code,
            description="",     
            quantity_in_stock=0,
            standard_price=0 
        )

        # [QUAN TRỌNG] Lưu từng sản phẩm một (Row-by-Row Commit)
        try:
            db.session.add(new_product)
            db.session.commit() # Cố gắng lưu ngay lập tức
            success_count += 1
        except IntegrityError:
            db.session.rollback() # Nếu lỗi trùng (MySQL check), rollback dòng này thôi
            duplicate_count += 1
            # print(f"  -> Trùng lặp (DB từ chối): {clean_name}") # Uncomment nếu muốn xem chi tiết
        except Exception as e:
            db.session.rollback()
            error_count += 1
            print(f"  -> Lỗi lạ với {clean_name}: {e}")

    print(f"✅ KẾT QUẢ: Thêm mới {success_count} | Trùng lặp {duplicate_count} | Lỗi {error_count}")