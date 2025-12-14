from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.auth_service import AuthService
from app.models import User
from app.extensions import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    token = AuthService.login_manual(data.get('employee_id'), data.get('password'))
    
    if token:
        return jsonify(access_token=token), 200
    return jsonify({"error": "Sai thông tin đăng nhập"}), 401

@auth_bp.route('/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    code = data.get('code')
    if not code:
        return jsonify({"error": "Thiếu code xác thực"}), 400
        
    try:
        # Gọi Service để xử lý logic phức tạp với Google
        token = AuthService.login_google(code)
        return jsonify(access_token=token), 200
    except ValueError as e:
        # Lỗi do không tìm thấy email trong DB hoặc token google sai
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        print(f"Google Login Error: {e}") # Log ra terminal để debug
        return jsonify({"error": "Lỗi xác thực Google phía server"}), 500
        
@auth_bp.route('/profile/me', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Lấy thông tin chi tiết của người dùng hiện tại.
    """
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, current_user_id)

    if not user:
        return jsonify({"error": "Không tìm thấy người dùng"}), 404
        
    return jsonify(user.to_dict()), 200
    
@auth_bp.route('/profile/me', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        AuthService.update_profile(user_id, request.get_json(), claims.get('login_type'))
        return jsonify({"message": "Cập nhật thành công"}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/profile/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    if 'avatar' not in request.files:
        return jsonify({"error": "Chưa chọn file"}), 400
        
    try:
        url = AuthService.update_avatar(int(get_jwt_identity()), request.files['avatar'])
        return jsonify({"message": "OK", "avatar_url": url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """User tự đổi mật khẩu của mình"""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({"error": "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới"}), 400

    # Kiểm tra mật khẩu cũ có đúng không
    if not user.check_password(current_password):
        return jsonify({"error": "Mật khẩu hiện tại không đúng"}), 401

    # Đổi pass
    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Đổi mật khẩu thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
