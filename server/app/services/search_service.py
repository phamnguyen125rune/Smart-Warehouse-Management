from pymongo import MongoClient
from thefuzz import process, fuzz 
import re

# Cấu hình MongoDB
MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'smart_warehouse_search'
COLLECTION_NAME = 'products'

class SearchService:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Đảm bảo index full text search đã được tạo
    # (Chạy lệnh này 1 lần trong MongoDB Compass hoặc Shell: db.products.createIndex({search_text: "text"}))

    @staticmethod
    def remove_vietnamese_tones(text):
        """
        Chuyển đổi tiếng Việt có dấu sang không dấu để so sánh chính xác hơn
        """
        if not text: return ""
        text = text.lower()
        text = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', text)
        text = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', text)
        text = re.sub(r'[oòóọỏõôồốộổỗơờớợởỡ]', 'o', text)
        text = re.sub(r'[uùúụủũưừứựửữ]', 'u', text)
        text = re.sub(r'[iìíịỉĩ]', 'i', text)
        text = re.sub(r'[yỳýỵỷỹ]', 'y', text)
        text = re.sub(r'[đ]', 'd', text)
        # Xóa ký tự đặc biệt
        text = re.sub(r'[^\w\s]', ' ', text)
        return text.strip()

    @staticmethod
    def match_product(ocr_text):
        if not ocr_text or len(ocr_text.strip()) < 2: 
            return None
            
        # 1. TÌM ỨNG VIÊN (CANDIDATES)
        candidates_cursor = SearchService.collection.find(
            {"$text": {"$search": ocr_text}}, 
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(20)
        
        candidates = list(candidates_cursor)
        
        # Fallback tìm kiếm mù (Regex) nếu Full-text search thất bại
        if not candidates:
            longest_word = max(ocr_text.split(), key=len, default="")
            if len(longest_word) > 3:
                candidates = list(SearchService.collection.find(
                    {"search_text": {"$regex": longest_word, "$options": "i"}}
                ).limit(10))

        if not candidates:
            return {"status": "NEW", "confidence": 0.0, "match": None}

        # 2. SO KHỚP KÉP (DUAL MATCHING STRATEGY)
        ocr_clean = SearchService.remove_vietnamese_tones(ocr_text)
        choices = {}
        for c in candidates:
            db_name_clean = c.get('name_no_tone', SearchService.remove_vietnamese_tones(c['name']))
            choices[str(c['_id'])] = db_name_clean

        # Bước 2a: Tìm thằng giống nhất bằng WRatio (Chấp nhận viết tắt, sai trật tự)
        best_match = process.extractOne(ocr_clean, choices, scorer=fuzz.WRatio)
        
        if not best_match:
             return {"status": "NEW", "confidence": 0.0, "match": None}

        match_name_clean, score_wratio, match_key = best_match
        found_product = next((c for c in candidates if str(c['_id']) == match_key), None)

        # Bước 2b: KIỂM TRA NGHIÊM NGẶT (Strict Check)
        # Tính thêm điểm token_sort_ratio (So sánh toàn bộ từ, không chấp nhận partial match quá đà)
        # Ví dụ: "gia vị sốt vang" vs "bột chiên gia vị"
        # -> WRatio = 90 (do có "gia vị")
        # -> Token_sort = 40 (do "sốt vang" khác hẳn "bột chiên")
        score_strict = fuzz.token_sort_ratio(ocr_clean, match_name_clean)

        # Logic Quyết Định (Decision Matrix)
        status = "NEW"
        final_score = score_wratio

        # Case 1: Khớp hoàn hảo (Cả 2 điểm đều cao)
        if score_wratio >= 90 and score_strict >= 80:
            status = "AUTO"
        
        # Case 2: Khớp một phần nhưng logic từ vựng vẫn ổn
        elif score_wratio >= 85 and score_strict >= 60:
            status = "SUGGESTION"
            
        # Case 3: Điểm WRatio cao ảo (partial match) nhưng Strict thấp
        # (Đây chính là case "gia vị sốt vang" vs "bột gia vị")
        elif score_wratio >= 90 and score_strict < 50:
            # Từ chối hiểu -> Coi như SP mới
            status = "NEW" 
            final_score = score_strict # Hạ điểm xuống để UI không hiển thị lung tung

        # Case 4: Vớt vát
        elif score_strict >= 70:
            status = "SUGGESTION"

        if status == "NEW":
             return {"status": "NEW", "confidence": final_score/100.0, "match": None}

        # [Hình phạt độ dài - Logic cũ vẫn giữ để an toàn]
        len_ocr = len(ocr_clean)
        len_db = len(match_name_clean)
        diff_ratio = abs(len_ocr - len_db) / max(len_ocr, len_db)
        
        if status == "AUTO" and diff_ratio > 0.3:
            status = "SUGGESTION"

        return {
            "status": status,
            "confidence": final_score / 100.0,
            "match": {
                "id": found_product['mysql_id'],
                "name": found_product['name'],
                "sku": found_product['sku']
            }
        }

    @staticmethod
    def add_product(product_obj):
        """Đồng bộ sản phẩm mới sang MongoDB"""
        try:
            doc = {
                "mysql_id": product_obj.id,
                "name": product_obj.name,
                "name_no_tone": SearchService.remove_vietnamese_tones(product_obj.name),
                "sku": product_obj.sku,
                # Tạo trường search_text chứa mọi thứ có thể tìm kiếm
                "search_text": f"{product_obj.name} {SearchService.remove_vietnamese_tones(product_obj.name)} {product_obj.sku}" 
            }
            SearchService.collection.insert_one(doc)
            print(f" Synced to Mongo: {product_obj.name}")
        except Exception as e:
            print(f" Mongo Sync Error: {e}")

    @staticmethod
    def update_product_in_mongo(product_obj):
        """Cập nhật sản phẩm trong MongoDB"""
        try:
            SearchService.collection.update_one(
                {"mysql_id": product_obj.id},
                {"$set": {
                    "name": product_obj.name,
                    "name_no_tone": SearchService.remove_vietnamese_tones(product_obj.name),
                    "sku": product_obj.sku,
                    "search_text": f"{product_obj.name} {SearchService.remove_vietnamese_tones(product_obj.name)} {product_obj.sku}"
                }},
                upsert=True
            )
            print(f" Updated Mongo: {product_obj.name}")
        except Exception as e:
            print(f" Mongo Update Error: {e}")