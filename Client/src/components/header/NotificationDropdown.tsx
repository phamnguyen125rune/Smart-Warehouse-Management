import { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link, useNavigate } from "react-router-dom"; // Dùng react-router-dom thay vì react-router
import { notificationService } from "../../services/notificationService";
import { MailItem } from "../../types/notification.types";
import { formatDistanceToNow } from "date-fns"; // Để hiển thị "5 min ago"
import { vi } from "date-fns/locale"; // Nếu muốn hiển thị tiếng Việt

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<MailItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  
  // Dùng interval để polling thông báo mới mỗi 60s
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Lấy 5 tin mới nhất
        const res: any = await notificationService.getNotifications(1, 'ALL'); 
        setNotifications(res.data.slice(0, 5)); // Chỉ lấy 5 tin đầu
        setUnreadCount(res.unread_count);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications(); // Gọi lần đầu
    const interval = setInterval(fetchNotifications, 60000); // Gọi lại mỗi 1 phút

    return () => clearInterval(interval);
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleNotificationClick = async (mail: MailItem) => {
    closeDropdown();
    
    // Đánh dấu đã đọc nếu chưa đọc
    if (!mail.is_read) {
        try {
            await notificationService.markAsRead(mail.id);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === mail.id ? {...n, is_read: true} : n));
        } catch(e) {}
    }

    // Chuyển hướng đến trang Hộp thư (có thể kèm ID để trang kia tự mở chi tiết, nhưng giờ chưa biết làm)
    // Ở đây mình chuyển về trang mailbox.
    navigate('/mailboxpage'); 
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {/* Chấm đỏ thông báo */}
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            unreadCount === 0 ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>

        {/* Icon Chuông */}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Thông báo {unreadCount > 0 && `(${unreadCount})`}
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {/* Icon đóng */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <li key={notif.id}>
                <DropdownItem
                  onItemClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 rounded-lg p-3 px-4.5 py-3 hover:bg-gray-100 dark:hover:bg-white/5 ${
                    !notif.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  {/* Avatar Người gửi */}
                  <span className="relative block w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700">
                    {notif.sender_avatar ? (
                        <img src={`${import.meta.env.VITE_API_BASE_URL}${notif.sender_avatar}`} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white font-bold ${
                            notif.msg_type === 'SYSTEM' ? 'bg-red-500' : 'bg-gray-400'
                        }`}>
                            {notif.sender_name.charAt(0)}
                        </div>
                    )}
                    
                    {/* Chấm trạng thái online/offline (Giả lập hoặc bỏ qua) */}
                    {/* <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-success-500 dark:border-gray-900"></span> */}
                  </span>

                  <span className="block overflow-hidden">
                    <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400 truncate">
                      <span className={`font-medium ${!notif.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {notif.sender_name}
                      </span>
                      {" "}
                      <span className="text-xs">{notif.title}</span>
                    </span>

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span className="truncate max-w-[150px]">{notif.message}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                      <span className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-sm text-gray-500">
                Không có thông báo mới
            </li>
          )}
        </ul>

        <Link
          to="/mailboxpage" // Chuyển hướng sang trang Hộp thư đầy đủ
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Xem tất cả thông báo
        </Link>
      </Dropdown>
    </div>
  );
}