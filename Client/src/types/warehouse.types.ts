// --- 1. CHUNG (COMMON) ---

// Response chuẩn từ API cho mọi request
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// --- 2. SẢN PHẨM (PRODUCT) ---

// Model Sản phẩm (Map với DB MySQL)
export interface Product {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  quantity_in_stock: number;
  
  // [UPDATED] Giá chuẩn/Giá niêm yết (Thay thế last_import_price)
  standard_price: number; 
}

// --- 3. NHẬP KHO (IMPORT SLIP) ---

// Trạng thái của dòng nhập liệu (Dùng cho Smart Table)
export type ItemStatus = 'AUTO' | 'SUGGESTION' | 'NEW' | 'CONFIRMED';

// Item cơ bản (Dùng để gửi lên Backend)
export interface ImportSlipItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  // Optional: gửi kèm cờ này để backend cập nhật giá chuẩn
  update_price?: boolean; 
}

// Item mở rộng cho UI (Kế thừa Item cơ bản + thêm Metadata xử lý giao diện)
export interface ImportSlipItemUI extends ImportSlipItem {
  tempId: number;  // ID tạm để React làm key
  ocrText: string; // Tên gốc từ OCR để hiện Placeholder
  
  // Thông tin sau khi so khớp (Match)
  productId: number | null;
  sku: string;
  productName: string; // Tên chuẩn trong DB

  // Metadata trạng thái
  confidence: number;
  status: ItemStatus; // 'AUTO', 'NEW', 'SUGGESTION', 'CONFIRMED'
  isUserEdited: boolean;

  // Checkbox trên UI
  updatePrice: boolean; 
}

// Payload gửi lên API tạo phiếu nhập (POST /import-slips)
export interface CreateImportSlipPayload {
  code?: string; 
  invoice_total: number;
  items: ImportSlipItem[];
}

// --- 4. XUẤT KHO (EXPORT SLIP) ---

// Item hiển thị trên bảng xuất kho
export interface ExportSlipUIItem {
  tempId?: number; // Dùng cho dòng trống mới thêm
  productId: number;
  name: string;
  quantity: number;
  currentStock: number;
}

// Payload gửi lên API tạo phiếu xuất (POST /export-slips)
export interface CreateExportSlipPayload {
  code?: string;
  reason: string;
  items: {
    product_id: number;
    quantity: number;
    export_price?: number; // Giá xuất (thường lấy từ standard_price)
  }[];
}

// --- 5. OCR ---

// Response của API OCR upload
export interface OcrResponseData {
  raw_text: string;
}