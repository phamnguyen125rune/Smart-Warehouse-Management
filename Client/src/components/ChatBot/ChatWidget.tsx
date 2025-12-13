// Client/src/components/ChatBot/ChatWidget.tsx
import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý kho hàng. Bạn cần tra cứu gì không?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 1. Hiện tin nhắn người dùng ngay lập tức
    const userMsg: Message = { id: Date.now(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      console.log("Đang gửi câu hỏi:", userMsg.text); // Debug Log

      // 2. Gọi API Backend
      const response = await fetch("/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.text }),
      });

      const data = await response.json();
      console.log("Server trả về:", data); // Kiểm tra xem server trả về gì ở đây

      // 3. Xử lý phản hồi
      const answerText = data.success
        ? data.answer
        : "Lỗi: Server không trả lời đúng định dạng.";

      const botMsg: Message = {
        id: Date.now() + 1,
        text: answerText || "Xin lỗi, tôi không tìm thấy thông tin.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Không thể kết nối đến Server Python!",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSendMessage();
  };

  return (
    <div className="flex flex-col items-end">
      {/* Cửa sổ Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-80 h-96 bg-white border border-gray-300 shadow-2xl rounded-lg flex flex-col overflow-hidden">
          {/* Header màu Xanh dương đậm */}
          <div className="bg-blue-600 p-3 flex justify-between items-center text-white">
            <h3 className="font-bold text-sm">Trợ lý Kho hàng AI</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-800 rounded-full p-1"
            >
              ✕
            </button>
          </div>

          {/* Khu vực tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-100 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 text-sm shadow-sm ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white" // User: Nền xanh, Chữ trắng
                      : "bg-white text-gray-800 border border-gray-200" // Bot: Nền trắng, Chữ đen
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg p-2 text-xs italic text-gray-500 animate-pulse">
                  Đang suy nghĩ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Khu vực nhập liệu */}
          <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về kho hàng..."
              className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:border-blue-500 text-black"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Nút Bong bóng Chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
};

export default ChatWidget;
