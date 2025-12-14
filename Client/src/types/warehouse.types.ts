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
  
  // Giá chuẩn/Giá niêm yết
  standard_price: number;
  
  // Trạng thái bán hàng
  is_active: boolean;
}

// --- 3. NHẬP KHO (IMPORT SLIP) ---

// Trạng thái của dòng nhập liệu
export type ItemStatus = 'AUTO' | 'SUGGESTION' | 'NEW' | 'CONFIRMED';

// Item cơ bản (Dùng để gửi lên Backend)
export interface ImportSlipItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  // Optional: gửi kèm cờ này để backend cập nhật giá chuẩn
  updatePrice?: boolean; 
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
  status: ItemStatus; 
  isUserEdited: boolean;

  // Cờ báo hiệu dòng này cần kiểm tra kỹ (do logic toán sai)
  needsManualCheck?: boolean; 
}

// Payload gửi lên API tạo phiếu nhập (POST /import-slips)
export interface CreateImportSlipPayload {
  code?: string; 
  invoice_total: number;
  items: ImportSlipItem[];
}

// Interface cho phản hồi từ API OCR (Trả về cả items và raw_text)
export interface OCRResponse {
    items: ImportSlipItemUI[];
    raw_text: string;
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
    export_price?: number; 
  }[];
}

// --- 5. OCR ---

export interface OcrResponseData {
  raw_text: string;
}

// --- 6. Xem thông tin phiếu nhập, xuất ---

export interface SlipSummary {
  id: number;
  code: string;
  type: 'IMPORT' | 'EXPORT';
  created_at: string;
  total_amount: number;
  item_count: number;
  note: string;
}

export interface SlipDetailItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface SlipDetail extends SlipSummary {
  items: SlipDetailItem[];
}