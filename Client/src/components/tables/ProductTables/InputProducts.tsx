import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { ImportSlipItemUI, Product, ItemStatus } from "../../../types/warehouse.types";
import { warehouseService } from "../../../services/warehouseService";
import SmartProductSelect from "../../form/form-elements/SmartProductSelect";

// Helper xác định trạng thái
const getItemStatus = (item: ImportSlipItemUI): ItemStatus => {
  if (!item.productId) return 'NEW';
  if (item.isUserEdited) return 'CONFIRMED';
  if (item.confidence >= 0.85) return 'AUTO';
  return 'SUGGESTION';
};

interface InputProductsProps {
  products: ImportSlipItemUI[];
  // [FIX] Các props mới cho Smart Table (thay vì onSelectProduct cũ)
  onUpdateProduct: (tempId: number, updatedData: Partial<ImportSlipItemUI>) => void;
  onRemoveProduct: (tempId: number) => void;
  onOpenCreateModal: (ocrText: string) => void;
  onAddRow: () => void; // Callback thêm dòng
}

export default function InputProducts({ 
  products, 
  onUpdateProduct, 
  onRemoveProduct,
  onOpenCreateModal,
  onAddRow 
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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] max-h-[500px] overflow-y-auto custom-scrollbar">
      <div className="max-w-full overflow-x-visible pb-4"> 
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] sticky top-0 bg-gray-50 z-10">
            <TableRow>
              <TableCell isHeader className="px-4 py-3 min-w-[100px]">SKU</TableCell>
              <TableCell isHeader className="px-4 py-3 min-w-[300px]">TÊN SẢN PHẨM</TableCell>
              <TableCell isHeader className="px-4 py-3 min-w-[100px] text-center">SL</TableCell>
              <TableCell isHeader className="px-4 py-3 min-w-[120px] text-right">ĐƠN GIÁ</TableCell>
              <TableCell isHeader className="px-4 py-3 min-w-[120px] text-right">THÀNH TIỀN</TableCell>
              <TableCell isHeader className="px-4 py-3 w-[50px]"> </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {products.map((item) => {
              const status = getItemStatus(item);
              return (
                <TableRow key={item.tempId} className="hover:bg-gray-50/50">
                  <TableCell className="px-4 py-3 text-xs font-mono text-gray-500">
                    {item.sku || '-'}
                  </TableCell>

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

                  <TableCell className="px-4 py-3">
                    <input 
                        type="number" 
                        className="w-full text-center border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent py-1"
                        value={item.quantity}
                        onChange={(e) => {
                            const qty = Number(e.target.value);
                            onUpdateProduct(item.tempId, { quantity: qty, amount: qty * item.unitPrice });
                        }}
                    />
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right">
                     <input 
                        type="number" 
                        className="w-full text-right border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent py-1"
                        value={item.unitPrice}
                        onChange={(e) => {
                            const price = Number(e.target.value);
                            onUpdateProduct(item.tempId, { unitPrice: price, amount: item.quantity * price });
                        }}
                    />
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right font-medium text-gray-900">
                    {item.amount.toLocaleString('vi-VN')}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-center">
                    <button 
                        onClick={() => onRemoveProduct(item.tempId)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        ✕
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* [NEW] Dòng nút thêm mới nằm ngay dưới cùng danh sách */}
            <TableRow>
                <TableCell colSpan={6} className="p-2">
                    <button 
                        onClick={onAddRow}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Thêm dòng sản phẩm
                    </button>
                </TableCell>
            </TableRow>

          </TableBody>
        </Table>
      </div>
    </div>
  );
}
