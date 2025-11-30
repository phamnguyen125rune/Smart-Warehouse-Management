from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notification_service import NotificationService
from app.models import Notification

notification_bp = Blueprint('notification', __name__)

# 1. Lấy danh sách thông báo
@notification_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    
    # Lấy tham số từ URL (Query Params)
    page = request.args.get('page', 1, type=int)
    filter_type = request.args.get('type', 'ALL', type=str)
    per_page = 10 # Cố định 10 tin mỗi trang

    # Gọi service phân trang
    result = NotificationService.get_my_notifications_paginated(user_id, page, per_page, filter_type)
    
    # Đếm số chưa đọc (Vẫn đếm trên TẤT CẢ, không phụ thuộc trang hiện tại)
    unread_count = Notification.query.filter_by(recipient_id=user_id, is_read=False).count()
    
    return jsonify({
        "data": [n.to_dict() for n in result['items']],
        "meta": {
            "total": result['total'],
            "pages": result['pages'],
            "current_page": result['current_page'],
            "has_next": result['current_page'] < result['pages'],
            "has_prev": result['current_page'] > 1
        },
        "unread_count": unread_count
    }), 200

# 2. Gửi tin nhắn mới (Internal Mail)
@notification_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    sender_id = get_jwt_identity()
    data = request.get_json()
    
    recipient_id = data.get('recipient_id')
    title = data.get('title')
    message = data.get('message')
    is_pinned = data.get('is_pinned', False)

    if not all([recipient_id, title, message]):
        return jsonify({"error": "Thiếu thông tin bắt buộc"}), 400
        
    try:
        NotificationService.send_message(sender_id, recipient_id, title, message, is_pinned)
        return jsonify({"message": "Đã gửi tin nhắn thành công"}), 201
    except ValueError as ve:
        # [FIX] Trả về lỗi logic (ví dụ: gửi cho chính mình)
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Lỗi server: {e}")
        return jsonify({"error": "Lỗi server nội bộ"}), 500
        
# 3. Đánh dấu 1 thông báo đã đọc
@notification_bp.route('/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def read_notification(notif_id):
    """Đánh dấu 1 thông báo đã đọc"""
    user_id = get_jwt_identity()
    success = NotificationService.mark_as_read(notif_id, user_id)
    if success:
        return jsonify({"message": "Đã đọc"}), 200
    return jsonify({"error": "Không tìm thấy thông báo hoặc không có quyền"}), 404

# 4. Đánh dấu tất cả đã đọc
@notification_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def read_all_notifications():
    """Đánh dấu tất cả là đã đọc"""
    user_id = get_jwt_identity()
    NotificationService.mark_all_as_read(user_id)
    return jsonify({"message": "Đã đọc tất cả"}), 200
    
# Đánh dấu tin nhắn hoặc bỏ đánh dấu
@notification_bp.route('/<int:notif_id>/pin', methods=['PUT'])
@jwt_required()
def toggle_pin_notification(notif_id):
    user_id = get_jwt_identity()
    try:
        new_status = NotificationService.toggle_pin(notif_id, user_id)
        msg = "Đã ghim tin nhắn" if new_status else "Đã bỏ ghim"
        return jsonify({"message": msg, "is_pinned": new_status}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 404