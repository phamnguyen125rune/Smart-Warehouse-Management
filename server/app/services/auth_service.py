import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from werkzeug.utils import secure_filename
from flask import current_app
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import User

class AuthService:
    @staticmethod
    def login_manual(employee_id, password):
        """Đăng nhập bằng ID/Pass"""
        user = User.query.filter_by(employee_id=employee_id, is_active=True).first()
        if user and user.check_password(password):
            claims = {
                "role": user.role.name,
                "login_type": "primary",
                "full_name": user.full_name,
                "email": user.email,
                "avatar_url": user.avatar_url
            }
            return create_access_token(identity=user.id, additional_claims=claims)
        return None

    @staticmethod
    def login_google(auth_code):
        """Xử lý toàn bộ luồng Google OAuth"""
        # 1. Lấy config
        CLIENT_ID = current_app.config.get('GOOGLE_CLIENT_ID')
        CLIENT_SECRET = current_app.config.get('GOOGLE_CLIENT_SECRET')
        REDIRECT_URI = 'http://localhost:5173' # Cấu hình cứng hoặc lấy từ env

        # 2. Đổi code lấy token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            'code': auth_code,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'redirect_uri': REDIRECT_URI,
            'grant_type': 'authorization_code'
        }
        res = requests.post(token_url, data=token_data)
        res.raise_for_status()
        token_json = res.json()
        
        # 3. Verify ID Token
        id_token_jwt = token_json.get('id_token')
        id_info = id_token.verify_oauth2_token(
            id_token_jwt, google_requests.Request(), CLIENT_ID
        )
        email = id_info.get('email')

        # 4. Kiểm tra User trong DB
        user = User.query.filter_by(google_auth_email=email).first()
        if not user:
            raise ValueError(f"Email {email} chưa được liên kết với nhân viên nào.")

        # 5. Tạo Token hệ thống
        claims = {
            "role": user.role.name,
            "login_type": "secondary",
            "full_name": user.full_name,
            "avatar_url": user.avatar_url
        }
        return create_access_token(identity=user.id, additional_claims=claims)

    @staticmethod
    def update_profile(user_id, data, login_type):
        """Cập nhật thông tin cá nhân"""
        if login_type != 'primary':
            raise PermissionError("Phải đăng nhập bằng mật khẩu để sửa thông tin.")

        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("Người dùng không tồn tại")

        # Update các trường cho phép
        allowed_fields = [
            'email', 
            'phone_number', 
            'bio', 
            'country', 
            'city_state', 
            'postal_code', 
            'tax_id', 
            'facebook_url', 
            'x_url', 
            'linkedin_url', 
            'instagram_url',
            'google_auth_email' 
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.session.commit()
        return user

    @staticmethod
    def update_avatar(user_id, file_obj):
        """Upload và lưu ảnh đại diện"""
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("Người dùng không tồn tại")

        filename = secure_filename(f"user_{user_id}_{file_obj.filename}")
        avatar_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars')
        os.makedirs(avatar_folder, exist_ok=True)
        filepath = os.path.join(avatar_folder, filename)

        # Xóa ảnh cũ
        if user.avatar_url:
            old_path = user.avatar_url.replace('/uploads/', '')
            full_old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], old_path)
            if os.path.exists(full_old_path):
                os.remove(full_old_path)

        # Lưu ảnh mới
        file_obj.save(filepath)
        
        # Update DB
        relative_url = f"/uploads/avatars/{filename}"
        user.avatar_url = relative_url
        db.session.commit()
        
        return relative_url