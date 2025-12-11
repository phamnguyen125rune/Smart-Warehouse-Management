export interface DashboardMetrics {
  total_inventory_value: number;
  low_stock_items: number;
  total_products: number;
}

export interface ChartData {
  categories: string[]; // Các tháng (Jan, Feb...)
  series: {
    name: string;
    data: number[];
  }[];
}

export interface StockAlertItem {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  status: "Low Stock" | "Out of Stock";
}

// Cấu trúc tổng thể phản hồi từ API
export interface DashboardResponse {
  metrics: DashboardMetrics;
  chart: ChartData;
  alerts: StockAlertItem[];
}