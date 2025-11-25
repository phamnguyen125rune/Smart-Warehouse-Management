import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import ProductSelectorForm from '../../components/form/form-elements/ProductSelectorForm';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';
import Button from '../../components/ui/button/Button';

// [NEW] Import Service và Type chuẩn
import { warehouseService } from '../../services/warehouseService';
import { Product, ExportSlipUIItem } from '../../types/warehouse.types';

export default function CreateExportSlipPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [slipItems, setSlipItems] = useState<ExportSlipUIItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await warehouseService.getProducts();
        if (result.success) {
          setAllProducts(result.data);
        } else {
          setError(result.error || 'Không thể tải danh sách sản phẩm.');
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi tải dữ liệu');
      }
    };
    fetchProducts();
  }, []);

  // Xử lý thêm sản phẩm vào danh sách chờ
  const handleAddProductToSlip = (item: ExportSlipUIItem) => {
    setError(null);
    const existingItem = slipItems.find(i => i.productId === item.productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + item.quantity;
      // Validate tồn kho
      if (newQuantity > existingItem.currentStock) {
        setError(`Tổng số lượng xuất (${newQuantity}) vượt quá tồn kho (${existingItem.currentStock}) của sản phẩm ${existingItem.name}.`);
        return;
      }
      setSlipItems(slipItems.map(i => i.productId === item.productId ? { ...i, quantity: newQuantity } : i));
    } else {
      // Validate tồn kho lần đầu
      if (item.quantity > item.currentStock) {
        setError(`Số lượng xuất vượt quá tồn kho (${item.currentStock}).`);
        return;
      }
      setSlipItems([...slipItems, item]);
    }
  };

  const handleRemoveItem = (productId: number) => {
    setSlipItems(slipItems.filter(item => item.productId !== productId));
  };

  // Xử lý nút Tạo phiếu
  const handleCreateSlip = async () => {
    if (slipItems.length === 0) {
      setError('Vui lòng thêm ít nhất một sản phẩm vào phiếu xuất.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // [NEW] Chuẩn bị payload đúng chuẩn interface CreateExportSlipPayload
      const payload = {
        reason: 'Xuất kho bán lẻ', // Có thể thêm input lý do xuất kho ở UI sau này
        items: slipItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          // export_price: ... 
        })),
      };

      const result = await warehouseService.createExportSlip(payload);
      if (result && result.success) {
        alert('Tạo phiếu xuất kho thành công!');
        setSlipItems([]);
        const productRes = await warehouseService.getProducts();
        if (productRes.success) setAllProducts(productRes.data);
      } else {
        setError(result?.error || 'Lỗi khi tạo phiếu xuất.');
      }

    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo phiếu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Xuất kho" description="Quản lý xuất kho" />
      <PageBreadcrumb pageTitle="Tạo Phiếu Xuất Kho" />

      {error && <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full md:w-1/3">
          <ComponentCard title="Chọn sản phẩm">
            {/* Component này cần được update để nhận props chuẩn */}
            <ProductSelectorForm allProducts={allProducts} onAddProduct={handleAddProductToSlip} />
          </ComponentCard>
        </div>

        <div className="w-full md:w-2/3">
          <ComponentCard title="Sản phẩm trong phiếu xuất">
            {slipItems.length > 0 ? (
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableCell isHeader className="px-5 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                        Tên sản phẩm
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">
                        Tồn hiện tại
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">
                        SL Xuất
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {slipItems.map(item => (
                      <TableRow key={item.productId}>
                        <TableCell className="px-5 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 whitespace-nowrap text-center text-gray-500 dark:text-gray-400">
                          {item.currentStock}
                        </TableCell>
                        <TableCell className="px-5 py-4 whitespace-nowrap text-center font-bold text-blue-600">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="px-5 py-4 whitespace-nowrap text-right">
                          <Button variant="outline" size="sm" onClick={() => handleRemoveItem(item.productId)}>
                            Xóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Chưa có sản phẩm nào trong phiếu.</p>
            )}

            {slipItems.length > 0 && (
              <div className="mt-6 flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button onClick={handleCreateSlip} disabled={isLoading}>
                  {isLoading ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
                </Button>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </>
  );
}