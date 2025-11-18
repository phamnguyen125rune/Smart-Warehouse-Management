import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table"; 

export interface Product { // Export the Product interface
  id: number;
  itemName: string;
  quantity: number;
  amount: number;
  unitPrice: number;
}

// Define props for InputProducts component
interface InputProductsProps {
  products: Product[]; // Accept products as a prop
  onSelectProduct: (productId: number) => void; // Function to handle row selection
}

export default function InputProducts({ products, onSelectProduct }: InputProductsProps) { // Destructure products and onSelectProduct props
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] max-h-86 overflow-y-auto"> {/* Applied max-h and overflow-y-auto to the outer container */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Tiêu đề bảng */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                TÊN MẶT HÀNG
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                SỐ LƯỢNG
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                THÀNH TIỀN
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                ĐƠN GIÁ
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Thân bảng */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {products.map((product) => ( // Use products prop
              <TableRow
                key={product.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                onClick={() => onSelectProduct(product.id)}
              >
                {/* Wrap TableCells in a div with onClick */}
                  <TableCell className="px-5 py-4 text-start text-gray-800 dark:text-white/90">
                    {product.itemName}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {product.quantity}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {product.amount.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {product.unitPrice.toLocaleString("vi-VN")}
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Total sum calculation */}
      <div className="flex justify-end px-5 py-4 text-gray-800 dark:text-white/90 font-semibold">
          Tổng cộng: {products.reduce((sum, product) => sum + product.amount, 0).toLocaleString("vi-VN")} {/* Use products prop */}
      </div>
    </div>
  );
}
