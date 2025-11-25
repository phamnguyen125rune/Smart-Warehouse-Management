from flask import Blueprint, request, jsonify
from app.utils import manager_required
from app.services.admin_service import AdminService

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@manager_required()
def get_users():
    users = AdminService.get_all_users()
    return jsonify([{
        "id": u.id,
        "employee_id": u.employee_id,
        "full_name": u.full_name,
        "role": u.role.name
    } for u in users])

@admin_bp.route('/users/register', methods=['POST'])
@manager_required()
def create_user():
    try:
        AdminService.create_user(request.get_json())
        return jsonify({"message": "Tạo user thành công"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
@manager_required()
def reset_pass(user_id):
    data = request.get_json()
    if not data.get('new_password'):
        return jsonify({"error": "Thiếu password mới"}), 400
        
    try:
        AdminService.reset_password(user_id, data['new_password'])
        return jsonify({"message": "Đổi password thành công"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/roles', methods=['GET'])
@manager_required()
def get_roles():
    try:
        roles = AdminService.get_all_roles()
        return jsonify(roles), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500