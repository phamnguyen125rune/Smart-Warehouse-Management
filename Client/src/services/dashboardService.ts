import axiosClient from "./axiosClient";
import { ApiResponse } from "../types/warehouse.types";
import { DashboardResponse } from "../types/dashboard.types";

export const dashboardService = {
  getStats: (): Promise<ApiResponse<DashboardResponse>> => {
    return axiosClient.get("/inventory-stats");
  },
};