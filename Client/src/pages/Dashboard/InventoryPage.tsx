import { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { warehouseService } from "../../services/warehouseService";
import { Product } from "../../types/warehouse.types";
import EditProductModal from "../../components/Product/EditProductModal";
import { removeVietnameseTones } from "../../utils/textUtils";

// --- ICONS ---
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);
const SortIcon = () => (
  <svg className="w-3 h-3 ml-1 inline-block text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15 6H9L12 2ZM12 22L9 18H15L12 22Z" /></svg>
);

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Cố định 10 dòng để không vỡ trang
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  
  // Edit Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // --- ACTIONS ---
  const handleRowClick = (product: Product) => {
      setEditingProduct(product);
      setIsEditOpen(true);
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await warehouseService.getProducts();
      if (response.success) {
        setProducts(response.data);
      } else {
        setError(response.error || 'Không thể tải dữ liệu.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- CORE LOGIC: FILTER & SORT & PAGINATION ---
  const processedData = useMemo(() => {
    let result = [...products];

    // 1. Search
    if (searchTerm) {
        const normalizedTerm = removeVietnameseTones(searchTerm);
        result = result.filter(p => {
            const normalizedName = removeVietnameseTones(p.name);
            const normalizedSKU = removeVietnameseTones(p.sku || "");
            return normalizedName.includes(normalizedTerm) || normalizedSKU.includes(normalizedTerm);
        });
    }

    // 2. Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [products, searchTerm, sortConfig]);

  // 3. Cắt trang (Chỉ lấy 10 dòng cho trang hiện tại)
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  // Reset về trang 1 khi search
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <>
      <PageMeta title="Quản lý kho hàng" description="Danh sách sản phẩm tồn kho" />
      <PageBreadcrumb pageTitle="Quản lý Tồn kho" />

      <ComponentCard title={`Danh sách sản phẩm (${totalItems})`}>

        {/* TOOLBAR */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc SKU..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchProducts} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700">
            Làm mới
          </button>
        </div>

        {/* TABLE CONTENT */}
        {isLoading ? (
          <div className="p-12 flex justify-center text-gray-500">
             <span className="loading-spinner"></span> Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th onClick={() => handleSort('sku')} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">SKU <SortIcon /></th>
                    <th onClick={() => handleSort('name')} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">Tên sản phẩm <SortIcon /></th>
                    <th onClick={() => handleSort('quantity_in_stock')} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">Tồn kho <SortIcon /></th>
                    <th onClick={() => handleSort('standard_price')} className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">Giá niêm yết <SortIcon /></th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {currentTableData.length > 0 ? currentTableData.map((product) => {
                    const isOutOfStock = product.quantity_in_stock === 0;
                    const isLowStock = product.quantity_in_stock > 0 && product.quantity_in_stock <= 10;

                    return (
                      <tr key={product.id} onClick={() => handleRowClick(product)} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400 group-hover:text-blue-600">
                          {product.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isOutOfStock ? (
                            <span className="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">Hết hàng</span>
                          ) : isLowStock ? (
                            <span className="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Sắp hết</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{product.quantity_in_stock}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-200">
                          {(product.standard_price || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400 truncate max-w-[150px]">
                          {product.description || '-'}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                        Không tìm thấy sản phẩm nào khớp với từ khóa "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- PAGINATION (THANH PHÂN TRANG GỌN GÀNG) --- */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:bg-gray-900 dark:border-gray-700 mt-2">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                    Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                    </p>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    {/* Nút Previous */}
                    <button
                        onClick={() => setCurrentPage(c => Math.max(c - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-gray-700 dark:hover:bg-gray-800"
                    >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                    </button>

                    {/* Hiển thị số trang thông minh (Rút gọn nếu quá nhiều trang) */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                        .map((page, index, array) => {
                            // Logic thêm dấu "..." nếu cách quãng
                            const showEllipsis = index > 0 && page - array[index - 1] > 1;
                            return (
                                <div key={page} className="flex">
                                    {showEllipsis && <span className="px-2 py-2 text-gray-400">...</span>}
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold 
                                            ${currentPage === page
                                            ? 'z-10 bg-blue-600 text-white focus:outline-none'
                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                </div>
                            );
                        })}

                    {/* Nút Next */}
                    <button
                        onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-gray-700 dark:hover:bg-gray-800"
                    >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                    </button>
                    </nav>
                </div>
                </div>
            )}

            <EditProductModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} product={editingProduct} onSuccess={fetchProducts} />
          </>
        )}
      </ComponentCard>
    </>
  );
}