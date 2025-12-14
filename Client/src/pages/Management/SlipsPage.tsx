import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { warehouseService } from "../../services/warehouseService";
import { SlipSummary } from "../../types/warehouse.types";
import { format } from "date-fns";

export default function SlipsPage() {
  const [slips, setSlips] = useState<SlipSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    warehouseService.getSlips().then(res => {
      if (res.success) setSlips(res.data);
    });
  }, []);

  const handleViewDetail = (slip: SlipSummary) => {
    // Điều hướng sang trang chi tiết: /slips/IMPORT/123
    navigate(`/slips/${slip.type}/${slip.id}`);
  };

  return (
    <>
      <PageMeta title="Lịch sử Phiếu" description="" />
      <PageBreadcrumb pageTitle="Lịch sử Nhập/Xuất" />

      <ComponentCard title="Danh sách phiếu">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Mã phiếu</TableCell>
                <TableCell isHeader className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Loại</TableCell>
                <TableCell isHeader className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Ngày tạo</TableCell>
                <TableCell isHeader className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">Ghi chú</TableCell>
                <TableCell isHeader className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">Tổng tiền</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips.map((slip) => (
                <TableRow 
                    key={`${slip.type}-${slip.id}`} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleViewDetail(slip)}
                >
                  <TableCell className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-medium">
                    {slip.code}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                        slip.type === 'IMPORT' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                        {slip.type === 'IMPORT' ? 'NHẬP KHO' : 'XUẤT KHO'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {format(new Date(slip.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">{slip.note}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-200">
                    {slip.total_amount.toLocaleString('vi-VN')} đ
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </>
  );
}
