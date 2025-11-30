# app/utils.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def manager_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") == 'manager':
                return fn(*args, **kwargs)
            else:
                return jsonify({"error": "Chỉ quản lý mới có quyền truy cập"}), 403
        return decorator
    return wrapper