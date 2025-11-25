# app/api/warehouse_routes.py
from flask import Blueprint, request, jsonify
from app.services.warehouse_service import WarehouseService

warehouse_bp = Blueprint('warehouse', __name__)

@warehouse_bp.route('/products', methods=['GET'])
def get_products():
    try:
        data = WarehouseService.get_all_products()
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@warehouse_bp.route('/import-slips', methods=['POST'])
def create_import_slip():
    try:
        # Gọi Service, không cần quan tâm logic DB ở đây
        new_slip = WarehouseService.create_import_slip(request.get_json())
        return jsonify({
            "success": True, 
            "message": "Phiếu nhập kho đã được lưu", 
            "slip_id": new_slip.id
        }), 201
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Lỗi server nội bộ"}), 500

@warehouse_bp.route('/export-slips', methods=['POST'])
def create_export_slip():
    try:
        new_slip = WarehouseService.create_export_slip(request.get_json())
        return jsonify({
            "success": True, 
            "message": "Xuất kho thành công", 
            "slip_id": new_slip.id
        }), 201
    except ValueError as ve:
        # Lỗi do validation (thiếu hàng, sai dữ liệu) -> Trả về 400
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500