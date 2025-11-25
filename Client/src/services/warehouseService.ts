import axiosClient from './axiosClient';
import { 
  Product, 
  CreateExportSlipPayload, 
  CreateImportSlipPayload, 
  ApiResponse 
} from '../types/warehouse.types';

export const warehouseService = {
  uploadInvoice: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosClient.post('/v1/ocr-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<ApiResponse<any>>;
  },

  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    return axiosClient.get('/v1/products') as Promise<ApiResponse<Product[]>>;
  },

  createImportSlip: async (data: CreateImportSlipPayload): Promise<ApiResponse<any>> => {
    return axiosClient.post('/v1/import-slips', data) as Promise<ApiResponse<any>>;
  },

  createExportSlip: async (data: CreateExportSlipPayload): Promise<ApiResponse<any>> => {
    return axiosClient.post('/v1/export-slips', data) as Promise<ApiResponse<any>>;
  }
};