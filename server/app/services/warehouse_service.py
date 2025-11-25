# app/services/warehouse_service.py
from app.extensions import db
from app.models import Product, ImportSlip, ImportSlipDetail, ExportSlip, ExportSlipDetail

class WarehouseService:
    @staticmethod
    def get_all_products():
        products = Product.query.order_by(Product.name).all()
        return [{
            'id': p.id,
            'name': p.name,
            'sku': p.sku,
            'description': p.description,
            'quantity_in_stock': p.quantity_in_stock
        } for p in products]

    @staticmethod
    def create_import_slip(data):
        """Xử lý logic nhập kho: Tạo phiếu, cập nhật tồn kho, lưu chi tiết"""
        # 1. Validation cơ bản
        if not data or 'items' not in data:
            raise ValueError("Dữ liệu nhập kho không hợp lệ hoặc thiếu items.")

        try:
            # 2. Tạo phiếu nhập
            new_slip = ImportSlip(
                code=data.get('code'),
                total_amount=data.get('invoice_total', 0)
            )
            db.session.add(new_slip)
            db.session.flush() # Để lấy ID của slip

            # 3. Xử lý từng sản phẩm
            for item in data['items']:
                product_name = item.get('itemName')
                quantity = int(item.get('quantity', 0))
                
                # Logic tìm hoặc tạo mới sản phẩm
                product = Product.query.filter_by(name=product_name).first()
                if not product:
                    product = Product(name=product_name, quantity_in_stock=quantity)
                    db.session.add(product)
                else:
                    current_stock = product.quantity_in_stock or 0
                    product.quantity_in_stock = current_stock + quantity
                
                db.session.flush() # Để lấy product.id

                # Tạo chi tiết phiếu
                detail = ImportSlipDetail(
                    quantity=quantity,
                    import_price=float(item.get('unitPrice', 0)),
                    total_price=float(item.get('amount', 0)),
                    import_slip_id=new_slip.id,
                    product_id=product.id
                )
                db.session.add(detail)

            # 4. Commit transaction
            db.session.commit()
            return new_slip
            
        except Exception as e:
            db.session.rollback()
            raise e # Ném lỗi ra để Controller bắt

    @staticmethod
    def create_export_slip(data):
        """Xử lý logic xuất kho"""
        if not data or 'items' not in data:
            raise ValueError("Dữ liệu xuất kho không hợp lệ.")
            
        # 1. Check tồn kho trước (Atomic check)
        for item in data['items']:
            product = db.session.get(Product, item['product_id'])
            qty_needed = int(item['quantity'])
            
            if not product:
                raise ValueError(f"Sản phẩm ID {item['product_id']} không tồn tại.")
            if product.quantity_in_stock < qty_needed:
                raise ValueError(f"Sản phẩm '{product.name}' không đủ tồn kho (Còn: {product.quantity_in_stock}).")

        try:
            # 2. Tạo phiếu xuất
            new_slip = ExportSlip(code=data.get('code'), reason=data.get('reason'))
            db.session.add(new_slip)
            db.session.flush()

            # 3. Trừ kho và tạo detail
            for item in data['items']:
                product = db.session.get(Product, item['product_id'])
                qty = int(item['quantity'])
                
                product.quantity_in_stock -= qty # Trừ kho
                
                detail = ExportSlipDetail(
                    quantity=qty,
                    export_price=item.get('export_price'),
                    export_slip_id=new_slip.id,
                    product_id=product.id
                )
                db.session.add(detail)
            
            db.session.commit()
            return new_slip

        except Exception as e:
            db.session.rollback()
            raise e