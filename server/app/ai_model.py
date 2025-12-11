# app/ai_model.py
import sys
import os
from app.my_ocr_core import InvoiceRecognizer 

# Singleton Instance
_real_ai_model = None

def load_model():
    global _real_ai_model
    if _real_ai_model is None:
        try:
            current_file_path = os.path.abspath(__file__)
            
            app_dir = os.path.dirname(current_file_path)
            
            server_dir = os.path.dirname(app_dir)
            
            print(f" [Path Fix] Đang tìm model tại gốc: {server_dir}")
            
            _real_ai_model = InvoiceRecognizer(model_dir=server_dir)
            
        except Exception as e:
            print(f" [CRITICAL] Không thể load AI Model: {e}")

def process_ocr(image_path: str) -> str:
    """
    Hàm Adapter: Gọi InvoiceRecognizer -> Trả về chuỗi raw text
    """
    global _real_ai_model
    if _real_ai_model is None:
        load_model()
    
    if _real_ai_model is None:
        return "ERROR: AI Model chưa được khởi tạo."

    try:
        print(f" [AI] Bắt đầu xử lý ảnh: {image_path}")
        
        # Gọi hàm predict của Core -> Trả về List[str]
        # Ví dụ: ["Banh ngot 2 50000 100000", "Keo 1 5000 5000"]
        output_lines = _real_ai_model.predict(image_path)
        
        # Thêm header giả để khớp với logic parser cũ (ItemName Quantity Amount Price)
        # Lưu ý: Class InvoiceRecognizer đã format đúng thứ tự này ở cuối hàm predict
        header = "ITEMNAME QUANTITY AMOUNT UNITPRICE"
        
        final_result = [header] + output_lines
        return "\n".join(final_result)

    except Exception as e:
        print(f" Lỗi khi chạy AI: {e}")
        return ""