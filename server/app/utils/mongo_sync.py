# app/utils/mongo_sync.py
from pymongo import MongoClient, TEXT
from app import create_app
from app.models import Product

# Cấu hình Mongo (Nên để trong config.py nhưng viết tạm ở đây)
MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'smart_warehouse_search'
COLLECTION_NAME = 'products'

def sync_products_to_mongo():
    """
    Hàm này lấy toàn bộ Product từ MySQL và đẩy sang MongoDB để phục vụ Search.
    Nên chạy hàm này khi khởi động server hoặc khi có thay đổi lớn về sản phẩm.
    """
    app = create_app()
    with app.app_context():
        # 1. Kết nối Mongo
        client = MongoClient(MONGO_URI)
        db_mongo = client[DB_NAME]
        collection = db_mongo[COLLECTION_NAME]

        # 2. Xóa dữ liệu cũ (Reset index)
        collection.delete_many({})
        print("Đã xóa dữ liệu cũ trong MongoDB.")

        # 3. Lấy dữ liệu từ MySQL
        mysql_products = Product.query.all()
        print(f"Tìm thấy {len(mysql_products)} sản phẩm trong MySQL.")

        # 4. Chuẩn bị dữ liệu
        mongo_docs = []
        for p in mysql_products:
            doc = {
                "mysql_id": p.id,
                "name": p.name,
                "sku": p.sku,
                # Lưu thêm dạng không dấu để tăng khả năng tìm kiếm
                # (Bạn có thể dùng hàm remove_vietnamese_tones nếu muốn kỹ hơn)
                "search_text": f"{p.name} {p.sku}" 
            }
            mongo_docs.append(doc)

        # 5. Insert vào Mongo
        if mongo_docs:
            collection.insert_many(mongo_docs)
            
            # 6. Tạo Text Index (Quan trọng để tìm kiếm nhanh)
            collection.create_index([("name", TEXT), ("sku", TEXT)])
            print("Đã đồng bộ và đánh index thành công!")

if __name__ == "__main__":
    sync_products_to_mongo()