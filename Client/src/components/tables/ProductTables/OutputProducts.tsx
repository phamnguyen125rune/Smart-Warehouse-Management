import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { ExportSlipUIItem, Product } from "../../../types/warehouse.types";
import ProductAutocomplete from "../../form/form-elements/ProductAutocomplete"; // Import component vừa tạo

interface OutputProductsProps {
  items: ExportSlipUIItem[];
  allProducts: Product[];
  onUpdateItem: (productId: number, data: Partial<ExportSlipUIItem>) => void; // Dùng productId làm key
  onRemoveItem: (productId: number) => void;
  onAddRow: () => void;
  onSelectItem: (tempId: number, product: Product) => void; // Hàm chọn sp cho dòng mới
}

export default function OutputProducts({ 
  items, allProducts, onUpdateItem, onRemoveItem, onAddRow, onSelectItem 
}: OutputProductsProps) {

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] max-h-[500px] overflow-y-auto custom-scrollbar">
      <div className="max-w-full overflow-x-visible pb-4"> 
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] sticky top-0 bg-gray-50 z-10">
            <TableRow>
              <TableCell isHeader className="px-4 py-3 min-w-[300px]">TÊN SẢN PHẨM</TableCell>
              <TableCell isHeader className="px-4 py-3 min-w-[100px] text-center">TỒN KHO</TableCell>
              <TableCell isHeader className="px-4 py-3 min-w-[120px] text-center">SL XUẤT</TableCell>
              <TableCell isHeader className="px-4 py-3 w-[50px]"> </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {items.map((item) => {
              // Kiểm tra lỗi tồn kho để tô đỏ
              const isError = item.quantity > item.currentStock;

              return (
                <TableRow key={item.productId || item.tempId} className="hover:bg-gray-50/50">
                  
                  {/* Cột chọn sản phẩm */}
                  <TableCell className="px-4 py-3">
                    <ProductAutocomplete 
                        products={allProducts}
                        value={item.name}
                        onSelect={(prod) => onSelectItem(item.tempId || 0, prod)}
                        placeholder="Chọn sản phẩm xuất kho..."
                    />
                  </TableCell>

                  {/* Cột Tồn kho (Readonly) */}
                  <TableCell className="px-4 py-3 text-center text-gray-500">
                    {item.productId ? item.currentStock : '-'}
                  </TableCell>

                  {/* Cột Số lượng xuất (Editable) */}
                  <TableCell className="px-4 py-3">
                    <div className="relative">
                        <input 
                            type="number" 
                            className={`w-full text-center border-b outline-none bg-transparent py-1 font-bold 
                                ${isError ? 'border-red-500 text-red-600' : 'border-gray-300 focus:border-blue-500 text-blue-600'}`}
                            value={item.quantity}
                            onChange={(e) => onUpdateItem(item.productId, { quantity: Number(e.target.value) })}
                            min={1}
                            disabled={!item.productId} // Chưa chọn sp thì ko cho nhập số
                        />
                        {isError && (
                            <span className="absolute -bottom-5 left-0 w-full text-[10px] text-red-500 text-center">
                                Quá tồn kho!
                            </span>
                        )}
                    </div>
                  </TableCell>

                  {/* Nút Xóa */}
                  <TableCell className="px-4 py-3 text-center">
                    <button 
                        onClick={() => onRemoveItem(item.productId || item.tempId || 0)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        ✕
                    </button>
                  </TableCell>

                </TableRow>
              );
            })}

            {/* Dòng Thêm Mới */}
            <TableRow>
                <TableCell colSpan={4} className="p-2">
                    <button 
                        onClick={onAddRow}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium text-sm"
                    >
                        + Thêm dòng xuất kho
                    </button>
                </TableCell>
            </TableRow>

          </TableBody>
        </Table>
      </div>
    </div>
  );
}