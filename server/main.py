# main.py
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
    with app.app_context():
        db.create_all()
        print("Database tables ensured.")
    seed_data()

# Hàm gửi thông báo khởi động
def send_startup_notification():
    with app.app_context():
        
        NotificationService.broadcast_system_alert(
            title="Server",
            message="Hệ thống đã hoàn tất bảo trì và hoạt động trở lại. Chúc các bạn làm việc hiệu quả!"
        )

if __name__ == '__main__':
    # Nhờ AI.
    # Chỉ chạy thông báo này nếu biến môi trường SEND_STARTUP_NOTIF = 'True'
    # Hoặc bạn có thể bỏ dòng if này để nó luôn chạy (nhưng sẽ spam khi dev)
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true': 
        # Hack nhẹ: WERKZEUG_RUN_MAIN chỉ 'true' ở process chính sau khi reload
        # Điều này giúp tránh gửi 2 lần.
        try:
            send_startup_notification()
        except Exception as e:
            print(f"Không thể gửi thông báo khởi động: {e}")
    app.run(debug=True, host='0.0.0.0', port=5000)
