from sqlalchemy import func, extract
from datetime import datetime, timedelta
from app.models import Product, ImportSlip, ImportSlipDetail, ExportSlip, ExportSlipDetail
from app import db

class DashboardService:
    @staticmethod
    def get_inventory_summary():
        # 1. Tổng giá trị tồn kho hiện tại
        # Giả sử standard_price là giá vốn/giá chuẩn
        total_value = db.session.query(
            func.sum(Product.quantity_in_stock * Product.standard_price)
        ).scalar() or 0

        # 2. Số lượng sản phẩm sắp hết hàng (chỉ tính sản phẩm đang bán)
        low_stock_count = Product.query.filter(
            Product.quantity_in_stock <= 10,
            Product.is_active == True
        ).count()

        # 3. Tổng số mặt hàng đang quản lý
        total_products = Product.query.count()

        return {
            "total_inventory_value": total_value,
            "low_stock_items": low_stock_count,
            "total_products": total_products
        }

    @staticmethod
    def get_monthly_movement_chart(year=None):
        if not year:
            year = datetime.now().year

        # --- LẤY DỮ LIỆU NHẬP ---
        # Query: Join ImportSlipDetail với ImportSlip, group theo tháng
        import_data = db.session.query(
            func.extract('month', ImportSlip.created_at).label('month'),
            func.sum(ImportSlipDetail.quantity).label('total_qty')
        ).join(ImportSlip).filter(
            func.extract('year', ImportSlip.created_at) == year
        ).group_by('month').all()

        # --- LẤY DỮ LIỆU XUẤT ---
        export_data = db.session.query(
            func.extract('month', ExportSlip.created_at).label('month'),
            func.sum(ExportSlipDetail.quantity).label('total_qty')
        ).join(ExportSlip).filter(
            func.extract('year', ExportSlip.created_at) == year
        ).group_by('month').all()

        # --- CHUẨN HÓA DỮ LIỆU CHO FRONTEND (Mảng 12 tháng) ---
        inbound = [0] * 12
        outbound = [0] * 12

        for record in import_data:
            inbound[int(record.month) - 1] = int(record.total_qty)
            
        for record in export_data:
            outbound[int(record.month) - 1] = int(record.total_qty)

        return {
            "categories": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            "series": [
                {"name": "Inbound (Nhập)", "data": inbound},
                {"name": "Outbound (Xuất)", "data": outbound}
            ]
        }
    
    @staticmethod
    def get_stock_alerts(limit=5, threshold=10):
        # Lấy các sản phẩm có tồn kho thấp (chỉ sản phẩm đang bán)
        products = Product.query.filter(
            Product.quantity_in_stock <= threshold,
            Product.is_active == True
        ).order_by(Product.quantity_in_stock.asc()).limit(limit).all()

        results = []
        for p in products:
            status = "Out of Stock" if p.quantity_in_stock == 0 else "Low Stock"
            results.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "current_stock": p.quantity_in_stock,
                "status": status,
                # Nếu bạn muốn tính toán xem với tốc độ xuất hiện tại thì bao lâu nữa hết hàng
                # Bạn sẽ cần query thêm lịch sử xuất của sp này, nhưng tạm thời để simple
            })
        
        return results