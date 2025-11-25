# app/utils.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def manager_required():
    """
    Decorator: Chỉ cho phép Manager truy cập.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            # Kiểm tra role trong token
            if claims.get("role") == 'manager':
                return fn(*args, **kwargs)
            else:
                return jsonify({"error": "Quyền hạn không đủ. Chỉ dành cho Quản lý."}), 403
        return decorator
    return wrapper