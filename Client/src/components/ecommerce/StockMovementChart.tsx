import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ChartData } from "../../types/dashboard.types";

interface Props {
  data: ChartData;
}

export default function StockMovementChart({ data }: Props) {
  const options: ApexOptions = {
    colors: ["#10B981", "#EF4444"], // Xanh (Nhập), Đỏ (Xuất)
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 300,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: data.categories, // Dữ liệu tháng từ Server
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: true, position: "top", horizontalAlign: "left" },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val: number) => `${val} sản phẩm` },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Biến động Nhập / Xuất kho
        </h3>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={data.series} type="bar" height={300} />
        </div>
      </div>
    </div>
  );
}