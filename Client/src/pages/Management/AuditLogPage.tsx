import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { adminService } from "../../services/adminService";
import { format } from "date-fns";

interface LogItem {
  id: number;
  actor_name: string;
  actor_id: string;
  action: string;
  details: string;
  timestamp: string;
}

// --- COMPONENT CON ĐỂ XỬ LÝ TEXT DÀI ---
const DetailsCell = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Ngưỡng ký tự để cắt bớt
  const MAX_LENGTH = 100;
  const shouldTruncate = text && text.length > MAX_LENGTH;

  return (
    <div className="relative min-w-[300px] max-w-[500px]">
      <div 
        className={`text-sm font-mono text-gray-600 dark:text-gray-300 break-words whitespace-pre-wrap transition-all duration-200 ${!isExpanded ? 'line-clamp-2 max-h-[3.6em] overflow-hidden' : ''}`}
      >
        {text || '-'}
      </div>
      
      {shouldTruncate && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 mt-1 focus:outline-none"
        >
          {isExpanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State (Thêm phân trang đơn giản nếu muốn)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await adminService.getAuditLogs();
        // Sắp xếp log mới nhất lên đầu (nếu API chưa sort)
        setLogs(data.reverse()); 
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Tính toán phân trang client-side
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const currentLogs = logs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <PageBreadcrumb pageTitle="Nhật ký hệ thống" />
      
      <ComponentCard title={`Truy vết hoạt động (${logs.length} bản ghi)`}>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải nhật ký...</div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[180px]">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">Người thực hiện</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[150px]">Hành động</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Chi tiết thay đổi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 align-top">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{log.actor_name}</span>
                          <span className="text-xs text-gray-400 font-mono mt-0.5">{log.actor_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${log.action.includes('DELETE') ? 'bg-red-50 text-red-700 border-red-100' : 
                            log.action.includes('UPDATE') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm align-top">
                        {/* Component xử lý text dài ở đây */}
                        <DetailsCell text={log.details} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && <div className="p-8 text-center text-gray-500 italic">Chưa có dữ liệu ghi nhận.</div>}
            </div>

            {/* Phân trang đơn giản */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Trước</button>
                        <button onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Sau</button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                                Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button onClick={() => setCurrentPage(c => Math.max(c - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800">
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))} disabled={currentPage === totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800">
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}
      </ComponentCard>
    </>
  );
}