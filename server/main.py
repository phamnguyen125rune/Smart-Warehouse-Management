import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


# Import file model AI (chúng ta sẽ tạo file giả lập bên dưới)
import ai_model

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app)

# --- Cấu hình thư mục Upload ---
UPLOAD_FOLDER = 'uploads'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Cấu hình CSDL (Mục mới) ---
# Đường dẫn tới file CSDL SQLite. File 'app.db' sẽ được tạo trong thư mục dự án.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- Khởi tạo các đối tượng CSDL và Migrate (Mục mới) ---
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# --- Định nghĩa Models (Bảng dữ liệu) (Mục mới) ---
# Mỗi class tương ứng với một bảng trong CSDL

class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    total_amount = db.Column(db.Float, nullable=True) # Tổng tiền hóa đơn
    # Mối quan hệ: Một hóa đơn có nhiều mục hàng
    items = db.relationship('InvoiceItem', backref='invoice', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Invoice {self.id}>'

class InvoiceItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    # Khóa ngoại để liên kết tới bảng Invoice
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoice.id'), nullable=False)

    def __repr__(self):
        return f'<InvoiceItem {self.product_name}>'

# --- API Endpoints ---
@app.route('/')
def hello_world():
    return 'Hello, World! Server đang chạy.'

@app.route('/api/v1/imports/ocr-upload', methods=['POST'])
@cross_origin()
def upload_and_process_invoice():
    # 1 Nhận file
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "Không có file nào được gửi"}), 400

    file = request.files['file']

    # không có dữ liệu file, có thể bỏ qua hoặc trả về, thôi thì trả về.
    if file.filename == '':
        return jsonify({"success": False, "error": "Tên file rỗng"}), 400

    if file:
        filename = secure_filename(file.filename)
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            file.save(image_path)
            print(f"Đã lưu file vào: {image_path}")
        except Exception as e:
            print(f"Lỗi khi lưu file: {e}")
            return jsonify({"success": False, "error": f"Lỗi khi lưu file: {str(e)}"}), 500

        # 2 Xử lý OCR qua mô hình AI
        try:
            # Nơi hàm từ file ai_model.py
            ocr_results = ai_model.process_ocr(image_path)
            
            # (xóa file ảnh sau khi xử lý nếu muốn)
            # os.remove(image_path)

        except Exception as e:
            print(f"Lỗi khi xử lý OCR: {e}")
            # (xóa file ảnh nếu xử lý lỗi)
            # os.remove(image_path)
            return jsonify({"success": False, "error": f"Lỗi khi xử lý AI: {str(e)}"}), 500

        # 3 Trả kết quả OCR về cho React
        return jsonify({
            "success": True, 
            "data": ocr_results
        }), 200

    return jsonify({"success": False, "error": "Lỗi không xác định"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port='5000')