// src/pages/MailboxPage.tsx
import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import ComposeModal from "../../components/mailbox/ComposeModal";
import { notificationService } from "../../services/notificationService";
import { MailItem } from "../../types/notification.types";
import { format } from "date-fns";

// Định nghĩa các loại Filter
type FilterType = 'ALL' | 'MANAGER' | 'SYSTEM' | 'PINNED' | 'SENT';

export default function MailboxPage() {
  const [mails, setMails] = useState<MailItem[]>([]);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // [NEW] States cho Phân trang & Lọc
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [meta, setMeta] = useState({ total: 0, pages: 1, has_next: false, has_prev: false });

  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const fetchMails = async () => {
    setIsLoading(true);
    try {
      // Gọi API với tham số page và type
      const res = await notificationService.getNotifications(currentPage, filterType);
      setMails(res.data);
      setMeta(res.meta); // Lưu thông tin phân trang
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch lại khi đổi trang hoặc đổi filter
  useEffect(() => {
    fetchMails();
  }, [currentPage, filterType]);

  // Hàm xử lý khi bấm nút Filter
  const handleFilterChange = (type: FilterType) => {
      setFilterType(type);
      setCurrentPage(1); // Reset về trang 1 khi đổi bộ lọc
      setSelectedMail(null); // Bỏ chọn mail đang xem
  };

  // Hàm xử lý khi bấm Next/Prev
  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= meta.pages) {
          setCurrentPage(newPage);
      }
  };

  const handleRead = async (mail: MailItem) => {
    setSelectedMail(mail);
    if (!mail.is_read) {
        try {
            await notificationService.markAsRead(mail.id);
            setMails(prev => prev.map(m => m.id === mail.id ? {...m, is_read: true} : m));
        } catch(e) {}
    }
  };

  // [FIX] Cập nhật hàm handleTogglePin để xử lý cả việc update selectedMail
  const handleTogglePin = async (e: React.MouseEvent | null, mail: MailItem) => {
    // Nếu gọi từ List (có event click), cần chặn nổi bọt
    if (e) e.stopPropagation(); 

    try {
        // Gọi API
        const res = await notificationService.togglePin(mail.id);
        
        // [FIX] Thêm dòng này: Nếu res bị null/undefined thì dừng ngay, không chạy tiếp
        if (!res) return; 

        // 1. Cập nhật danh sách bên trái
        setMails(prev => {
            if (filterType === 'PINNED' && !res.is_pinned) {
                return prev.filter(m => m.id !== mail.id);
            }
            // Ở đây res đã an toàn để gọi res.is_pinned
            return prev.map(m => m.id === mail.id ? {...m, is_pinned: res.is_pinned} : m);
        });

        // 2. Cập nhật chi tiết bên phải
        if (selectedMail && selectedMail.id === mail.id) {
            setSelectedMail(prev => prev ? { ...prev, is_pinned: res.is_pinned } : null);
        }

    } catch (error) {
        console.error("Lỗi ghim", error);
    }
  };

  // CSS Helper cho Filter Tab
  const getTabClass = (type: FilterType) => {
      const active = filterType === type;
      return `px-4 py-2 text-xs font-medium rounded-full transition-colors ${
          active 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 border border-transparent'
      }`;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
          <PageBreadcrumb pageTitle="Hộp thư nội bộ" />
          <Button className="flex items-center gap-2" onClick={() => setIsComposeOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Soạn thư
          </Button>
      </div>
      
      <div className="flex flex-col h-[calc(100vh-220px)] gap-4 lg:flex-row">
        
        {/* --- DANH SÁCH TIN NHẮN (BÊN TRÁI) --- */}
        <div className="w-full lg:w-5/12 xl:w-4/12 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Hộp thư đến</h3>
                    <button onClick={fetchMails} className="text-sm text-blue-600 hover:underline">Làm mới</button>
                </div>

                {/* [NEW] FILTER TABS */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button onClick={() => handleFilterChange('ALL')} className={getTabClass('ALL')}>Tất cả</button>
                    {/* [NEW] Tab Đã ghim */}
                    <button onClick={() => handleFilterChange('PINNED')} className={getTabClass('PINNED')}>
                        <span className="flex items-center gap-1">
                           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/></svg>
                           Đã ghim
                        </span>
                    </button>
                    <button onClick={() => handleFilterChange('MANAGER')} className={getTabClass('MANAGER')}>Quản lý</button>
                    <button onClick={() => handleFilterChange('SYSTEM')} className={getTabClass('SYSTEM')}>Hệ thống</button>
                    
                    {/* [NEW] Tab Đã gửi */}
                    <button onClick={() => handleFilterChange('SENT')} className={getTabClass('SENT')}>
                        Đã gửi
                    </button>
                </div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? <p className="p-4 text-center">Đang tải...</p> : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {mails.map(mail => {
                            // Logic xác định style (giữ nguyên)
                            const isSelected = selectedMail?.id === mail.id;
                            const isRead = mail.is_read; 
                            
                            // [NEW] Logic hiển thị tên: 
                            // Nếu đang ở tab SENT -> Hiện tên người nhận
                            // Nếu tab khác -> Hiện tên người gửi
                            const displayName = filterType === 'SENT' 
                                ? `Tới: ${mail.recipient_name}` 
                                : mail.sender_name;

                            return (
                                <li 
                                    key={mail.id} 
                                    onClick={() => handleRead(mail)}
                                    className={`
                                        cursor-pointer p-4 transition-all duration-200
                                        border-l-4 group relative
                                        ${
                                            isSelected
                                                ? "bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400" // Đang chọn
                                                : isRead
                                                ? "bg-gray-50/50 border-transparent dark:bg-gray-900/50" // Đã đọc (Nền hơi xám, ko viền)
                                                : "bg-white border-blue-500 shadow-sm dark:bg-gray-800 dark:border-blue-500" // Chưa đọc (Nền trắng, viền trái xanh)
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2.5">
                                            {/* Ẩn dấu chấm xanh nếu là tab SENT (vì mình gửi thì mặc định mình đã đọc rồi) */}
                                            {!isRead && filterType !== 'SENT' && (
                                                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                                            )}

                                            {/* [NEW] Icon Ghim - Clickable */}
                                            <button 
                                                onClick={(e) => handleTogglePin(e, mail)}
                                                className={`transition-colors ${mail.is_pinned ? 'text-orange-500 rotate-45' : 'text-gray-300 hover:text-gray-500'}`}
                                                title={mail.is_pinned ? "Bỏ ghim" : "Ghim tin nhắn này"}
                                            >
                                                {/* SVG cái ghim */}
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/>
                                                </svg>
                                            </button>

                                            {/* [FIX] Hiển thị displayName */}
                                            <span className={`text-sm truncate max-w-[140px] ${
                                                !isRead && filterType !== 'SENT' ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'
                                            } ${mail.msg_type === 'SYSTEM' ? '!text-slate-600 dark:!text-slate-400' : ''}`}>
                                                {displayName}
                                            </span>

                                            {/* Badge */}
                                            {mail.msg_type === "SYSTEM" && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600">
                                                    HỆ THỐNG
                                                </span>
                                            )}
                                            {mail.msg_type === "MANAGER" && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200 font-bold">
                                                    QUẢN LÝ
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400">{format(new Date(mail.created_at), 'dd/MM HH:mm')}</span>
                                    </div>
                                    
                                    {/* ... (Title & Message giữ nguyên) ... */}
                                    {/* Hàng 2: Tiêu đề */}
                                    <h4
                                        className={`text-sm mb-1 truncate ${
                                            !isRead
                                                ? "font-bold text-gray-900 dark:text-white" // Chưa đọc: Đậm
                                                : "font-normal text-gray-500 dark:text-gray-400" // Đã đọc: Thường
                                        }`}
                                    >
                                        {mail.title}
                                    </h4>

                                    {/* Hàng 3: Nội dung tóm tắt */}
                                    <p className="text-xs text-gray-400 truncate dark:text-gray-500 pr-4">
                                        {mail.message}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {mails.length === 0 && !isLoading && <p className="p-8 text-center text-gray-500 text-sm">Không có tin nhắn nào.</p>}
            </div>
            {/* ... (Footer Pagination giữ nguyên) ... */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!meta.has_prev}
                    className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-700"
                >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                
                <span className="text-xs text-gray-500">
                    Trang {currentPage} / {meta.pages}
                </span>

                <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!meta.has_next}
                    className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-700"
                >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            </div>
        </div>

        {/* --- NỘI DUNG CHI TIẾT (BÊN PHẢI) --- */}
      <div className="w-full lg:w-7/12 xl:w-8/12 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700 p-6 flex flex-col">
         {selectedMail ? (
             <>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 overflow-hidden">
                        {/* Avatar */}
                        <div className={`h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold text-white
                            ${selectedMail.msg_type === 'SYSTEM' ? 'bg-slate-500' : (selectedMail.msg_type === 'MANAGER' ? 'bg-amber-500' : 'bg-blue-500')}
                        `}>
                            {filterType === 'SENT' ? selectedMail.recipient_name.charAt(0) : selectedMail.sender_name.charAt(0)}
                        </div>
                        
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-2">
                                {selectedMail.title}
                            </h2>
                            <p className="text-sm text-gray-500 truncate">
                                {filterType === 'SENT' ? (
                                    <>Gửi tới: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedMail.recipient_name}</span></>
                                ) : (
                                    <>Từ: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedMail.sender_name}</span></>
                                )}
                                <span className="mx-2">•</span>
                                {format(new Date(selectedMail.created_at), 'PPPP p')}
                            </p>
                        </div>
                    </div>

                    {/* [NEW] KHU VỰC ACTION (Ghim & Badge) */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Nút Ghim Trong Chi Tiết */}
                        <button 
                            onClick={() => handleTogglePin(null, selectedMail)}
                            className={`p-2 rounded-full transition-all duration-200 border 
                                ${selectedMail.is_pinned 
                                    ? 'bg-orange-50 border-orange-200 text-orange-500 hover:bg-orange-100' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
                                }`}
                            title={selectedMail.is_pinned ? "Bỏ ghim tin nhắn này" : "Ghim tin nhắn này"}
                        >
                            {/* SVG Ghim */}
                            <svg className={`w-5 h-5 ${selectedMail.is_pinned ? 'rotate-45' : ''}`} fill="currentColor" viewBox="0 0 16 16">
                                <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/>
                            </svg>
                        </button>

                        {selectedMail.msg_type === 'SYSTEM' && (
                             <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium uppercase tracking-wide border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600">
                                 Hệ thống
                             </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedMail.message}
                </div>

                {/* Footer actions */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                     {/* Nút Reply nếu cần */}
                </div>
             </>
         ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>Chọn tin nhắn để xem chi tiết</p>
             </div>
         )}
      </div>
      </div>
      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        onSuccess={() => {
            fetchMails();
            // Reset về tab Tất cả và trang 1 để thấy tin vừa gửi (nếu backend trả về cả sent items - ở đây ta chỉ show inbox nên không ảnh hưởng nhiều)
        }}
      />
    </>
  );
}
