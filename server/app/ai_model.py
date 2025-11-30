import random
import time

def process_ocr(image_path: str) -> str:
    """
    Hàm mô phỏng việc xử lý OCR từ một file ảnh.
    Trong thực tế, đây là nơi bạn sẽ gọi mô hình AI thật.
    
    Args:
        image_path (str): Đường dẫn tới file ảnh cần xử lý.

    Returns:
        str: Một chuỗi văn bản thô chứa kết quả OCR theo định dạng yêu cầu.
    """
    print(f"--- Bắt đầu xử lý OCR cho ảnh: {image_path} ---")
    
    # Giả lập thời gian xử lý của mô hình AI
    time.sleep(2) 

    # --- Dữ liệu giả lập ---
    # Danh sách các sản phẩm mẫu để tạo dữ liệu ngẫu nhiên
    sample_products = [
        "Banh Gao One Five",
        "Banh Gao One Three",
        "Banh Gao One Four",
        "Banh Gao One One",
        "Dau An Truong An 1L",
        "Nuoc Mam Nam Ngu 500ml"
    ]
    
    # Dòng tiêu đề theo định dạng bạn yêu cầu
    header = "ITEMNAMEVALUE QUANTITYVALUE AMOUNTVALUE UNITPRICEVALUE\n"
    
    # Tạo ra một vài dòng dữ liệu sản phẩm ngẫu nhiên (từ 2 đến 5 sản phẩm)
    lines = []
    for _ in range(random.randint(2, 5)):
        item_name = random.choice(sample_products)
        quantity = random.randint(1, 10)
        unit_price = random.randint(10, 100) * 1000 # Giá từ 10,000 đến 100,000
        amount = quantity * unit_price
        
        # Thêm một dòng dữ liệu theo định dạng "Tên Số_lượng Tổng_tiền Đơn_giá"
        lines.append(f"{item_name} {quantity} {amount} {unit_price}")

    # Kết hợp tiêu đề và các dòng dữ liệu, mỗi dòng cách nhau bởi ký tự xuống dòng
    final_output_string = header + "\n".join(lines)
    
    print("--- Xử lý OCR hoàn tất. Kết quả trả về: ---")
    print(final_output_string)
    print("---------------------------------------------")
    
    return final_output_string