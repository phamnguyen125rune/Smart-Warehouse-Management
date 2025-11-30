from app.extensions import db
from app.models import User, Role

class AdminService:
    @staticmethod
    def get_all_users():
        return User.query.filter_by(is_active=True).all()

    @staticmethod
    def create_user(data):
        employee_id = data.get('employee_id')
        
        if User.query.filter_by(employee_id=employee_id).first():
            raise ValueError("Mã nhân viên đã tồn tại")

        role_name = data.get('role', 'employee')
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            raise ValueError(f"Quyền '{role_name}' không hợp lệ")

        new_user = User(
            employee_id=employee_id,
            full_name=data.get('full_name'),
            role_id=role.id
        )
        new_user.set_password(data.get('password'))
        
        db.session.add(new_user)
        db.session.commit()
        return new_user

    @staticmethod
    def reset_password(user_id, new_pass):
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("User không tồn tại")
        if user.check_password(new_pass):
            raise ValueError("Mật khẩu mới không được trùng với mật khẩu cũ")
        # Gửi thông báo cho nhân viên biết
        NotificationService.send_system_alert(
            recipient_id=user.id,
            title="Mật khẩu đã được thay đổi",
            message="Quản trị viên vừa thực hiện thay đổi mật khẩu cho tài khoản này."
        )
        user.set_password(new_pass)
        db.session.commit()

    @staticmethod
    def deactivate_user(user_id):
        user = db.session.get(User, user_id)
        if user:
            user.is_active = False
            db.session.commit()

    @staticmethod
    def get_all_roles():
        """Lấy danh sách tất cả các quyền"""
        roles = Role.query.all()
        return [{"id": r.id, "name": r.name} for r in roles]