import { useState } from 'react';
// *** SỬA Ở ĐÂY: Import các component con trực tiếp ***
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { InventoryProduct } from '../../tables/InventoryTable/InventoryTable';

interface ProductComboboxProps {
  allProducts: InventoryProduct[];
  onProductSelect: (product: InventoryProduct | null) => void;
}

export default function ProductCombobox({ allProducts, onProductSelect }: ProductComboboxProps) {
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [query, setQuery] = useState('');

  const filteredProducts =
    query === ''
      ? allProducts
      : allProducts.filter((product) =>
          product.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        );

  // Hàm này đã được sửa để chấp nhận null
  const handleSelect = (product: InventoryProduct | null) => {
    setSelectedProduct(product);
    onProductSelect(product);
  }

  return (
    <Combobox value={selectedProduct} onChange={handleSelect}>
      <div className="relative mt-1">
        <ComboboxInput
          className="w-full rounded-md border border-gray-300 p-2 pr-10 dark:bg-gray-800 dark:border-gray-700"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(product: InventoryProduct) => product?.name || ''}
          placeholder="Gõ để tìm sản phẩm..."
          autoComplete="off"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
             <path fill="currentColor" d="M10 14.25c-.21 0-.42-.08-.58-.25l-4.5-4.75a.75.75 0 0 1 1.1-1.02L10 12.4l3.98-4.17a.75.75 0 0 1 1.1 1.02l-4.5 4.75c-.16.17-.37.25-.58.25Z"/>
          </svg>
        </ComboboxButton>
        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800">
          {filteredProducts.length === 0 && query !== '' ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
              Không tìm thấy sản phẩm.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ComboboxOption
                key={product.id}
                value={product}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'
                  }`
                }
              >
                {product.name}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}