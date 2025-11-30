import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import OutputProducts from '../../components/tables/ProductTables/OutputProducts'; // Import bảng mới

import { warehouseService } from '../../services/warehouseService';
import { Product, ExportSlipUIItem, CreateExportSlipPayload } from '../../types/warehouse.types';

export default function CreateExportSlipPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [slipItems, setSlipItems] = useState<ExportSlipUIItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await warehouseService.getProducts();
        if (result.success) setAllProducts(result.data);
      } catch (err: any) { console.error(err); }
    };
    fetchProducts();
  }, []);

  // 1. Thêm dòng trống
  const handleAddRow = () => {
      setSlipItems(prev => [...prev, {
          tempId: Date.now(),
          productId: 0, // 0 nghĩa là chưa chọn
          name: '',
          quantity: 0,
          currentStock: 0
      }]);
  };

  // 2. Chọn sản phẩm cho dòng
  const handleSelectItem = (tempId: number, product: Product) => {
      // Check trùng: Nếu sp đã có trong list thì cộng dồn số lượng hoặc báo lỗi (ở đây mình báo lỗi cho đơn giản)
      const exists = slipItems.find(i => i.productId === product.id);
      if (exists) {
          alert("Sản phẩm này đã có trong danh sách!");
          return;
      }

      setSlipItems(prev => prev.map(item => {
          // Tìm dòng đang thao tác (dựa vào tempId hoặc productId nếu có)
          const key = item.productId || item.tempId;
          if (key !== tempId) return item;

          return {
              ...item,
              productId: product.id,
              name: product.name,
              currentStock: product.quantity_in_stock,
              quantity: 1, // Reset về 1 khi chọn mới
              tempId: undefined // Xóa tempId vì đã có productId thật
          };
      }));
  };

  // 3. Cập nhật số lượng
  const handleUpdateItem = (productId: number, data: Partial<ExportSlipUIItem>) => {
      setSlipItems(prev => prev.map(item => 
          item.productId === productId ? { ...item, ...data } : item
      ));
  };

  // 4. Xóa dòng
  const handleRemoveItem = (id: number) => {
      setSlipItems(prev => prev.filter(item => (item.productId || item.tempId) !== id));
  };

  // 5. Lưu phiếu
  const handleCreateSlip = async () => {
    // Validate: Loại bỏ dòng trống & Check tồn kho
    const validItems = slipItems.filter(i => i.productId !== 0);
    if (validItems.length === 0) {
        setError('Danh sách xuất kho trống.');
        return;
    }

    // Check tồn kho lần cuối
    const invalidStock = validItems.find(i => i.quantity > i.currentStock);
    if (invalidStock) {
        setError(`Sản phẩm "${invalidStock.name}" xuất quá tồn kho!`);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateExportSlipPayload = {
        reason: 'Xuất kho',
        items: validItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        })),
      };

      const result = await warehouseService.createExportSlip(payload);
      if (result && result.success) {
        alert('Xuất kho thành công!');
        setSlipItems([]);
        // Reload lại tồn kho mới
        const productRes = await warehouseService.getProducts();
        if (productRes.success) setAllProducts(productRes.data);
      } else {
        setError(result?.error || 'Lỗi tạo phiếu.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Xuất kho" description="" />
      <PageBreadcrumb pageTitle="Tạo Phiếu Xuất Kho" />

      {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

      <div className="flex flex-col gap-6">
        <ComponentCard title="Danh sách xuất kho">
            {/* Nếu list trống thì tự động thêm 1 dòng đầu tiên cho user đỡ phải bấm */}
            {/* Tuy nhiên để nhất quán logic, ta hiển thị bảng rỗng với nút thêm */}
            
            <div className="flex justify-end gap-3 mb-4">
                <Button variant="outline" size="sm" onClick={() => setSlipItems([])}>Làm mới</Button>
                <Button size="sm" onClick={handleCreateSlip} disabled={isLoading}>
                    {isLoading ? "Đang xử lý..." : "Xác nhận Xuất kho"}
                </Button>
            </div>

            <OutputProducts 
                items={slipItems}
                allProducts={allProducts}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
                onAddRow={handleAddRow}
                onSelectItem={handleSelectItem}
            />
        </ComponentCard>
      </div>
    </>
  );
}