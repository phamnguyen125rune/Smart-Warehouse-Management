import { useState, useEffect, useRef } from "react";
import { Product } from "../../../types/warehouse.types";

interface ProductAutocompleteProps {
  products: Product[];
  value: string; // Tên sản phẩm đang chọn
  onSelect: (product: Product) => void;
  placeholder?: string;
}

export default function ProductAutocomplete({ products, value, onSelect, placeholder }: ProductAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Lọc sản phẩm theo tên hoặc SKU
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(inputValue.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(inputValue.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
        placeholder={placeholder || "Tìm kiếm sản phẩm..."}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
      />

      {showDropdown && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          {filtered.map((prod) => (
            <li
              key={prod.id}
              className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center group hover:bg-blue-50
                ${prod.quantity_in_stock <= 0 ? 'opacity-50 grayscale' : ''}
              `}
              onClick={() => {
                if (prod.quantity_in_stock > 0) {
                    onSelect(prod);
                    setShowDropdown(false);
                }
              }}
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">{prod.name}</span>
                <span className="text-[10px] text-gray-500">Tồn: {prod.quantity_in_stock}</span>
              </div>
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {prod.sku}
              </span>
            </li>
          ))}
        </ul>
      )}
      
      {showDropdown && filtered.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 p-2 text-center text-xs text-gray-500 shadow-lg rounded-md">
              Không tìm thấy sản phẩm
          </div>
      )}
    </div>
  );
}