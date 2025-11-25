import os
import os
from dotenv import load_dotenv

# Lấy đường dẫn thư mục gốc của dự án
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Khóa bí mật
    SECRET_KEY = 'day-la-mot-chuoi-bi-mat-rat-an-toan-khong-ai-doan-duoc'
    
    # Cấu hình JWT cũng sẽ dùng SECRET_KEY này
    JWT_SECRET_KEY = SECRET_KEY

    # Cấu hình CSDL
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:phamtrungnguyen12c8@localhost/smart_warehouse'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Cấu hình thư mục Upload
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')

    # Cấu hình Google OAuth
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
