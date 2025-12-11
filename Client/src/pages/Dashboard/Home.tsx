import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import InventoryHealthMetrics from "../../components/ecommerce/InventoryHealthMetrics"; // Nhớ đổi tên file hoặc import đúng
import StockMovementChart from "../../components/ecommerce/StockMovementChart";
import StockAlertTable from "../../components/ecommerce/StockAlertTable";
import { dashboardService } from "../../services/dashboardService";
import { DashboardResponse } from "../../types/dashboard.types";

export default function Home() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getStats();
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Đang tải dữ liệu kho...</div>;
  if (!data) return <div className="p-6 text-center text-red-500">Không có dữ liệu.</div>;

  return (
    <>
      <PageMeta
        title="Tổng quan Kho hàng | Smart Warehouse"
        description="Bảng điều khiển quản lý nhập xuất tồn"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        
        {/* Hàng 1: Các chỉ số Metrics */}
        <div className="col-span-12">
          <InventoryHealthMetrics data={data.metrics} />
        </div>

        {/* Hàng 2: Biểu đồ và Bảng cảnh báo */}
        <div className="col-span-12 xl:col-span-7">
          <StockMovementChart data={data.chart} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <StockAlertTable alerts={data.alerts} />
        </div>

      </div>
    </>
  );
}