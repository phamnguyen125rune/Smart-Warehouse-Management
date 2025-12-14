# app/api/warehouse_routes.py
import os
from flask import Blueprint, request, jsonify, current_app 
from werkzeug.utils import secure_filename 
from app.services.warehouse_service import WarehouseService

warehouse_bp = Blueprint('warehouse', __name__)

@warehouse_bp.route('/products', methods=['GET'])
def get_products():
    try:
        data = WarehouseService.get_all_products()
        return jsonify({"success": True, "data": data}), 200

    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
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

@warehouse_bp.route('/ocr-upload', methods=['POST'])
def upload_and_process_invoice():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "Không có file nào được gửi"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "Tên file rỗng"}), 400

    if file:
        filename = secure_filename(file.filename)
        # Lưu tạm ảnh để AI xử lý (đường dẫn này sẽ truyền vào hàm process_ocr)
        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'temp_ocr', filename)
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        
        try:
            file.save(image_path)
            
            # Hàm này đã bao gồm cả AI + Parsing + Smart Search
            smart_items = WarehouseService.process_ocr_upload(image_path)
            
            # Xóa file tạm sau khi xử lý xong (tùy chọn)
            # os.remove(image_path) 

            return jsonify({"success": True, "data": smart_items}), 200
            
        except Exception as e:
            print(f"Lỗi OCR Server: {e}")
            return jsonify({"success": False, "error": f"Lỗi server: {str(e)}"}), 500

@warehouse_bp.route('/products', methods=['POST'])
def create_product(): 
    try:
        data = request.get_json() # Lấy data ở trong này
        
        # Gọi Service xử lý
        new_product = WarehouseService.create_product(data)
        
        return jsonify({
            "success": True, 
            "data": new_product,
            "message": "Tạo sản phẩm thành công"
        }), 201
        
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
        
    except Exception as e:
        print(f"Error creating product: {e}")
        return jsonify({"success": False, "error": "Lỗi server nội bộ"}), 500

@warehouse_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json()
        updated_product = WarehouseService.update_product(product_id, data)
        return jsonify({"success": True, "data": updated_product, "message": "Cập nhật thành công"}), 200
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        print(f"Error updating: {e}")
        return jsonify({"success": False, "error": "Lỗi server"}), 500

@warehouse_bp.route('/products/<int:product_id>/toggle-active', methods=['PATCH'])
def toggle_product_active(product_id):
    try:
        updated_product = WarehouseService.update_product(product_id, {'is_active': request.get_json().get('is_active')})
        return jsonify({"success": True, "data": updated_product, "message": "Cập nhật trạng thái thành công"}), 200
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Lỗi server"}), 500

@warehouse_bp.route('/slips', methods=['GET'])
def get_slips():
    try:
        data = WarehouseService.get_all_slips()
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@warehouse_bp.route('/slips/<string:slip_type>/<int:slip_id>', methods=['GET'])
def get_slip_detail(slip_type, slip_id):
    try:
        # slip_type nhận vào: 'IMPORT' hoặc 'EXPORT'
        data = WarehouseService.get_slip_detail(slip_type.upper(), slip_id)
        return jsonify({"success": True, "data": data}), 200
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500