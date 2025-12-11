# server/app/api/dashboard_routes.py
from flask import Blueprint, jsonify
from app.services.dashboard_service import DashboardService

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/inventory-stats', methods=['GET'])
def get_inventory_stats():
    try:
        summary = DashboardService.get_inventory_summary()
        chart_data = DashboardService.get_monthly_movement_chart()
        alerts = DashboardService.get_stock_alerts()

        return jsonify({
            "success": True,
            "data": {
                "metrics": summary,
                "chart": chart_data,
                "alerts": alerts
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500