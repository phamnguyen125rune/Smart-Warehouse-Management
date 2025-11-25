# app/__init__.py
from flask import Flask
from config import Config
from .extensions import db, migrate, jwt, bcrypt, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # 1. Warehouse
    from app.api.warehouse_routes import warehouse_bp
    app.register_blueprint(warehouse_bp, url_prefix='/api/v1') 
    
    # 2. Auth
    from app.api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    # 3. Admin
    from app.api.admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # 4. [MỚI] File Routes (Để hiện ảnh)
    from app.api.file_routes import file_bp
    app.register_blueprint(file_bp, url_prefix='/') 

    return app