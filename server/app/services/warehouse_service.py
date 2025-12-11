import re
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
        """Xử lý logic nhập kho"""
        if not data or 'items' not in data:
            raise ValueError("Dữ liệu nhập kho không hợp lệ.")

        try:
            new_slip = ImportSlip(
                code=data.get('code'),
                total_amount=data.get('invoice_total', 0)
            )
            db.session.add(new_slip)
            db.session.flush()

            for item in data['items']:
                product_name = item.get('itemName')
                quantity = int(item.get('quantity', 0))

                product = Product.query.filter_by(name=product_name).first()
                if not product:
                    product = Product(name=product_name, quantity_in_stock=quantity)
                    db.session.add(product)
                else:
                    current_stock = product.quantity_in_stock or 0
                    product.quantity_in_stock = current_stock + quantity
                
                    if item.get('update_price', False):
                        product.standard_price = float(item.get('unitPrice', 0))

                db.session.flush()

                detail = ImportSlipDetail(
                    quantity=quantity,
                    import_price=float(item.get('unitPrice', 0)),
                    total_price=float(item.get('amount', 0)),
                    import_slip_id=new_slip.id,
                    product_id=product.id
                )
                db.session.add(detail)

            db.session.commit()
            return new_slip
            
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def create_export_slip(data):
        """Xử lý logic xuất kho"""
        if not data or 'items' not in data:
            raise ValueError("Dữ liệu xuất kho không hợp lệ.")
            
        for item in data['items']:
            product = db.session.get(Product, item['product_id'])
            qty_needed = int(item['quantity'])
            
            if not product:
                raise ValueError(f"Sản phẩm ID {item['product_id']} không tồn tại.")
            if product.quantity_in_stock < qty_needed:
                raise ValueError(f"Sản phẩm '{product.name}' không đủ tồn kho (Còn: {product.quantity_in_stock}).")

        try:
            new_slip = ExportSlip(code=data.get('code'), reason=data.get('reason'))
            db.session.add(new_slip)
            db.session.flush()

            for item in data['items']:
                product = db.session.get(Product, item['product_id'])
                qty = int(item['quantity'])
                
                product.quantity_in_stock -= qty
                
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

    # --- HELPER FUNCTIONS ---
    @staticmethod
    def _clean_product_name(text):
        """
        Chỉ nhiệm vụ duy nhất: Xóa mã vạch ở đầu (nếu có).
        Không lo về việc cắt phạm vào số lượng nữa.
        """
        text = text.strip()
        # Regex: Xóa cụm số dài (>=6) ở đầu dòng và các ký tự rác trước nó
        text = re.sub(r'^.*?(\d{6,})[.\s]*', '', text)
        # Xóa ký tự nhiễu đầu dòng
        text = re.sub(r'^(NT|N0|Nr|:|LNT|\.|I\s)\s*', '', text)
        return text.strip()

    @staticmethod
    def _extract_numbers(text):
        """Tìm tất cả các con số trong một chuỗi bất kỳ"""
        text = text.replace('(', '1').replace('l', '1').replace('O', '0').replace('o', '0')
        matches = list(re.finditer(r'\d+(?:[.,]\d+)*', text))
        numbers = []
        for m in matches:
            try:
                clean_str = m.group().replace('.', '').replace(',', '')
                val = float(clean_str)
                numbers.append(val)
            except: pass
        return numbers

    @staticmethod
    def _parse_row_logic(line):
        """
        Logic: Tách chuỗi bằng dấu "|".
        - Phần 0: Chắc chắn là Tên (AI đã gom).
        - Phần 1, 2, 3: Là các con số (SL, Tổng, Giá). Ta sẽ extract lại và dùng logic toán học.
        """
        parts = line.split('|')
        
        # 1. Lấy tên (Phần đầu tiên)
        raw_name = parts[0]
        final_name = WarehouseService._clean_product_name(raw_name)
        
        # 2. Lấy tất cả các con số từ các phần còn lại
        # Gộp chuỗi còn lại để extract số 1 lần cho tiện
        numbers_part = " ".join(parts[1:]) 
        numbers_found = WarehouseService._extract_numbers(numbers_part)
        count = len(numbers_found)
        
        qty = 0; price = 0; amount = 0
        is_trustworthy = False

        # --- LOGIC TOÁN HỌC (Giữ nguyên vì nó thông minh) ---
        if count >= 2:
            # Sắp xếp để tìm 2 số lớn nhất
            sorted_nums = sorted(numbers_found)
            
            # Giả định: Số lớn nhất là Thành tiền, Số lớn nhì là Đơn giá
            # (Vì SL thường nhỏ hơn Giá)
            amount = sorted_nums[-1]
            price = sorted_nums[-2]
            
            # Tính lại SL
            if price > 0:
                calc = amount / price
                if abs(calc - round(calc)) < 0.05:
                    qty = int(round(calc))
                    is_trustworthy = True
                else:
                    qty = 0; is_trustworthy = False
            else: is_trustworthy = False
            
            # [MỞ RỘNG] Nếu có số thứ 3 (số nhỏ), check xem nó có khớp với SL tính được không
            # Nếu khớp -> Tăng độ tin cậy. Nếu không -> Kệ nó (vì ta tin phép chia hơn)

        elif count == 1:
            # Chỉ có 1 số -> Đoán là Giá = Tổng, SL = 1
            val = numbers_found[0]
            qty = 1; price = val; amount = val
            is_trustworthy = False # Cần check

        return final_name, qty, price, amount, is_trustworthy

    @staticmethod
    def process_ocr_upload(file_path):
        raw_text_block = ai_model.process_ocr(file_path)
        lines = raw_text_block.strip().split('\n')
        processed_items = []
        
        SKIP_KEYWORDS = ["ITEMNAME", "QUANTITY", "AMOUNT", "UNITPRICE"]

        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Kiểm tra keyword rác (Header)
            if any(k in line.upper() for k in SKIP_KEYWORDS): continue
            
            # Chỉ cần truyền dòng có chứa dấu | vào
            if "|" not in line: 
                # Trường hợp AI cũ hoặc lỗi format, fallback về logic cũ hoặc bỏ qua
                # Nhưng code my_ocr_core mới đã đảm bảo có |
                continue

            final_name, qty, price, amount, is_trustworthy = WarehouseService._parse_row_logic(line)
            
            if len(final_name) < 2: continue
            
            if price == 0 and amount == 0:
                continue

            # Fuzzy Search
            match_result = SearchService.match_product(final_name)
            product_id = None; sku = ""; status = "NEW"; confidence = 0.0; display_name = final_name

            if match_result and match_result['match']:
                display_name = match_result['match']['name']
                product_id = match_result['match']['id']
                sku = match_result['match']['sku']
                status = match_result['status']
                confidence = match_result['confidence']

            ui_item = {
                "tempId": int(datetime.now().timestamp() * 1000000) + len(processed_items),
                "ocrText": line.split('|')[0], # Chỉ hiện tên gốc
                "productId": product_id, "productName": display_name, "sku": sku,
                "quantity": qty, "unitPrice": float(price), "amount": float(amount),
                "status": status, "confidence": confidence, "isUserEdited": False,
                "needsManualCheck": not is_trustworthy
            }
            processed_items.append(ui_item)

        return { "items": processed_items, "raw_text": raw_text_block }

    @staticmethod
    def create_product(data):
        name = data.get('name')
        sku = data.get('sku')
        description = data.get('description')
        try:
            standard_price = float(data.get('standard_price', 0))
        except (ValueError, TypeError):
            standard_price = 0.0

        if not name: raise ValueError("Tên sản phẩm là bắt buộc.")
        
        if not sku or sku.strip() == "":
            last_product = Product.query.order_by(Product.id.desc()).first()
            next_id = (last_product.id + 1) if last_product else 1
            sku = f"SKU{next_id:04d}"
        else:
            existing_sku = Product.query.filter_by(sku=sku).first()
            if existing_sku: raise ValueError(f"Mã SKU '{sku}' đã tồn tại.")

        if Product.query.filter_by(name=name).first():
            raise ValueError(f"Sản phẩm có tên '{name}' đã tồn tại.")

        new_product = Product(name=name, sku=sku, description=description, quantity_in_stock=0, standard_price=standard_price)

        try:
            db.session.add(new_product)
            db.session.commit()
            SearchService.add_product(new_product)
            return {"id": new_product.id, "name": new_product.name, "sku": new_product.sku, "description": new_product.description, "quantity_in_stock": new_product.quantity_in_stock, "standard_price": new_product.standard_price}
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def update_product(product_id, data):
        product = db.session.get(Product, product_id)
        if not product: raise ValueError("Sản phẩm không tồn tại")

        if 'name' in data:
            existing = Product.query.filter(Product.name == data['name'], Product.id != product_id).first()
            if existing: raise ValueError("Tên sản phẩm đã tồn tại")
            product.name = data['name']
        if 'sku' in data:
            existing = Product.query.filter(Product.sku == data['sku'], Product.id != product_id).first()
            if existing: raise ValueError("Mã SKU đã tồn tại")
            product.sku = data['sku']
        if 'description' in data: product.description = data['description']
        if 'standard_price' in data:
            try: product.standard_price = float(data['standard_price'])
            except: pass

        try:
            db.session.commit()
            SearchService.update_product_in_mongo(product)
            return {"id": product.id, "name": product.name, "sku": product.sku, "description": product.description, "quantity_in_stock": product.quantity_in_stock, "standard_price": product.standard_price}
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_all_slips():
        imports = ImportSlip.query.all()
        exports = ExportSlip.query.all()
        combined = []
        for p in imports:
            combined.append({
                "id": p.id,
                "code": p.code,
                "type": "IMPORT",
                "created_at": p.created_at,
                "total_amount": p.total_amount,
                "item_count": len(p.details),
                "note": "Nhập kho"
            })
        for p in exports:
            total = sum([(d.quantity * (d.export_price or 0)) for d in p.details])
            combined.append({
                "id": p.id,
                "code": p.code,
                "type": "EXPORT",
                "created_at": p.created_at,
                "total_amount": total,
                "item_count": len(p.details),
                "note": p.reason or "Xuất kho"
            })
        combined.sort(key=lambda x: x['created_at'], reverse=True)
        return combined

    @staticmethod
    def get_slip_detail(slip_type, slip_id):
        slip = None
        items = []
        if slip_type == 'IMPORT':
            slip = db.session.get(ImportSlip, slip_id)
            if slip:
                items = [{
                    "product_name": d.product.name,
                    "sku": d.product.sku,
                    "quantity": d.quantity,
                    "unit_price": d.import_price,
                    "amount": d.total_price
                } for d in slip.details]
        elif slip_type == 'EXPORT':
            slip = db.session.get(ExportSlip, slip_id)
            if slip:
                items = [{
                    "product_name": d.product.name,
                    "sku": d.product.sku,
                    "quantity": d.quantity,
                    "unit_price": d.export_price or 0,
                    "amount": d.quantity * (d.export_price or 0)
                } for d in slip.details]

        if not slip:
            raise ValueError("Không tìm thấy phiếu")

        return {
            "id": slip.id,
            "code": slip.code,
            "type": slip_type,
            "created_at": slip.created_at,
            "items": items,
            "total_amount": slip.total_amount if slip_type == 'IMPORT' else sum(i['amount'] for i in items),
            "note": slip.reason if slip_type == 'EXPORT' else "Nhập hàng hóa"
        }