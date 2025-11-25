import { useState } from 'react';
import Button from '../../ui/button/Button';
import Label from '../../form/Label';
import Input from '../../form/input/InputField';

import { Product, ExportSlipUIItem } from '../../../types/warehouse.types';

interface ProductSelectorFormProps {
  allProducts: Product[];
  onAddProduct: (item: ExportSlipUIItem) => void;
}

export default function ProductSelectorForm({ allProducts, onAddProduct }: ProductSelectorFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const handleAdd = () => {
    const pId = Number(selectedProductId);
    const product = allProducts.find(p => p.id === pId);

    if (!product) return;
    if (quantity <= 0) {
      alert("Số lượng phải lớn hơn 0");
      return;
    }

    // [FIX] Map dữ liệu sang chuẩn ExportSlipUIItem (currentStock)
    const itemToAdd: ExportSlipUIItem = {
      productId: product.id,
      name: product.name,
      quantity: quantity,
      currentStock: product.quantity_in_stock // Map quantity_in_stock -> currentStock
    };

    onAddProduct(itemToAdd);
    
    // Reset form
    setQuantity(1);
    setSelectedProductId('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>Chọn sản phẩm</Label>
        <select
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">-- Chọn sản phẩm --</option>
          {allProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Tồn: {p.quantity_in_stock})
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Số lượng xuất</Label>
        <Input
          type="number"
          min={'1'}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>

      <Button onClick={handleAdd} disabled={!selectedProductId}>
        Thêm vào phiếu
      </Button>
    </div>
  );
}