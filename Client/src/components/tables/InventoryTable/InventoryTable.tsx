import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

// Định nghĩa kiểu dữ liệu cho một sản phẩm trong kho
export interface InventoryProduct {
  id: number;
  name: string;
  sku: string | null;
  quantity_in_stock: number;
  description: string | null;
}

interface InventoryTableProps {
  products: InventoryProduct[];
}

export default function InventoryTable({ products }: InventoryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500">
                TÊN SẢN PHẨM
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500">
                MÃ SKU
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center">
                TỒN KHO
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500">
                MÔ TẢ
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                  {product.name}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500">
                  {product.sku || 'N/A'}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90 font-bold text-center">
                  {product.quantity_in_stock}
                </TableCell>
                <TableCell className="px-5 py-4 text-gray-500">
                  {product.description || ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}