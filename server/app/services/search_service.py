# app/services/search_service.py
from pymongo import MongoClient
from thefuzz import process, fuzz # Thư viện so khớp mờ

"""
Phục vụ cho tìm kiếm ở nhập kho.
Các công việc liên quan đến MongoDB để tìm kiếm nhanh SP.
"""
MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'smart_warehouse_search'
COLLECTION_NAME = 'products'

class SearchService:
    client = MongoClient(MONGO_URI)
    collection = client[DB_NAME][COLLECTION_NAME]

    @staticmethod
    def match_product(ocr_text):
        """
        Input: Text từ OCR (VD: "nuoc m@m nam ngu")
        Output: Dictionary chứa thông tin match và độ tin cậy
        """
        if not ocr_text or len(ocr_text.strip()) < 2:
            return None

        # BƯỚC 1: Tìm kiếm sơ bộ bằng MongoDB Full-text search
        # (Lọc ra khoảng 5-10 ứng viên tiềm năng nhất)
        candidates_cursor = SearchService.collection.find(
            {"$text": {"$search": ocr_text}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(10)
        
        candidates = list(candidates_cursor)

        # Nếu Mongo không tìm thấy gì (Text quá sai lệch), thử tìm tất cả (nếu DB nhỏ) 
        # hoặc trả về NEW ngay. Ở đây ta trả về NEW.
        if not candidates:
            return {
                "status": "NEW",
                "confidence": 0.0,
                "match": None
            }

        # BƯỚC 2: Dùng TheFuzz để tính điểm chính xác (Re-ranking)
        # Mongo search text tốt nhưng scoring đôi khi không chuẩn với lỗi OCR ký tự
        # TheFuzz so sánh từng ký tự rất chuẩn.
        
        choices = {str(c['_id']): c['name'] for c in candidates}
        # process.extractOne trả về: (Best Match String, Score, Key)
        best_match = process.extractOne(ocr_text, choices, scorer=fuzz.token_sort_ratio)
        
        if not best_match:
             return {"status": "NEW", "confidence": 0.0, "match": None}

        match_name, score, match_key = best_match
        
        # Tìm lại object đầy đủ từ candidates
        found_product = next((c for c in candidates if str(c['_id']) == match_key), None)

        # BƯỚC 3: Phân loại Confidence Score (0-100)
        # Quy tắc:
        # > 99: Chắc chắn đúng (AUTO)
        # 70 - 99: Có thể đúng, cần check (SUGGESTION)
        # < 70: Không chắc lắm (NEW)
        
        confidence = score / 100.0
        status = "NEW"
        
        if score == 100:
            status = "AUTO"
        elif score >= 70:
            status = "SUGGESTION"
        
        return {
            "status": status,
            "confidence": confidence,
            "match": {
                "id": found_product['mysql_id'],
                "name": found_product['name'],
                "sku": found_product['sku']
            } if status != "NEW" else None
        }

    @staticmethod
    def add_product(product_obj):
        """
        Thêm một sản phẩm mới vào MongoDB ngay lập tức để phục vụ tìm kiếm.
        Input: product_obj (SQLAlchemy Model Object)
        """
        try:
            doc = {
                "mysql_id": product_obj.id,
                "name": product_obj.name,
                "sku": product_obj.sku,
                "search_text": f"{product_obj.name} {product_obj.sku}" 
            }
            SearchService.collection.insert_one(doc)
            print(f"--- Demo Demo, đã đồng bộ sản phẩm '{product_obj.name}' sang MongoDB ---")
        except Exception as e:
            print(f"Lỗi đồng bộ MongoDB: {e}")

    @staticmethod
    def update_product_in_mongo(product_obj):
        """
        Cập nhật thông tin 1 sản phẩm trong MongoDB khi MySQL thay đổi
        """
        try:
            SearchService.collection.update_one(
                {"mysql_id": product_obj.id}, # Tìm theo ID
                {"$set": {
                    "name": product_obj.name,
                    "sku": product_obj.sku,
                    "search_text": f"{product_obj.name} {product_obj.sku}"
                }},
                upsert=True # Nếu chưa có thì tạo mới luôn
            )
            print(f"--- Đã cập nhật MongoDB cho ID {product_obj.id} ---")
        except Exception as e:
            print(f"Lỗi update MongoDB: {e}")
