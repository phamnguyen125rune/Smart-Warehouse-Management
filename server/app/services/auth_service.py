import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from werkzeug.utils import secure_filename
from flask import current_app
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

from app.extensions import db
from app.models import User, AuditLog # [QUAN TRỌNG] Import AuditLog
from app.services.notification_service import NotificationService

class AuthService:
    @staticmethod
    def login_manual(employee_id, password):
        """Đăng nhập bằng ID/Pass
           Đầu tiên ta sẽ kiểm tra và gửi lại xác nhận và các thông tin như trong claims.
           "login_type": "primary" là khi client nhận, nó sẽ cho client biết rằng nó được phép hiển thị các trường Edit profile.
           """
        user = User.query.filter_by(employee_id=employee_id, is_active=True).first()
        if user and user.check_password(password):
            now_vn = datetime.utcnow() + timedelta(hours=7)
            time_str = now_vn.strftime('%H:%M %d/%m/%Y')

            NotificationService.send_to_user(
                user_id=user.id,
                title="Đăng nhập mới",
                # Sử dụng giờ Việt Nam trong nội dung tin nhắn
                message=f"Phát hiện đăng nhập vào lúc {time_str} (Giờ VN)",
                category_name=NotificationService.CAT_SECURITY
            )

            claims = {
                "role": user.role.name,
                "login_type": "primary",
                "full_name": user.full_name,
                "email": user.email,
                "avatar_url": user.avatar_url
            }
            return create_access_token(identity=str(user.id), additional_claims=claims)
        return None

    @staticmethod
    def login_google(auth_code):
        """Xử lý toàn bộ luồng Google OAuth
           Thay vì tạo như một tài khoảng mới, ta sẽ gán chúng với chính tài khoảng được thiết đặt.
           Và sẽ cho vào cùng một tài khoảng sau đó so sánh với email và user.
           Nếu có cho đăng nhập vào chính user đó, và sau đó thì ghi nhận type là secondary để cho biết cấp độ quyền của nó.
           Chỉ có primary mới được phép thực hiện một số quyền.
           """
        # 1. Lấy config
        CLIENT_ID = current_app.config.get('GOOGLE_CLIENT_ID')
        CLIENT_SECRET = current_app.config.get('GOOGLE_CLIENT_SECRET')
        REDIRECT_URI = 'http://localhost:5173' # Cấu hình cứng hoặc về sau chỉnh lại lấy từ env

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
        return create_access_token(identity=str(user.id), additional_claims=claims)

    @staticmethod
    def update_profile(user_id, data, login_type):
        """Cập nhật thông tin cá nhân và GHI LOG thay đổi"""
        if login_type != 'primary':
            raise PermissionError("Phải đăng nhập bằng mật khẩu để sửa thông tin.")

        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("Người dùng không tồn tại")

        allowed_fields = [
            'email', 'phone_number', 'bio', 'country', 'city_state', 
            'postal_code', 'tax_id', 'facebook_url', 'x_url', 
            'linkedin_url', 'instagram_url', 'google_auth_email'
        ]
        
        # So sánh và ghi nhận thay đổi
        changes = [] # Danh sách các thay đổi
        
        for field in allowed_fields:
            if field in data:
                old_value = getattr(user, field) # Lấy giá trị cũ hiện tại trong DB
                new_value = data[field]
                
                # Chuẩn hóa để so sánh (tránh trường hợp None vs '')
                str_old = str(old_value) if old_value is not None else ''
                str_new = str(new_value) if new_value is not None else ''

                # Nếu có sự khác biệt -> Ghi lại
                if str_old != str_new:
                    # Lưu dạng key - value, ví dụ "phone_number: 090123 -> 099999"
                    changes.append(f"{field}: '{str_old}' -> '{str_new}'")
                    setattr(user, field, new_value) # Cập nhật giá trị mới
        
        try:
            # Chỉ commit nếu thực sự có thay đổi
            if changes:
                # 1. Tạo bản ghi AuditLog
                change_details = "\n".join(changes)
                audit_log = AuditLog(
                    actor_id=user.id,          # Người thực hiện (chính chủ)
                    target_user_id=user.id,    # Đối tượng bị sửa
                    action="UPDATE_PROFILE",
                    details=change_details     # Chi tiết cũ -> mới
                )
                db.session.add(audit_log)

                # 2. Lưu User
                db.session.commit()
                
                # 3. Gửi thông báo kèm chi tiết thay đổi
                NotificationService.send_system_alert(
                    recipient_id=user.id,
                    title="Hồ sơ đã thay đổi",
                    # Gửi chi tiết về cho user thấy (hoặc gửi cho Admin nếu muốn giám sát chặt)
                    message=f"Hệ thống ghi nhận thay đổi thông tin:\n{change_details}"
                )
                
                # Thông cho Quản lý khi nhân viên đổi số điện thoại, demo cho riêng trường SDT, còn nếu muốn sửa thì ở đây.
                if any("phone_number" in c for c in changes):
                     NotificationService.broadcast_to_role(
                        role_name="manager",
                        title="Thông báo nhân sự",
                        message=f"Nhân viên {user.full_name} ({user.employee_id}) vừa thay đổi số điện thoại.\nChi tiết: {change_details}",
                        category_name="Nhân sự"
                    )

            return user
        except Exception as e:
            db.session.rollback()
            # Xử lý lỗi unique constraint nếu người dùng nhập trùng email/sdt
            if "UNIQUE constraint" in str(e) or "Duplicate entry" in str(e):
                 raise ValueError("Thông tin (Email/SĐT) đã được sử dụng bởi người khác.")
            raise e

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
