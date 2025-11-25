# app/api/file_routes.py
from flask import Blueprint, send_from_directory, current_app
import os

file_bp = Blueprint('file', __name__)

@file_bp.route('/uploads/<path:filename>')
def serve_upload(filename):
    """
    Route này cho phép truy cập file trong thư mục uploads từ trình duyệt.
    Ví dụ: http://localhost:5000/uploads/avatars/user_1.jpg
    """
    # Lấy đường dẫn thư mục uploads từ config
    upload_folder = current_app.config.get('UPLOAD_FOLDER')
    
    # Nếu file nằm trong subfolder (ví dụ avatars/abc.jpg), send_from_directory tự xử lý được
    return send_from_directory(upload_folder, filename)