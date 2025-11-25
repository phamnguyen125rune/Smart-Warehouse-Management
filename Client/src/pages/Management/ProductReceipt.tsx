import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";

import InputProducts from "../../components/tables/ProductTables/InputProducts";
import ProductInputForm, { NewProductData } from "../../components/form/form-elements/ProductInputForm";
import FileInputExample from "../../components/form/form-elements/FileInputExample";

import { warehouseService } from "../../services/warehouseService";
import { ImportSlipItem, CreateImportSlipPayload } from "../../types/warehouse.types";

export interface UIProduct extends ImportSlipItem {
  tempId: number; // ID tạm thời (timestamp)
}

const parseOcrResult = (ocrText: string): UIProduct[] => {
  if (!ocrText) return [];

  const lines = ocrText.trim().split('\n');
  const products: UIProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(' ');
    if (parts.length < 4) continue;

    const unitPrice = parseFloat(parts.pop() || '0');
    const amount = parseFloat(parts.pop() || '0');
    const quantity = parseInt(parts.pop() || '0', 10);
    const itemName = parts.join(' ');

    if (itemName && !isNaN(quantity) && !isNaN(amount) && !isNaN(unitPrice)) {
      products.push({
        tempId: Date.now() + Math.random(), // Tạo ID ngẫu nhiên
        itemName,
        quantity,
        unitPrice,
        amount,
      });
    }
  }
  return products;
};

export default function ProductReceipt() {
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- XỬ LÝ UPLOAD ẢNH (OCR) ---
  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await warehouseService.uploadInvoice(file);

      if (response.success) {
        // response.data ở đây là string text OCR
        const parsedProducts = parseOcrResult(response.data as unknown as string);
        
        if (parsedProducts.length === 0) {
          setError("Không thể nhận dạng sản phẩm. Vui lòng thử lại hoặc nhập tay.");
        } else {
          setProducts(parsedProducts);
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

  // --- CÁC HÀM CRUD LOCAL (Thêm/Sửa/Xóa trên giao diện) ---
  
  const handleAddProduct = (newProductData: NewProductData) => {
    const newProduct: UIProduct = {
      tempId: Date.now(),
      itemName: newProductData.itemName,
      quantity: Number(newProductData.quantity),
      amount: Number(newProductData.amount),
      unitPrice: Number(newProductData.unitPrice),
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const handleEditProduct = (updatedProduct: NewProductData) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.tempId === selectedProductId
          ? {
              ...p,
              itemName: updatedProduct.itemName,
              quantity: Number(updatedProduct.quantity),
              amount: Number(updatedProduct.amount),
              unitPrice: Number(updatedProduct.unitPrice),
            }
          : p
      )
    );
    setSelectedProductId(null);
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts((prev) => prev.filter((p) => p.tempId !== productId));
    if (selectedProductId === productId) setSelectedProductId(null);
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);
  };

  const handleClearProducts = () => {
    setProducts([]);
    setSelectedProductId(null);
    setError(null);
  };

  // --- LƯU PHIẾU NHẬP KHO (SAVE) ---
  const handleSaveSlip = async () => {
    if (products.length === 0) {
      setError("Không có sản phẩm nào để lưu.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const totalAmount = products.reduce((sum, p) => sum + p.amount, 0);
      
      const payload: CreateImportSlipPayload = {
        code: `IMP-${Date.now()}`, // Tự sinh mã phiếu, tạm thời
        invoice_total: totalAmount,
        items: products.map(p => ({
            itemName: p.itemName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            amount: p.amount
        }))
      };

      const response = await warehouseService.createImportSlip(payload);

      if (response.success) {
        alert('Lưu phiếu nhập kho thành công!');
        handleClearProducts();
      } else {
        setError(response.error || 'Lỗi khi lưu phiếu.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối server.');
    } finally {
      setIsLoading(false);
    }
  };

  const productToEdit = selectedProductId
    ? products.find((p) => p.tempId === selectedProductId)
    : null;

  const mappedProductsForTable: any[] = products.map(p => ({
      ...p,
      id: p.tempId // InputProducts đang dùng key='id'
  }));

  const mappedProductToEditForForm: any = productToEdit ? {
      ...productToEdit,
      id: productToEdit.tempId
  } : null;


  return (
    <>
      <PageMeta title="Nhập kho" description="Nhập kho từ hóa đơn OCR" />
      <PageBreadcrumb pageTitle="Nhập kho" />
      
      {error && (
         <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
            <span className="font-medium">Lỗi!</span> {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3 space-y-4">
          <ComponentCard title="Sản phẩm">
            {products.length > 0 ? (
              <>
                <div className="flex items-center justify-end gap-3 pb-4">
                  <Button variant="outline" size="sm" onClick={handleClearProducts} disabled={isLoading}>
                    Dọn dẹp
                  </Button>
                  <Button size="sm" onClick={handleSaveSlip} disabled={isLoading}>
                    {isLoading ? 'Đang lưu...' : 'Lưu hóa đơn'}
                  </Button>
                </div>
                
                <InputProducts 
                    products={mappedProductsForTable} 
                    onSelectProduct={handleSelectProduct} 
                />
              </>
            ) : (
              <FileInputExample onFileUpload={handleImageUpload} disabled={isLoading} />
            )}
          </ComponentCard>
        </div>

        <div className="w-full md:w-1/3">
          <ProductInputForm
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            productToEdit={mappedProductToEditForForm}
            onDeleteProduct={handleDeleteProduct}
          />
        </div>
      </div>
    </>
  );
}