# app/seed.py
from . import db
from .models import Role, User, Product, ImportSlip, ImportSlipDetail, NotificationCategory
import random
from datetime import datetime, timedelta

def seed_data():
    """Hàm tổng hợp để seed toàn bộ dữ liệu."""
    print("--- START SEEDING ---")
    seed_roles_and_users()
    seed_notification_categories()
    seed_products() # [NEW] Seed sản phẩm
    print("--- SEEDING COMPLETED ---")

def seed_roles_and_users():
    """Tạo Role và User mặc định."""
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

        manager = User(employee_id='admin', full_name='Quản lý Chính', role_id=m_role.id, email='manager@test.com')
        manager.set_password('123456')
        
        employee = User(employee_id='NV001', full_name='Nhân viên A', role_id=e_role.id, email='nv1@test.com')
        employee.set_password('123456')

        db.session.add_all([manager, employee])
        db.session.commit()

def seed_notification_categories():
    """Tạo các danh mục thông báo cơ bản."""
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

def seed_products():
    """Tạo dữ liệu sản phẩm mẫu."""
    # Logic cũ của bạn chỉ check count > 0 rồi return, có thể chưa đủ chặt chẽ nếu muốn seed thêm
    # Nhưng cách tốt nhất để fix lỗi Duplicate là check từng item hoặc xóa sạch trước khi seed.
    
    # Cách 1 (An toàn nhất cho Dev): Xóa sạch dữ liệu cũ trước khi seed lại
    # Cảnh báo: Mất hết dữ liệu nhập kho cũ liên quan
    # Product.query.delete()
    # ImportSlip.query.delete()
    # ImportSlipDetail.query.delete()
    # db.session.commit()

    # Cách 2 (Bổ sung): Chỉ thêm nếu chưa có SKU đó
    print("Seeding products...")
    
    products_data = [
        {"name": "Nước mắm Nam Ngư 500ml", "sku": "NM002", "desc": "Nước mắm cá cơm", "qty": 120, "price": 38000},
        {"name": "Nước mắm Nam Ngư 200ml", "sku": "NM003", "desc": "Độ đạm 25N", "qty": 90, "price": 21000},
        {"name": "Nước mắm Chinsu 750ml", "sku": "NM004", "desc": "Nước mắm truyền thống", "qty": 110, "price": 52000},
        {"name": "Nước tương Maggi 700ml", "sku": "NT001", "desc": "Đậm đặc", "qty": 140, "price": 24000},
        {"name": "Nước tương Tam Thái Tử 500ml", "sku": "NT002", "desc": "Đậm đà", "qty": 130, "price": 21000},
        {"name": "Muối i-ốt 500g", "sku": "GM001", "desc": "Muối tinh", "qty": 200, "price": 6000},
        {"name": "Muối hột Bạc Liêu 1kg", "sku": "GM002", "desc": "Muối biển tự nhiên", "qty": 180, "price": 12000},
        {"name": "Đường cát trắng 1kg", "sku": "DU001", "desc": "Đường tinh luyện", "qty": 150, "price": 21000},
        {"name": "Đường vàng 1kg", "sku": "DU002", "desc": "Đường vàng tự nhiên", "qty": 140, "price": 24000},
        {"name": "Bột ngọt Ajinomoto 1kg", "sku": "BG002", "desc": "MSG nguyên chất", "qty": 100, "price": 48000},
        {"name": "Bột ngọt Ajinomoto 200g", "sku": "BG003", "desc": "Hạt mịn", "qty": 160, "price": 16000},
        {"name": "Hạt nêm Knorr 400g", "sku": "HN001", "desc": "Hạt nêm thịt thăn", "qty": 170, "price": 26000},
        {"name": "Hạt nêm Aji-ngon 900g", "sku": "HN002", "desc": "Từ xương và thịt", "qty": 140, "price": 53000},
        {"name": "Bột nghệ 100g", "sku": "SP001", "desc": "Gia vị tự nhiên", "qty": 90, "price": 12000},
        {"name": "Tiêu xay 100g", "sku": "SP002", "desc": "Tiêu đen xay", "qty": 80, "price": 18000},
        {"name": "Ớt bột Hàn Quốc 200g", "sku": "SP003", "desc": "Ớt cay dùng làm kimchi", "qty": 70, "price": 42000},
        {"name": "Tương ớt Chinsu 250g", "sku": "TO001", "desc": "Tương ớt chính hãng", "qty": 150, "price": 12000},
        {"name": "Tương cà Chinsu 250g", "sku": "TC001", "desc": "Tương cà đậm vị", "qty": 140, "price": 11000},
        {"name": "Nước mắm Phú Quốc 40N 500ml", "sku": "NM005", "desc": "Nước mắm nguyên chất", "qty": 90, "price": 75000},
        {"name": "Dầu hào Maggi 350ml", "sku": "DH001", "desc": "Đậm vị", "qty": 120, "price": 22000},

        {"name": "Mì Hảo Hảo Tôm Chua Cay ly", "sku": "MI002", "desc": "Ly ăn liền", "qty": 200, "price": 6000},
        {"name": "Mì Kokomi 90g", "sku": "MI003", "desc": "Mì gói giá rẻ", "qty": 250, "price": 3500},
        {"name": "Mì Omachi sườn hầm", "sku": "MI004", "desc": "Khoai tây", "qty": 200, "price": 8500},
        {"name": "Phở ăn liền Vifon 65g", "sku": "PH001", "desc": "Phở bò", "qty": 150, "price": 9000},
        {"name": "Bún ăn liền Vifon 70g", "sku": "BU001", "desc": "Bún giò heo", "qty": 160, "price": 8000},
        {"name": "Miến dong 200g", "sku": "MN001", "desc": "Miến truyền thống", "qty": 140, "price": 15000},
        {"name": "Cháo Hảo Hảo gói", "sku": "CH001", "desc": "Cháo thịt bằm", "qty": 130, "price": 8500},
        {"name": "Cháo sen bát bảo 370g", "sku": "CH002", "desc": "Cháo đóng lon", "qty": 120, "price": 18000},
        {"name": "Mì 3 Miền chua cay", "sku": "MI005", "desc": "Thùng 30 gói", "qty": 80, "price": 105000},
        {"name": "Mì Miliket 2 vắt", "sku": "MI006", "desc": "Mì giấy huyền thoại", "qty": 90, "price": 3000},
        {"name": "Mì ly Cung Đình", "sku": "MI007", "desc": "Ly tiện dụng", "qty": 70, "price": 12000},
        {"name": "Phở khô 500g", "sku": "PH002", "desc": "Phở khô Hà Nội", "qty": 60, "price": 30000},
        {"name": "Bún khô 500g", "sku": "BU002", "desc": "Bún khô truyền thống", "qty": 55, "price": 28000},
        {"name": "Miến Hàn Quốc 500g", "sku": "MN002", "desc": "Miến khoai lang", "qty": 40, "price": 65000},
        {"name": "Mì Nhật Udon 200g", "sku": "MI008", "desc": "Nhập khẩu Nhật Bản", "qty": 30, "price": 35000},
        {"name": "Mì Ý Spaghetti 500g", "sku": "MI009", "desc": "Mì Ý tiêu chuẩn", "qty": 50, "price": 30000},
        {"name": "Phở gói Gấu Đỏ", "sku": "PH003", "desc": "Phở bò viên", "qty": 70, "price": 7500},
        {"name": "Bún tươi 500g", "sku": "BU003", "desc": "Đóng gói", "qty": 80, "price": 15000},
        {"name": "Miến ăn liền Gấu Đỏ", "sku": "MN003", "desc": "Miến thịt", "qty": 90, "price": 9000},

        {"name": "Gạo ST25 10kg", "sku": "GAO002", "desc": "Gạo thơm thượng hạng", "qty": 40, "price": 320000},
        {"name": "Gạo thơm Lài 5kg", "sku": "GAO003", "desc": "Gạo dẻo mềm", "qty": 60, "price": 150000},
        {"name": "Gạo nếp 2kg", "sku": "GAO004", "desc": "Nếp dẻo", "qty": 70, "price": 48000},
        {"name": "Ngũ cốc Nestlé 180g", "sku": "NG001", "desc": "Ngũ cốc ăn sáng", "qty": 110, "price": 45000},
        {"name": "Ngũ cốc Milo 200g", "sku": "NG002", "desc": "Ngũ cốc socola", "qty": 100, "price": 42000},
        {"name": "Sữa tươi Vinamilk 1L", "sku": "SU001", "desc": "100% sữa tươi", "qty": 150, "price": 33000},
        {"name": "Sữa tươi TH True Milk 1L", "sku": "SU002", "desc": "Ít đường", "qty": 140, "price": 31000},
        {"name": "Sữa đặc Ông Thọ đỏ", "sku": "SD001", "desc": "Lon 380g", "qty": 150, "price": 28000},
        {"name": "Sữa chua Vinamilk 4 hũ", "sku": "SC001", "desc": "Sữa chua có đường", "qty": 120, "price": 28000},
        {"name": "Sữa chua uống Probi 65ml", "sku": "SC002", "desc": "Men sống", "qty": 140, "price": 12000},
        {"name": "Bột ca cao Nesquik 200g", "sku": "BC001", "desc": "Ca cao pha", "qty": 60, "price": 35000},
        {"name": "Bột Milo 400g", "sku": "ML001", "desc": "Thức uống năng lượng", "qty": 80, "price": 65000},
        {"name": "Gạo tấm 5kg", "sku": "GAO005", "desc": "Gạo tấm sạch", "qty": 45, "price": 115000},
        {"name": "Gạo hữu cơ 2kg", "sku": "GAO006", "desc": "Gạo organic", "qty": 40, "price": 65000},
        {"name": "Yến mạch 500g", "sku": "YM001", "desc": "Nguyên hạt", "qty": 110, "price": 55000},
        {"name": "Ngũ cốc dinh dưỡng 500g", "sku": "NG003", "desc": "Bổ sung sắt", "qty": 90, "price": 60000},
        {"name": "Sữa Ensure Gold 850g", "sku": "SU003", "desc": "Cho người lớn tuổi", "qty": 40, "price": 820000},
        {"name": "Sữa bột GrowPLUS+ 900g", "sku": "SU004", "desc": "Cho trẻ em", "qty": 50, "price": 450000},
        {"name": "Ngũ cốc giảm cân 300g", "sku": "NG004", "desc": "Ít calo", "qty": 70, "price": 65000},

        {"name": "Nước suối Lavie 500ml", "sku": "NU001", "desc": "Nước tinh khiết", "qty": 300, "price": 4000},
        {"name": "Nước suối Lavie 1.5L", "sku": "NU002", "desc": "Tiện dụng", "qty": 260, "price": 7000},
        {"name": "Coca Cola lon 330ml", "sku": "CO001", "desc": "Nước ngọt có gas", "qty": 240, "price": 9000},
        {"name": "Pepsi lon 330ml", "sku": "CO002", "desc": "Có gas", "qty": 230, "price": 8500},
        {"name": "Sting dâu 330ml", "sku": "CO003", "desc": "Năng lượng", "qty": 210, "price": 8000},
        {"name": "Red Bull 250ml", "sku": "CO004", "desc": "Nước tăng lực", "qty": 120, "price": 12000},
        {"name": "Number One 330ml", "sku": "CO005", "desc": "Tăng lực", "qty": 190, "price": 7000},
        {"name": "Trà xanh Không Độ 455ml", "sku": "TEA001", "desc": "Giải nhiệt", "qty": 150, "price": 8000},
        {"name": "Trà Oolong Tea+ 455ml", "sku": "TEA002", "desc": "Giảm béo", "qty": 170, "price": 9000},
        {"name": "Nước cam ép 1L", "sku": "JU001", "desc": "100% cam tự nhiên", "qty": 80, "price": 35000},
        {"name": "Nước táo ép 1L", "sku": "JU002", "desc": "Không đường", "qty": 90, "price": 38000},
        {"name": "Sữa đậu nành Fami 200ml", "sku": "FA001", "desc": "Ít đường", "qty": 200, "price": 6000},
        {"name": "Trà đào lon 330ml", "sku": "TEA003", "desc": "Hương đào", "qty": 140, "price": 10000},
        {"name": "Nước dừa đóng hộp 330ml", "sku": "JU003", "desc": "Tươi mát", "qty": 120, "price": 15000},
        {"name": "Bò húc Thái 250ml", "sku": "CO006", "desc": "Red Bull Thái Lan", "qty": 100, "price": 18000},
        {"name": "Cà phê lon Highlands 235ml", "sku": "CF001", "desc": "Cà phê sữa", "qty": 130, "price": 15000},
        {"name": "Cà phê đen lon 330ml", "sku": "CF002", "desc": "Không đường", "qty": 110, "price": 12000},
        {"name": "Soda chanh 330ml", "sku": "CO007", "desc": "Sảng khoái", "qty": 115, "price": 9000},

        {"name": "Dầu gội Clear 650g", "sku": "DG001", "desc": "Sạch gàu", "qty": 100, "price": 130000},
        {"name": "Dầu gội Clear 200ml", "sku": "DG002", "desc": "Dung tích nhỏ", "qty": 120, "price": 42000},
        {"name": "Dầu gội Pantene 900ml", "sku": "DG003", "desc": "Mượt tóc", "qty": 80, "price": 150000},
        {"name": "Dầu xả Dove 650g", "sku": "DX001", "desc": "Mềm mượt", "qty": 95, "price": 135000},
        {"name": "Sữa tắm Lifebuoy 850ml", "sku": "ST001", "desc": "Kháng khuẩn", "qty": 110, "price": 155000},
        {"name": "Sữa tắm Hazeline 250ml", "sku": "ST002", "desc": "Tinh chất thiên nhiên", "qty": 140, "price": 45000},
        {"name": "Sữa rửa mặt Senka 100g", "sku": "SRM001", "desc": "Làm sạch sâu", "qty": 130, "price": 75000},
        {"name": "Sữa rửa mặt Nivea 100g", "sku": "SRM002", "desc": "Trắng sáng", "qty": 140, "price": 65000},
        {"name": "Kem đánh răng Colgate 230g", "sku": "KD001", "desc": "Ngừa sâu răng", "qty": 170, "price": 42000},
        {"name": "Kem đánh răng P/S 180g", "sku": "KD002", "desc": "Ngừa mảng bám", "qty": 160, "price": 32000},
        {"name": "Bàn chải P/S", "sku": "BC002", "desc": "Kháng khuẩn", "qty": 150, "price": 15000},
        {"name": "Nước rửa tay Lifebuoy 500ml", "sku": "RT001", "desc": "Diệt khuẩn 99.9%", "qty": 140, "price": 55000},
        {"name": "Nước rửa tay Lifebuoy 200ml", "sku": "RT002", "desc": "Tiện lợi", "qty": 160, "price": 26000},
        {"name": "Kem dưỡng da Nivea 200g", "sku": "DD001", "desc": "Dưỡng ẩm", "qty": 90, "price": 72000},
        {"name": "Kem dưỡng da Hazeline 100g", "sku": "DD002", "desc": "Làm sáng da", "qty": 95, "price": 55000},
        {"name": "Lăn khử mùi Nivea 50ml", "sku": "KM001", "desc": "Khử mùi", "qty": 100, "price": 60000},
        {"name": "Lăn khử mùi Degree 50ml", "sku": "KM002", "desc": "Bền lâu", "qty": 80, "price": 85000},
        {"name": "Gel vuốt tóc X-Men 150ml", "sku": "VT001", "desc": "Giữ nếp lâu", "qty": 85, "price": 65000},
        {"name": "Nước hoa mini 20ml", "sku": "NH001", "desc": "Hương thơm nhẹ", "qty": 40, "price": 90000},

        {"name": "Giấy vệ sinh Bless You 10 cuộn", "sku": "GS001", "desc": "Mềm mịn", "qty": 120, "price": 65000},
        {"name": "Khăn giấy rút 180 tờ", "sku": "GS002", "desc": "Tiện dụng", "qty": 150, "price": 18000},
        {"name": "Giấy ướt Bobby 100 tờ", "sku": "GS003", "desc": "Không mùi", "qty": 130, "price": 28000},
        {"name": "Giấy lau bếp 2 cuộn", "sku": "GS004", "desc": "Siêu thấm", "qty": 110, "price": 26000},
        {"name": "Nước lau nhà Sunlight 1L", "sku": "LN001", "desc": "Hương chanh", "qty": 140, "price": 38000},
        {"name": "Nước rửa chén Sunlight 750ml", "sku": "RC001", "desc": "Diệt dầu mỡ", "qty": 160, "price": 28000},
        {"name": "Nước rửa chén Sunlight 350ml", "sku": "RC002", "desc": "Nhỏ gọn", "qty": 180, "price": 18000},
        {"name": "Nước lau kính Gift 500ml", "sku": "GK001", "desc": "Lau kính không vệt", "qty": 140, "price": 24000},
        {"name": "Túi rác đen 1kg", "sku": "TR001", "desc": "Túi dày", "qty": 100, "price": 33000},
        {"name": "Túi zip 20 cái", "sku": "GD001", "desc": "Đựng thực phẩm", "qty": 200, "price": 15000},

        {"name": "Xúc xích CP 500g", "sku": "XL001", "desc": "Xúc xích đông lạnh", "qty": 90, "price": 65000},
        {"name": "Thịt nguội 200g", "sku": "TM001", "desc": "Jambon", "qty": 60, "price": 55000},
        {"name": "Bơ thực vật 200g", "sku": "BO001", "desc": "Bơ làm bánh", "qty": 70, "price": 38000},
        {"name": "Phô mai Con Bò Cười 8 viên", "sku": "PM001", "desc": "Phô mai mềm", "qty": 110, "price": 45000},
        {"name": "Phô mai Mozzarella 200g", "sku": "PM002", "desc": "Phô mai kéo sợi", "qty": 80, "price": 65000},
        {"name": "Bánh Oreo 133g", "sku": "BK001", "desc": "Bánh kem socola", "qty": 150, "price": 18000},
        {"name": "Snack Oishi tôm cay 90g", "sku": "SN001", "desc": "Snack tôm", "qty": 200, "price": 12000},
        {"name": "Kẹo dẻo Haribo 80g", "sku": "KE001", "desc": "Kẹo dẻo trái cây", "qty": 110, "price": 28000},
        {"name": "Kẹo Alpenliebe 100g", "sku": "KE002", "desc": "Caramen sữa", "qty": 140, "price": 15000},
        {"name": "Bánh gạo One One 150g", "sku": "BK002", "desc": "Bánh gạo", "qty": 120, "price": 22000},
        {"name": "Bánh bông lan Solite 336g", "sku": "BK003", "desc": "Bông lan mềm", "qty": 100, "price": 40000},
    ]

    # 1. Tạo Product
    created_products = []
    for p_data in products_data:
        product = Product(
            name=p_data["name"],
            sku=p_data["sku"],
            description=p_data["desc"],
            quantity_in_stock=p_data["qty"]
        )
        db.session.add(product)
        created_products.append(product)
    
    db.session.flush() # Để lấy ID của product vừa tạo

    # 2. Tạo Phiếu Nhập Kho giả lập (Để số lượng tồn kho có ý nghĩa)
    # Giả sử nhập 1 phiếu tổng cho tất cả
    import_slip = ImportSlip(
        code=f"IMP-{datetime.now().strftime('%Y%m%d')}-001",
        total_amount=0 # Sẽ tính lại sau
    )
    db.session.add(import_slip)
    db.session.flush()

    total_slip_amount = 0
    for product, p_data in zip(created_products, products_data):
        # Tạo chi tiết phiếu nhập
        detail = ImportSlipDetail(
            import_slip_id=import_slip.id,
            product_id=product.id,
            quantity=p_data["qty"],
            import_price=p_data["price"], # Giá nhập giả định
            total_price=p_data["qty"] * p_data["price"]
        )
        total_slip_amount += detail.total_price
        db.session.add(detail)

    import_slip.total_amount = total_slip_amount
    db.session.commit()
    print(f"Seeded {len(products_data)} products and 1 import slip.")
