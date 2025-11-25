export interface Product {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  quantity_in_stock: number;
}

export interface ImportSlipItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CreateImportSlipRequest {
  code: string;
  invoice_total: number;
  items: ImportSlipItem[];
}

// Model Sản phẩm (Map với DB)
export interface Product {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  quantity_in_stock: number;
}

// Item trong phiếu xuất (Dùng cho UI hiển thị danh sách chờ xuất)
export interface ExportSlipUIItem {
  productId: number;
  name: string;
  quantity: number;
  currentStock: number; // Để validate không xuất quá tồn kho
}

// Payload gửi lên API tạo phiếu xuất
export interface CreateExportSlipPayload {
  code?: string; // Mã phiếu (optional)
  reason: string;
  items: {
    product_id: number;
    quantity: number;
    export_price?: number;
  }[];
}

// Response từ API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Item chi tiết trong phiếu nhập (Map với Backend ImportSlipDetail)
export interface ImportSlipItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Payload gửi lên API tạo phiếu nhập
export interface CreateImportSlipPayload {
  code?: string; // Mã phiếu (tự sinh hoặc nhập tay)
  invoice_total: number;
  items: ImportSlipItem[];
}

// Response của API OCR
export interface OcrResponseData {
  raw_text: string; // Tùy backend trả về 'data' là string hay object
}