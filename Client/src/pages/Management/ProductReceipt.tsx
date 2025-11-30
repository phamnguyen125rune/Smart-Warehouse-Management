import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";

import InputProducts from "../../components/tables/ProductTables/InputProducts";
import FileInputExample from "../../components/form/form-elements/FileInputExample";
// Import Modal tạo sản phẩm mới
import CreateProductModal from "../../components/Product/CreateProductModal";

import { warehouseService } from "../../services/warehouseService";
// Import đầy đủ Type
import { ImportSlipItemUI, CreateImportSlipPayload, ItemStatus } from "../../types/warehouse.types";

import StatusLegend from "../../components/tables/ProductTables/StatusLegend";

export default function ProductReceipt() {
  // [FIX] State dùng ImportSlipItemUI chuẩn (không cần interface UIProduct nội bộ nữa)
  const [products, setProducts] = useState<ImportSlipItemUI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ocrTextForCreate, setOcrTextForCreate] = useState("");

  // [NEW] Hàm thêm dòng thủ công
  const handleAddManualRow = () => {
      const newRow: ImportSlipItemUI = {
          tempId: Date.now(), // Tạo ID tạm
          ocrText: "", // Không có text OCR
          
          productId: null,
          productName: "",
          sku: "",
          itemName: "", // Thêm itemName
          
          quantity: 1, // Mặc định số lượng là 1
          unitPrice: 0,
          amount: 0,
          
          confidence: 1.0, // Tin tưởng tuyệt đối vì user tự thêm
          status: 'NEW', // Mặc định là Mới (chưa có ID) -> Màu xanh lá
          isUserEdited: true, // Đánh dấu là do user can thiệp
          updatePrice: false
      };
      
      setProducts(prev => [...prev, newRow]);
  };

  // --- 1. UPLOAD & PARSE ---
  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      // Server trả về list item đã được parse và match thông minh
      const response = await warehouseService.uploadInvoice(file);

      if (response.success) {
        const smartItems = response.data as unknown as ImportSlipItemUI[];
        if (smartItems.length === 0) {
          setError("Không nhận dạng được sản phẩm nào.");
        } else {
          setProducts(smartItems);
        }
      } else {
        setError(response.error || "Lỗi xử lý ảnh.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối server.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. CÁC HÀM XỬ LÝ DÒNG (Inline Editing) ---

  // [FIX] Thay thế handleEditProduct cũ
  const handleUpdateRow = (tempId: number, updatedData: Partial<ImportSlipItemUI>) => {
    setProducts(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      return { ...item, ...updatedData };
    }));
  };

  // [FIX] Thay thế handleDeleteProduct cũ
  const handleRemoveRow = (tempId: number) => {
    setProducts(prev => prev.filter(p => p.tempId !== tempId));
  };

  const handleOpenCreateModal = (ocrText: string) => {
    setOcrTextForCreate(ocrText);
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = (newProduct: any) => {
    // Tìm dòng nào khớp OCR -> Update thành sản phẩm mới tạo
    setProducts(prev => prev.map(item => {
      if (item.ocrText === ocrTextForCreate) {
        return {
          ...item,
          productId: newProduct.id,
          productName: newProduct.name,
          sku: newProduct.sku,
          isUserEdited: true // Chuyển màu xanh dương (Confirmed)
        };
      }
      return item;
    }));
    setIsCreateModalOpen(false);
  };

  // --- 3. LƯU PHIẾU (SAVE) ---
  const handleSaveSlip = async () => {
    // Validate: Chặn nếu còn dòng 'NEW' (chưa có ID)
    const hasNewItems = products.some(p => !p.productId);
    if (hasNewItems) {
      setError("Vui lòng xử lý các dòng Mới (Màu xanh lá) trước khi nhập kho.");
      return;
    }

    setIsLoading(true);
    try {
      const totalAmount = products.reduce((sum, p) => sum + p.amount, 0);

      const payload: CreateImportSlipPayload = {
        code: `IMP-${Date.now()}`,
        invoice_total: totalAmount,
        items: products.map(p => ({
          itemName: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          amount: p.amount
        }))
      };

      const response = await warehouseService.createImportSlip(payload);
      if (response.success) {
        alert('Lưu phiếu thành công!');
        setProducts([]);
      } else {
        setError(response.error || 'Lỗi lưu phiếu.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Nhập kho thông minh" description="" />
      <PageBreadcrumb pageTitle="Nhập kho từ Hóa đơn" />

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Chỉ dùng 1 Card full-width vì bảng Smart Table đã tích hợp chức năng edit */}
        <ComponentCard title="Kiểm tra & Nhập liệu">
          {products.length > 0 ? (
            <>
              <div className="flex justify-end gap-3 mb-4">
                <Button variant="outline" size="sm" onClick={() => setProducts([])} disabled={isLoading}>
                  Làm lại
                </Button>
                <Button size="sm" onClick={handleSaveSlip} disabled={isLoading}>
                  {isLoading ? "Đang lưu..." : "Hoàn tất nhập kho"}
                </Button>
              </div>

              {/* Truyền props đúng chuẩn mới */}
              <InputProducts
                products={products}
                onUpdateProduct={handleUpdateRow}
                onRemoveProduct={handleRemoveRow}
                onOpenCreateModal={handleOpenCreateModal}
                onAddRow={handleAddManualRow} // [NEW] Truyền hàm xuống
              />
              <StatusLegend />

            </>
          ) : (
            // Logic hiển thị FileInputExample nếu chưa có sản phẩm nào
            <div className="flex flex-col gap-4">
                    <FileInputExample onFileUpload={handleImageUpload} disabled={isLoading} />
                    
                    <div className="text-center text-sm text-gray-500">Hoặc</div>
                    
                    <div className="flex justify-center">
                        <Button variant="outline" onClick={handleAddManualRow}>
                            Tạo phiếu nhập thủ công
                        </Button>
                    </div>
                </div>
          )}
        </ComponentCard>
      </div>

      {/* Modal Tạo Mới */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialName={ocrTextForCreate}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
