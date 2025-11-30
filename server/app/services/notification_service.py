# app/services/notification_service.py
from app.extensions import db
from app.models import Notification, NotificationCategory, User

class NotificationService:
    
    # Định nghĩa các loại Category cố định để dùng cho chuẩn
    CAT_SECURITY = "Bảo mật"   # Đăng nhập, đổi pass
    CAT_WAREHOUSE = "Kho hàng" # Nhập/Xuất kho
    CAT_SYSTEM = "Hệ thống"    # Thông báo chung

    @staticmethod
    def _get_or_create_category(name, icon="bell"):
        """Hàm nội bộ: Tìm category, nếu chưa có thì tạo mới"""
        category = NotificationCategory.query.filter_by(name=name).first()
        if not category:
            category = NotificationCategory(name=name, icon=icon)
            db.session.add(category)
            db.session.flush() # Flush để lấy ID ngay lập tức
        return category

    @staticmethod
    def send_to_user(user_id, title, message, category_name=CAT_SYSTEM, link_to=None):
        """Gửi thông báo cho 1 người cụ thể"""
        try:
            # 1. Xử lý category
            icon_map = {
                NotificationService.CAT_SECURITY: "shield-check",
                NotificationService.CAT_WAREHOUSE: "box",
                NotificationService.CAT_SYSTEM: "bell"
            }
            category = NotificationService._get_or_create_category(
                category_name, icon_map.get(category_name, "bell")
            )

            # 2. Tạo thông báo
            notif = Notification(
                recipient_id=user_id,
                category_id=category.id,
                title=title,
                message=message,
                link_to=link_to
            )
            
            db.session.add(notif)
            db.session.commit()
            return notif
        except Exception as e:
            db.session.rollback()
            print(f"Lỗi gửi thông báo: {str(e)}")
            return None

    @staticmethod
    def broadcast_to_role(role_name, title, message, category_name=CAT_SYSTEM, link_to=None):
        """Gửi thông báo cho TẤT CẢ nhân viên có quyền cụ thể (Ví dụ: Gửi cho tất cả Manager)"""
        try:
            users = User.query.join(User.role).filter_by(name=role_name).all()
            
            # Lấy category 1 lần
            icon_map = {
                NotificationService.CAT_SECURITY: "shield-check",
                NotificationService.CAT_WAREHOUSE: "box",
                NotificationService.CAT_SYSTEM: "bell"
            }
            category = NotificationService._get_or_create_category(
                category_name, icon_map.get(category_name, "bell")
            )

            notifications = []
            for user in users:
                notif = Notification(
                    recipient_id=user.id,
                    category_id=category.id,
                    title=title,
                    message=message,
                    link_to=link_to
                )
                db.session.add(notif)
                notifications.append(notif)
            
            db.session.commit()
            return notifications
        except Exception as e:
            db.session.rollback()
            print(f"Lỗi broadcast thông báo: {str(e)}")
            return []

    @staticmethod
    def get_my_notifications(user_id, limit=20):
        """Lấy danh sách thông báo của user"""
        return Notification.query.filter_by(recipient_id=user_id)\
            .order_by(Notification.created_at.desc())\
            .limit(limit).all()

    @staticmethod
    def get_my_notifications_paginated(user_id, page=1, per_page=10, filter_type='ALL'):
        """
        Lấy danh sách thông báo có phân trang và lọc
        """
        if filter_type == 'SENT':
            # Lấy tin mình gửi đi
            query = Notification.query.filter_by(sender_id=user_id)
        else:
            # Lấy tin mình nhận được (Mặc định)
            query = Notification.query.filter_by(recipient_id=user_id)

            # Chỉ áp dụng các bộ lọc con khi ở Hộp thư đến
            if filter_type == 'PINNED':
                query = query.filter_by(is_pinned=True)
            elif filter_type != 'ALL':
                query = query.filter_by(msg_type=filter_type)
        
        # Sắp xếp: Mới nhất lên đầu
        # Với tab SENT thì không cần ưu tiên ghim (hoặc tùy bạn), ở đây mình để sort theo time hết cho đơn giản
        query = query.order_by(Notification.created_at.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            "items": pagination.items,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": pagination.page
        }

    @staticmethod
    def mark_as_read(notification_id, user_id):
        """Đánh dấu đã đọc"""
        notif = Notification.query.filter_by(id=notification_id, recipient_id=user_id).first()
        if notif:
            notif.is_read = True
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def mark_all_as_read(user_id):
        """Đánh dấu tất cả là đã đọc"""
        Notification.query.filter_by(recipient_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()

    @staticmethod
    def send_message(sender_id, recipient_id, title, message, category_name="Hộp thư", is_pinned=False):
        """
        Hàm dùng cho User gửi tin nhắn cho nhau (hoặc cho quản lý)
        """
        # [FIX] Logic 1: Không cho phép gửi cho chính mình
        if int(sender_id) == int(recipient_id):
            raise ValueError("Không thể tự gửi tin nhắn cho chính mình.")

        # [FIX] Logic 2: Kiểm tra người nhận có tồn tại không
        recipient = db.session.get(User, recipient_id)
        if not recipient:
            raise ValueError("Người nhận không tồn tại.")
        try:
            # 1. Xác định Category
            category = NotificationService._get_or_create_category(category_name, "mail")
            
            # 2. Xác định Msg Type dựa trên Role người gửi
            msg_type = 'NORMAL'
            if sender_id:
                sender = db.session.get(User, sender_id)
                if sender and sender.role.name == 'manager':
                    msg_type = 'MANAGER' # Màu vàng/xanh
            else:
                msg_type = 'SYSTEM' # Màu đỏ (Trường hợp này ít dùng ở hàm này)

            # 3. Tạo Message
            notif = Notification(
                sender_id=sender_id,
                recipient_id=recipient_id,
                category_id=category.id,
                title=title,
                message=message,
                msg_type=msg_type,
                is_pinned=is_pinned
            )
            
            db.session.add(notif)
            db.session.commit()
            return notif
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def send_system_alert(recipient_id, title, message):
        """Gửi cảnh báo hệ thống cho 1 người (Màu đỏ)"""
        category = NotificationService._get_or_create_category("Hệ thống", "alert")
        notif = Notification(
            sender_id=None, # Không có người gửi -> Hệ thống
            recipient_id=recipient_id,
            category_id=category.id,
            title=title,
            message=message,
            msg_type='SYSTEM' # Frontend sẽ hiển thị màu đỏ
        )
        db.session.add(notif)
        db.session.commit()

    @staticmethod
    def broadcast_system_alert(title, message):
        """Gửi thông báo hệ thống cho tất cả người dùng đang hoạt động"""
        try:
            # Lấy tất cả user đang hoạt động
            users = User.query.filter_by(is_active=True).all()
            category = NotificationService._get_or_create_category("Hệ thống", "broadcast")
            
            notifications = []
            for user in users:
                notif = Notification(
                    sender_id=None, # Hệ thống
                    recipient_id=user.id,
                    category_id=category.id,
                    title=title,
                    message=message,
                    msg_type='SYSTEM'
                )
                db.session.add(notif)
            
            db.session.commit()
            print(f"--- Đã gửi thông báo hệ thống cho {len(users)} người dùng ---")
        except Exception as e:
            db.session.rollback()
            print(f"Lỗi broadcast: {e}")

    @staticmethod
    def toggle_pin(notification_id, user_id):
        """Bật/Tắt ghim cho người nhận"""
        notif = Notification.query.filter_by(id=notification_id, recipient_id=user_id).first()
        if notif:
            notif.is_pinned = not notif.is_pinned # Đảo ngược trạng thái
            db.session.commit()
            return notif.is_pinned
        raise ValueError("Tin nhắn không tồn tại")
