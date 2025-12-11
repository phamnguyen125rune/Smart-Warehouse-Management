import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import { ImportSlipItemUI, Product, ItemStatus } from "../../../types/warehouse.types";
import { warehouseService } from "../../../services/warehouseService";
import SmartProductSelect from "../../form/form-elements/SmartProductSelect";

interface InputProductsProps {
  products: ImportSlipItemUI[];
  onUpdateProduct: (tempId: number, updatedData: Partial<ImportSlipItemUI>) => void;
  onRemoveProduct: (tempId: number) => void;
  onOpenCreateModal: (ocrText: string) => void;
  onAddRow: () => void;
  onEditProductPrice: (product: Product) => void;
}

const getItemStatus = (item: ImportSlipItemUI): ItemStatus => {
  if (!item.productId) return 'NEW';
  if (item.isUserEdited) return 'CONFIRMED';
  if (item.confidence >= 0.85) return 'AUTO';
  return 'SUGGESTION';
};

export default function InputProducts({
  products,
  onUpdateProduct,
  onRemoveProduct,
  onOpenCreateModal,
  onAddRow,
  onEditProductPrice
}: InputProductsProps) {

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await warehouseService.getProducts();
        if (res.success) setAllProducts(res.data);
      } catch (e) { console.error(e); }
    };
    fetchProducts();
  }, []);

  const getOriginalProduct = (id: number | null) => {
    if (!id) return null;
    return allProducts.find(p => p.id === id);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex-1 overflow-auto min-h-0 custom-scrollbar relative">
        <Table className="min-w-[1100px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] sticky top-0 bg-gray-50 z-20 shadow-sm">
            <TableRow>
              <TableCell isHeader className="px-4 py-3 w-[100px] text-sm text-gray-500">SKU</TableCell>
              <TableCell isHeader className="px-4 py-3 w-[350px] text-sm text-gray-500">TÊN SẢN PHẨM</TableCell>
              <TableCell isHeader className="px-4 py-3 w-[100px] text-sm text-center text-gray-500">SL NHẬP</TableCell>
              <TableCell isHeader className="px-4 py-3 w-[150px] text-sm text-right text-gray-500">GIÁ NHẬP</TableCell>
              {/* <TableCell isHeader className="px-4 py-3 w-[150px] text-right ">GIÁ NIÊM YẾT</TableCell> */}
              <TableCell isHeader className="px-4 py-3 w-[150px] text-sm text-right text-gray-500">THÀNH TIỀN</TableCell>
              <TableCell isHeader className="px-4 py-3 w-[60px]"> </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {products.map((item) => {
              const status = getItemStatus(item);
              const dbProduct = getOriginalProduct(item.productId);
              
              // [MỚI] Logic tô màu cảnh báo
              // Nếu needsManualCheck = true -> Tô đỏ nhạt để user chú ý
              const rowClass = item.needsManualCheck 
                ? "bg-red-50 hover:bg-red-100/80 border-l-4 border-l-red-500" 
                : "hover:bg-gray-50/50 group";

              return (
                <TableRow key={item.tempId} className={rowClass}>
                  {/* 1. SKU */}
                  <TableCell className="px-4 py-3 text-xs font-mono text-gray-500">
                    {item.sku || '-'}
                  </TableCell>

                  {/* 2. Tên Sản Phẩm */}
                  <TableCell className="px-4 py-3">
                    <SmartProductSelect
                      ocrText={item.ocrText}
                      value={item.productName}
                      status={status}
                      suggestions={allProducts}
                      onSelect={(prod) => onUpdateProduct(item.tempId, {
                        productId: prod.id,
                        sku: prod.sku || '',
                        productName: prod.name,
                        isUserEdited: true
                      })}
                      onCreate={() => onOpenCreateModal(item.ocrText)}
                    />
                  </TableCell>

                  {/* 3. Số Lượng */}
                  <TableCell className="px-4 py-3">
                    <input
                      type="number"
                      className={`w-full text-center border-b outline-none bg-transparent py-1 transition-colors ${item.needsManualCheck ? 'border-red-300 text-red-700 font-bold' : 'border-gray-300 focus:border-blue-500'}`}
                      value={item.quantity}
                      onChange={(e) => onUpdateProduct(item.tempId, { quantity: Number(e.target.value), amount: Number(e.target.value) * item.unitPrice })}
                    />
                  </TableCell>

                  {/* 4. Giá Nhập */}
                  <TableCell className="px-4 py-3">
                    <input
                      type="number"
                      className={`w-full text-right border-b outline-none bg-transparent py-1 transition-colors ${item.needsManualCheck ? 'border-red-300 text-red-700 font-bold' : 'border-gray-300 focus:border-blue-500'}`}
                      value={item.unitPrice}
                      onChange={(e) => onUpdateProduct(item.tempId, { unitPrice: Number(e.target.value), amount: item.quantity * Number(e.target.value) })}
                    />
                  </TableCell>

                  {/* 5. Giá Niêm Yết */}
                  {/* <TableCell className="px-4 py-3 text-right">
                    {dbProduct ? (
                      <button onClick={() => onEditProductPrice(dbProduct)} className="text-sm font-medium text-blue-600 hover:underline flex items-center justify-end w-full gap-1">
                        {(dbProduct.standard_price || 0).toLocaleString('vi-VN')}
                        <span className="opacity-0 group-hover:opacity-100 text-[10px]">✎</span>
                      </button>
                    ) : <span className="text-gray-300 text-xs">-</span>}
                  </TableCell> */}

                  {/* 6. Thành Tiền */}
                  <TableCell className="px-4 py-3 text-right font-medium text-gray-900">
                    {item.amount.toLocaleString('vi-VN')}
                  </TableCell>

                  {/* 7. Xóa */}
                  <TableCell className="px-4 py-3 text-center">
                    <button onClick={() => onRemoveProduct(item.tempId)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50">✕</button>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={7} className="p-2 bg-gray-50/30">
                <button onClick={onAddRow} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium text-sm">
                  + Thêm dòng sản phẩm
                </button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="flex-shrink-0 flex justify-end px-5 py-4 text-gray-800 bg-gray-50 border-t border-gray-200 font-bold text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white">
        Tổng cộng: {products.reduce((sum, p) => sum + p.amount, 0).toLocaleString("vi-VN")} đ
      </div>
    </div>
  );
}