import click
import os
from app import create_app
from app.seed import seed_data
from app.extensions import db
from app.services.notification_service import NotificationService

app = create_app()

@app.cli.command('seed')
def seed_command():
    """Tạo dữ liệu ban đầu cho CSDL."""
    # [QUAN TRỌNG] Phải bọc toàn bộ logic DB trong app_context
    with app.app_context():
        print("Đang kiểm tra và tạo bảng (db.create_all)...")
        db.create_all()
        print("Database tables ensured.")
        
        # Gọi hàm seed_data NGAY TRONG khối này
        try:
            seed_data()
            print("✔ Seed dữ liệu thành công!")
        except Exception as e:
            print(f"❌ Lỗi khi seed dữ liệu: {e}")

# Hàm gửi thông báo khởi động
def send_startup_notification():
    with app.app_context():
        try:
            NotificationService.broadcast_system_alert(
                title="Server",
                message="Hệ thống đã hoàn tất bảo trì và hoạt động trở lại. Chúc các bạn làm việc hiệu quả!"
            )
            print("✔ Đã gửi thông báo khởi động server.")
        except Exception as e:
            print(f"⚠ Không thể gửi thông báo khởi động: {e}")

if __name__ == '__main__':
    # Logic gửi thông báo khi server reload (chỉ chạy ở process con của debugger)
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true': 
        send_startup_notification()
    
    # Chạy server
    app.run(debug=True, host='0.0.0.0', port=5000)