import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import InventoryTable, { InventoryProduct } from "../../components/tables/InventoryTable/InventoryTable";
import { warehouseService } from "../../services/warehouseService";
import { Product } from "../../types/warehouse.types";

export default function InventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await warehouseService.getProducts();

        if (response.success) {
          setProducts(response.data as unknown as InventoryProduct[]);
        } else {
          setError(response.error || 'Không thể tải dữ liệu sản phẩm.');
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi kết nối server.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <PageMeta
        title="Quản lý kho hàng"
        description="Danh sách sản phẩm tồn kho"
      />
      <PageBreadcrumb pageTitle="Quản lý Tồn kho" />

      <ComponentCard title="Danh sách sản phẩm trong kho">
        {isLoading && <p className="p-4 text-gray-500">Đang tải dữ liệu...</p>}
        
        {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                <span className="font-medium">Lỗi!</span> {error}
            </div>
        )}

        {!isLoading && !error && (
          <InventoryTable products={products} />
        )}
      </ComponentCard>
    </>
  );
}