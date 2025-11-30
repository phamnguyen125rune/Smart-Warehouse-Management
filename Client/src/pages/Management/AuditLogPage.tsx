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

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await adminService.getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <>
      <PageBreadcrumb pageTitle="Nhật ký hệ thống" />
      
      <ComponentCard title="Truy vết hoạt động (Audit Trail)">
        {isLoading ? <p>Đang tải...</p> : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100 text-left dark:bg-gray-700">
                  <th className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">Thời gian</th>
                  <th className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">Người thực hiện</th>
                  <th className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">Hành động</th>
                  <th className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white font-medium">
                      {log.actor_name} <br/>
                      <span className="text-xs text-gray-500 font-normal">({log.actor_id})</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${log.action === 'UPDATE_PROFILE' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <p className="p-4 text-center text-gray-500">Chưa có dữ liệu ghi nhận.</p>}
          </div>
        )}
      </ComponentCard>
    </>
  );
}