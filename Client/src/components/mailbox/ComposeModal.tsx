import { useState, useEffect, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { adminService } from "../../services/adminService";
import { notificationService } from "../../services/notificationService";
import { AdminUser } from "../../types/admin.types";
import { useAuth } from "../../context/AuthContext"; // Lấy user hiện tại để loại trừ

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// --- HÀM HỖ TRỢ: BỎ DẤU TIẾNG VIỆT ---
// Ví dụ: "Quản lý" -> "quan ly", "Quân" -> "quan"
const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Kết hợp các dấu thanh (nếu còn sót)
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return str;
}

export default function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]); // Danh sách gốc
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]); // Danh sách gợi ý
  
  // Search Logic States
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // Ref để click ra ngoài thì đóng suggestion
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const data = await adminService.getAllUsers();
          const usersList = data as unknown as AdminUser[];
          
          // [FIX] Loại bỏ chính mình khỏi danh sách ngay từ đầu
          const others = usersList.filter(u => u.id !== currentUser?.id);
          
          setAllUsers(others);
          setFilteredUsers(others);
        } catch (error) {
          console.error("Lỗi tải danh sách user", error);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, currentUser]);

  // Logic Tìm kiếm thông minh
  useEffect(() => {
    if (!searchTerm) {
        setFilteredUsers(allUsers);
        return;
    }
    const lowerTerm = removeVietnameseTones(searchTerm.toLowerCase());
    
    const filtered = allUsers.filter(u => {
        const name = removeVietnameseTones(u.full_name.toLowerCase());
        const role = removeVietnameseTones(u.role.toLowerCase());
        // Tìm theo tên hoặc role (ví dụ gõ "quan li" cũng ra)
        return name.includes(lowerTerm) || role.includes(lowerTerm);
    });
    setFilteredUsers(filtered);
  }, [searchTerm, allUsers]);

  // Xử lý click ra ngoài để ẩn gợi ý
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelectUser = (user: AdminUser) => {
      setSelectedUser(user);
      setSearchTerm(user.full_name); // Điền tên vào ô input
      setShowSuggestions(false);     // Ẩn gợi ý
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !title || !message) {
      alert("Vui lòng chọn người nhận và điền đầy đủ nội dung.");
      return;
    }

    setIsSending(true);
    try {
      await notificationService.sendMessage({
        recipient_id: selectedUser.id,
        title,
        message,
        is_pinned: isPinned,
      });
      
      alert("Gửi tin nhắn thành công!");
      setSearchTerm("");
      setSelectedUser(null);
      setTitle("");
      setMessage("");
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || error.error || "Gửi thất bại.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] m-4">
      <div className="w-full p-6 bg-white rounded-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Soạn tin nhắn mới
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. AUTOCOMPLETE SEARCH INPUT */}
          <div className="relative" ref={wrapperRef}>
            <Label htmlFor="recipient">Gửi đến:</Label>
            <div className="relative">
                <Input
                    id="recipient"
                    type="text"
                    placeholder="Gõ tên để tìm (vd: Quan, Quynh...)"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSelectedUser(null); // Reset nếu người dùng gõ lại
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                    className={selectedUser ? "border-green-500 bg-green-50 dark:bg-green-900/20" : ""}
                />
                {/* Icon loading hoặc check */}
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    {selectedUser ? (
                        <span className="text-green-600 font-bold">✓</span>
                    ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    )}
                </div>
            </div>

            {/* LIST GỢI Ý (DROPDOWN) */}
            {showSuggestions && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar dark:bg-gray-800 dark:border-gray-700">
                    {isLoadingUsers ? (
                        <li className="px-4 py-3 text-sm text-gray-500">Đang tải...</li>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                            <li 
                                key={u.id}
                                onClick={() => handleSelectUser(u)}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.full_name}</p>
                                    <p className="text-xs text-gray-500">{u.role}</p>
                                </div>
                                <span className="text-xs text-gray-400">{u.employee_id}</span>
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy người dùng nào</li>
                    )}
                </ul>
            )}
          </div>

          {/* 2. Tiêu đề */}
          <div>
            <Label htmlFor="title">Tiêu đề:</Label>
            <Input
              id="title"
              type="text"
              placeholder="Tiêu đề tin nhắn"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 3. Nội dung */}
          <div>
            <Label htmlFor="message">Nội dung:</Label>
            <textarea
              id="message"
              rows={6}
              className="w-full px-4 py-3 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 outline-none resize-none"
              placeholder="Nhập nội dung..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Hủy
            </Button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ghim lên tin nhắn người đọc</span>
            </label>
            <Button type="submit" disabled={isSending || !selectedUser}>
              {isSending ? "Đang gửi..." : "Gửi tin nhắn"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}