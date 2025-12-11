# server/app/utils/text_utils.py
import re
import unicodedata

def remove_vietnamese_tones(text):
    """
    Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu (Chuẩn Unicode).
    """
    if not text: return ""
    
    # 1. Chuyển về chữ thường
    text = text.lower()
    
    # 2. Chuẩn hóa Unicode (Dựng sẵn -> Tổ hợp) để tách dấu ra khỏi chữ
    text = unicodedata.normalize('NFD', text)
    
    # 3. Lọc bỏ các ký tự dấu (non-spacing mark)
    text = re.sub(r'[\u0300-\u036f]', '', text)
    
    # 4. Thay thế chữ Đ/đ đặc biệt (vì NFD không tách được chữ đ)
    text = text.replace('đ', 'd')
    
    # 5. Xóa các ký tự đặc biệt dư thừa, chỉ giữ lại chữ và số
    # (Tùy chọn: nếu muốn giữ dấu cách thì để \s)
    text = re.sub(r'[^a-z0-9\s]', '', text)
    
    return text.strip()