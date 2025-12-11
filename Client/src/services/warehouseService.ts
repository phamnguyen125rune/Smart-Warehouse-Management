import axiosClient from './axiosClient';
import { 
  Product, 
  CreateExportSlipPayload, 
  CreateImportSlipPayload, 
  ApiResponse,
  SlipSummary,
  SlipDetail
} from '../types/warehouse.types';

export const warehouseService = {
  uploadInvoice: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosClient.post('/v1/ocr-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<ApiResponse<any>>;
  },

  createProduct: async (data: any): Promise<ApiResponse<Product>> => {
    return axiosClient.post('/v1/products', data) as Promise<ApiResponse<Product>>;
  },
  
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    return axiosClient.get('/v1/products') as Promise<ApiResponse<Product[]>>;
  },

  createImportSlip: async (data: CreateImportSlipPayload): Promise<ApiResponse<any>> => {
    return axiosClient.post('/v1/import-slips', data) as Promise<ApiResponse<any>>;
  },

  createExportSlip: async (data: CreateExportSlipPayload): Promise<ApiResponse<any>> => {
    return axiosClient.post('/v1/export-slips', data) as Promise<ApiResponse<any>>;
  },
  
  updateProduct: async (id: number, data: any): Promise<ApiResponse<Product>> => {
    return axiosClient.put(`/v1/products/${id}`, data) as Promise<ApiResponse<Product>>;
  },

  getSlips: async (): Promise<ApiResponse<SlipSummary[]>> => {
    return axiosClient.get('/v1/slips') as Promise<ApiResponse<SlipSummary[]>>;
  },

  getSlipDetail: async (type: string, id: number): Promise<ApiResponse<SlipDetail>> => {
    return axiosClient.get(`/v1/slips/${type}/${id}`) as Promise<ApiResponse<SlipDetail>>;
  }
};