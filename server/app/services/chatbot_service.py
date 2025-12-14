# server/app/services/chatbot_service.py
import requests
import json
import time
import os
from sqlalchemy import text
from app.extensions import db

# --- CẤU HÌNH ---
# Dán Key mới của bạn vào đây
GOOGLE_API_KEY = "AIzaSyDg-b2hCTdH7ppvPMJRCl6cTXAO33Pb8g4"

class ChatbotService:
    # 1. Thông tin tĩnh (AI sẽ dùng cái này để trả lời các câu hỏi chung) 
    @staticmethod
    def get_warehouse_info():
        try:
            # Đường dẫn đến file knowledge.txt (nằm cùng cấp với thư mục app hoặc trong app)
            # Giả sử file nằm tại server/app/knowledge.txt
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Lấy đường dẫn server/app
            file_path = os.path.join(base_dir, 'knowledge.txt')
            
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f" [Warning] Không đọc được file knowledge.txt: {e}")
            # Nội dung dự phòng nếu lỡ xóa mất file
            return "Hệ thống quản lý kho thông minh SWM."

    # 2. Cấu trúc dữ liệu (AI sẽ dùng cái này để viết SQL)
    DB_SCHEMA = """
    1. Bảng 'product' (Sản phẩm): id, name (tên), sku (mã), quantity_in_stock (tồn kho), standard_price (giá bán).
    2. Bảng 'import_slip' (Phiếu nhập): id, code, created_at, total_amount.
    3. Bảng 'import_slip_detail': quantity, import_price, product_id, import_slip_id.
    4. Bảng 'export_slip' (Phiếu xuất): id, code, reason, created_at.
    5. Bảng 'export_slip_detail': quantity, export_price, product_id, export_slip_id.
    """

    # DANH SÁCH MODEL DỰ PHÒNG (Ưu tiên từ trên xuống dưới)
    # 1. Bản chuẩn ổn định nhất
    # 2. Bản Lite 2.0 nhanh nhẹ
    # 3. Bản Pro cũ (Backup cuối cùng)
    AVAILABLE_MODELS = [
        "gemini-2.5-flash-preview-09-2025",          # Ưu tiên 1: Bản Flash 2.0 chuẩn (Thường ít lỗi hơn Lite)
        "gemini-2.5-flash-lite",       # Ưu tiên 2: Bản Flash mới nhất (Alias)
        "gemini-2.0-flash-lite-preview-02-05" # Ưu tiên 3: Bản Lite (Dự phòng)
    ]

    @staticmethod
    def _call_gemini_api(prompt_text):
        if not GOOGLE_API_KEY or "DÁN_KEY" in GOOGLE_API_KEY: return None
        
        payload = { "contents": [{ "parts": [{"text": prompt_text}] }] }
        
        # --- CƠ CHẾ THÔNG MINH: Thử từng Model trong danh sách ---
        for model_name in ChatbotService.AVAILABLE_MODELS:
            # Lưu ý: Một số model cần v1, một số cần v1beta. Ta dùng v1beta cho bao quát.
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GOOGLE_API_KEY}"
            
            print(f" [AI] Đang thử model: {model_name}...")
            
            # Mỗi model thử tối đa 2 lần nếu bị Busy
            for attempt in range(2):
                try:
                    response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=15)
                    
                    # 1. Thành công -> Trả về ngay
                    if response.status_code == 200:
                        return response.json()['candidates'][0]['content']['parts'][0]['text']
                    
                    # 2. Lỗi 404 (Không tìm thấy model) -> Bỏ qua, thử model tiếp theo trong list
                    if response.status_code == 404:
                        print(f" [Skip] Model {model_name} không khả dụng (404).")
                        break # Break vòng lặp attempt để chuyển sang model khác
                    
                    # 3. Lỗi 429/503 (Quá tải) -> Chờ xíu rồi thử lại lần nữa
                    if response.status_code in [429, 503]:
                        print(f" [Busy] Model {model_name} đang bận. Đang thử lại...")
                        time.sleep(2)
                        continue # Thử lại lần 2
                        
                    # 4. Các lỗi khác -> In ra và thử model tiếp theo
                    print(f" [Error] {model_name} lỗi code {response.status_code}")
                    break
                    
                except Exception as e:
                    print(f" [Network] Lỗi kết nối đến {model_name}: {e}")
                    time.sleep(1)
        
        return "Xin lỗi, hiện tại tất cả các kênh AI của Google đều đang quá tải. Vui lòng thử lại sau 5 phút."

    @staticmethod
    def ask_inventory(user_question):
        try:
            warehouse_info = ChatbotService.get_warehouse_info()
            prompt = f"""
            Info: {warehouse_info}
            Schema: {ChatbotService.DB_SCHEMA}
            User Question: "{user_question}"
            
            Task:
            - If asking for data/stats -> Write ONLY SQL SELECT (MySQL).
            - If general chat -> Write response text in Vietnamese.
            - No markdown, no explanation.
            """
            
            ai_response = ChatbotService._call_gemini_api(prompt)
            if not ai_response or "Xin lỗi" in ai_response: return ai_response or "Lỗi kết nối."

            ai_response = ai_response.replace("```sql", "").replace("```", "").strip()
            
            if not ai_response.upper().startswith("SELECT"):
                return ai_response

            if any(k in ai_response.upper() for k in ["DELETE", "UPDATE", "INSERT", "DROP"]):
                return "Chỉ được phép tra cứu."

            result = db.session.execute(text(ai_response))
            rows = [dict(zip(result.keys(), row)) for row in result.fetchall()]
            
            if not rows: return "Không tìm thấy dữ liệu."
            
            data_str = json.dumps(rows, default=str, ensure_ascii=False)
            
            final_prompt = f"Question: {user_question}. Data: {data_str}. Answer in Vietnamese."
            return ChatbotService._call_gemini_api(final_prompt)

        except Exception as e:
            print(f" [System Error] {e}")
            return "Lỗi hệ thống."