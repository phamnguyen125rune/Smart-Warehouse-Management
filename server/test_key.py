# server/test_key.py
import requests
import os

# Key mới của bạn
KEY = "AIzaSyCzysGzCUnt4OrLyrARY8xx734pEnsZbmM"

def check_models():
    # Gọi API để liệt kê tất cả model mà Key này được phép dùng
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={KEY}"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        print("✅ KẾT NỐI THÀNH CÔNG! Danh sách model khả dụng:")
        data = response.json()
        for model in data.get('models', []):
            # Chỉ in ra các model tạo nội dung (generateContent)
            if "generateContent" in model['supportedGenerationMethods']:
                print(f" - {model['name']}")
    else:
        print(f"❌ LỖI KẾT NỐI: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    check_models()