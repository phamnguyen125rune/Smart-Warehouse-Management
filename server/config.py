import os
from dotenv import load_dotenv
from datetime import timedelta  # <--- [QUAN TRỌNG] Thêm dòng này

load_dotenv()

# Lấy đường dẫn thư mục gốc của dự án
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Khóa bí mật
    SECRET_KEY = 'a-very-secret-key-that-no-one-can-guess'
    
    # Cấu hình JWT
    JWT_SECRET_KEY = SECRET_KEY

    # Thay đổi thời gian của Access Token
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=10) 

    # Cấu hình Refresh Token
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    # ----------------------

    # Cấu hình CSDL
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///dev.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cấu hình thư mục Upload
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')

    # Cấu hình Google OAuth
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')