# server/app/api/chat_routes.py
from flask import Blueprint, request, jsonify
from app.services.chatbot_service import ChatbotService

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/ask', methods=['POST'])
def ask_bot():
    """
    API nhận câu hỏi từ Client và trả về câu trả lời từ AI
    URL: /api/chat/ask
    Method: POST
    Body: { "question": "Kho còn bao nhiêu bút bi?" }
    """
    try:
        data = request.get_json()
        question = data.get('question')
        
        if not question:
            return jsonify({"error": "Vui lòng nhập câu hỏi"}), 400

        # Gọi service AI xử lý
        answer = ChatbotService.ask_inventory(question)
        
        return jsonify({
            "success": True,
            "answer": answer
        })
        
    except Exception as e:
        print(f"API Chat Error: {e}")
        return jsonify({"success": False, "error": "Lỗi server"}), 500