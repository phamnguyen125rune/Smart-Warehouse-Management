import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { StockAlertItem } from "../../types/dashboard.types";

interface Props {
  alerts: StockAlertItem[];
}

export default function StockAlertTable({ alerts }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Cảnh báo Tồn kho (Top 5 thấp nhất)
        </h3>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">Sản phẩm</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">SKU</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-center">Tồn kho</TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start">Trạng thái</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {alerts.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="py-3 font-medium text-gray-800 dark:text-white/90">
                  {item.name}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-sm">{item.sku}</TableCell>
                <TableCell className="py-3 text-center">
                  <span className="font-bold text-red-600">{item.current_stock}</span>
                </TableCell>
                <TableCell className="py-3">
                  <Badge size="sm" color={item.status === "Out of Stock" ? "error" : "warning"}>
                    {item.status === "Out of Stock" ? "Hết hàng" : "Sắp hết"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}