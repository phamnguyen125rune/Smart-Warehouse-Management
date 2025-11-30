# app/services/warehouse_service.py
from app.extensions import db
from app.models import Product, ImportSlip, ImportSlipDetail, ExportSlip, ExportSlipDetail
from datetime import datetime
from app import ai_model 
from app.services.search_service import SearchService

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
            raise ValueError("Dữ liệu nhập kho không hợp lệ.")

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
                
                    if item.get('update_price', False):
                        product.standard_price = float(item.get('unitPrice', 0))

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

    @staticmethod
    def process_ocr_upload(file_path):
        """
        Xử lý toàn bộ quy trình từ Ảnh -> Dữ liệu Smart Table
        """
        # 1. Gọi AI
        raw_text_block = ai_model.process_ocr(file_path)
        
        # 2. Parse chuỗi thành danh sách items
        # Format: Tên SP (có thể có dấu cách) - SL - Thành tiền - Đơn giá
        lines = raw_text_block.strip().split('\n')
        processed_items = []

        # Bỏ qua dòng header (index 0), chạy từ dòng 1
        for line in lines[1:]:
            line = line.strip()
            if not line: continue

            parts = line.split(' ')
            if len(parts) < 4: continue

            # Lấy 3 phần tử cuối là số (Unit Price, Amount, Quantity)
            # Lưu ý thứ tự trong code giả lập là: Name Qty Amount Price
            try:
                s_unit_price = parts.pop() # Lấy cuối: Unit Price
                s_amount = parts.pop()     # Lấy kế cuối: Amount
                s_quantity = parts.pop()   # Lấy kế nữa: Quantity
                
                # Phần còn lại ghép lại thành tên
                ocr_name = " ".join(parts)
                
                qty = int(s_quantity)
                price = float(s_unit_price)
                amount = float(s_amount)
            except ValueError:
                # Nếu parse lỗi dòng nào thì bỏ qua dòng đó
                continue

            # 3. Gọi Search Engine để so khớp tên (QUAN TRỌNG)
            # Hàm này trả về { status: 'AUTO'/'SUGGESTION'/'NEW', match: {...}, confidence: 0.9 }
            match_result = SearchService.match_product(ocr_name)
            
            # 4. Map dữ liệu về chuẩn UI Frontend (ImportSlipItemUI)
            ui_item = {
                "tempId": int(datetime.now().timestamp() * 1000000) + len(processed_items), # ID tạm
                "ocrText": ocr_name, # Giữ lại tên gốc để hiện Placeholder
                
                # Nếu match được thì điền thông tin, không thì để trống
                "productId": match_result['match']['id'] if match_result['match'] else None,
                "productName": match_result['match']['name'] if match_result['match'] else "", 
                "sku": match_result['match']['sku'] if match_result['match'] else "",
                
                "quantity": qty,
                "unitPrice": price,
                "amount": amount,
                
                # Metadata cho bảng thông minh
                "status": match_result['status'], 
                "confidence": match_result['confidence'],
                "isUserEdited": False
            }
            processed_items.append(ui_item)

        return processed_items

    @staticmethod
    def create_product(data):
        """
        Tạo sản phẩm mới
        """
        # 1. Lấy dữ liệu từ input
        name = data.get('name')
        sku = data.get('sku')
        description = data.get('description')
            
        # Xử lý giá: Nếu không gửi lên thì mặc định là 0, khi tạo phiếu nhập sẽ tự điền
        try:
            standard_price = float(data.get('standard_price', 0))
        except (ValueError, TypeError):
            standard_price = 0.0

        # 2. Validation (Kiểm tra dữ liệu)
        if not name:
            raise ValueError("Tên sản phẩm là bắt buộc.")
            
        # Nếu có nhập SKU, kiểm tra xem SKU đã tồn tại chưa
        if sku:
            existing_sku = Product.query.filter_by(sku=sku).first()
            if existing_sku:
                raise ValueError(f"Mã SKU '{sku}' đã tồn tại.")

        # Kiểm tra trùng tên
        if Product.query.filter_by(name=name).first():
            raise ValueError(f"Sản phẩm có tên '{name}' đã tồn tại.")

        # 3. Tạo đối tượng Product
        new_product = Product(
            name=name,
            sku=sku,
            description=description,
            quantity_in_stock=0, # Số lượng sản phẩm mới tạo
            standard_price=standard_price # Lưu giá nhập chuẩn
        )

        # 4. Transaction qua DB
        try:
            db.session.add(new_product)
            db.session.commit()
            SearchService.add_product(new_product)

            # 5. Trả về dữ liệu đầy đủ cho Frontend
            return {
                "id": new_product.id,
                "name": new_product.name,
                "sku": new_product.sku,
                "description": new_product.description,
                "quantity_in_stock": new_product.quantity_in_stock,
                "standard_price": new_product.standard_price
            }
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def update_product(product_id, data):
        """Cập nhật thông tin sản phẩm"""
        product = db.session.get(Product, product_id)
        if not product:
            raise ValueError("Sản phẩm không tồn tại")

        # 1. Cập nhật thông tin (Chỉ update cái gì được gửi lên)
        if 'name' in data:
            # Check trùng tên nếu cần (trừ chính nó)
            existing = Product.query.filter(Product.name == data['name'], Product.id != product_id).first()
            if existing: raise ValueError("Tên sản phẩm đã tồn tại")
            product.name = data['name']
            
        if 'sku' in data:
            # Check trùng SKU
            existing = Product.query.filter(Product.sku == data['sku'], Product.id != product_id).first()
            if existing: raise ValueError("Mã SKU đã tồn tại")
            product.sku = data['sku']

        if 'description' in data:
            product.description = data['description']
            
        if 'standard_price' in data:
            try:
                product.standard_price = float(data['standard_price'])
            except:
                pass # Giữ nguyên nếu lỗi

        try:
            db.session.commit()
            
            # 2. Đồng bộ sang MongoDB ngay lập tức
            # Để lát nữa ra ngoài search là thấy tên mới liền
            SearchService.update_product_in_mongo(product)
            
            return {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "description": product.description,
                "quantity_in_stock": product.quantity_in_stock,
                "standard_price": product.standard_price
            }
        except Exception as e:
            db.session.rollback()
            raise e