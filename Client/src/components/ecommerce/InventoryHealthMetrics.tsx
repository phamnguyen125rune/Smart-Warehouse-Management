import { BoxIconLine, ArrowUpIcon, GroupIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import { DashboardMetrics } from "../../types/dashboard.types";

interface Props {
  data: DashboardMetrics;
}

export default function InventoryHealthMetrics({ data }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      
      {/* Metric 1: Giá trị tồn kho */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <span className="text-gray-800 text-xl font-bold dark:text-white">$</span>
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">Tổng giá trị Kho</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {data.total_inventory_value.toLocaleString('vi-VN')} đ
          </h4>
        </div>
      </div>

      {/* Metric 2: Cảnh báo sắp hết */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl dark:bg-red-900/20">
           {/* Bạn có thể thay icon cảnh báo ở đây */}
           <BoxIconLine className="text-red-500 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Sản phẩm Báo động</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data.low_stock_items}
            </h4>
          </div>
          <Badge color="error">Cần nhập</Badge>
        </div>
      </div>

      {/* Metric 3: Tổng sản phẩm */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl dark:bg-blue-900/20">
          <GroupIcon className="text-blue-500 size-6" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">Tổng mã hàng (SKU)</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {data.total_products}
          </h4>
        </div>
      </div>
    </div>
  );
}