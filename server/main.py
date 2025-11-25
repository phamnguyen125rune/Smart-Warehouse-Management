# main.py
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Có thể lấy config PORT từ env nếu cần
    app.run(debug=True, host='0.0.0.0', port=5000)