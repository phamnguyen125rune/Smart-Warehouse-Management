import { useState, useEffect, useRef } from "react";
import { Product } from "../../../types/warehouse.types";

// Định nghĩa lại ItemStatus (hoặc import từ types nếu bạn đã define global)
type ItemStatus = 'AUTO' | 'SUGGESTION' | 'NEW' | 'CONFIRMED';

interface SmartProductSelectProps {
  ocrText: string;        // Text gốc từ hóa đơn (Placeholder)
  value: string;          // Tên sản phẩm hiện tại (Đã match hoặc rỗng)
  status: ItemStatus;     // Trạng thái để tô màu
  suggestions: Product[]; // Danh sách toàn bộ sản phẩm để tìm kiếm
  onSelect: (product: Product) => void; // Hàm chạy khi chọn sản phẩm có sẵn
  onCreate: () => void;   // Hàm chạy khi bấm nút (+) tạo mới
}

export default function SmartProductSelect({ 
  ocrText, 
  value, 
  status, 
  suggestions, 
  onSelect, 
  onCreate 
}: SmartProductSelectProps) {
  
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Đồng bộ props vào state (khi cha update dữ liệu, ví dụ sau khi tạo mới xong)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Xử lý Placeholder thông minh
  const getPlaceholder = () => {
      if (value) return ""; // Đã có giá trị -> không hiện placeholder
      if (ocrText) return `OCR: ${ocrText}`; // Có text từ ảnh -> Hiện OCR:...
      return "Gõ để tìm kiếm..."; // Dòng thêm tay -> Gợi ý gõ
  };

  // Logic lọc danh sách (Client-side filtering)
  // Tìm theo Tên hoặc SKU
  const filteredSuggestions = suggestions.filter(p => 
    p.name.toLowerCase().includes(inputValue.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(inputValue.toLowerCase()))
  );

  // Xử lý đóng dropdown khi click ra ngoài (Optional nhưng tốt cho UX)
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Helper lấy màu viền/nền dựa theo trạng thái
  const getStatusClasses = () => {
    switch (status) {
        case 'SUGGESTION': return 'border-yellow-400 bg-yellow-50 focus:ring-yellow-200 text-yellow-900';
        case 'NEW': return 'border-green-400 bg-green-50 focus:ring-green-200 placeholder-green-700';
        case 'CONFIRMED': return 'border-blue-400 bg-blue-50 focus:ring-blue-200 text-blue-900';
        case 'AUTO': return 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200';
        default: return 'border-gray-300';
    }
  };

  return (
    <div className="relative flex items-center gap-2 w-full" ref={wrapperRef}>
      
      {/* 1. Ô Input thông minh (Combobox) */}
      <div className="relative w-full">
        <input
          type="text"
          className={`w-full px-3 py-2 text-sm border rounded-md outline-none transition-all focus:ring-2 ${getStatusClasses()}`}
          placeholder={getPlaceholder()} // [FIX] Dùng hàm này
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />

        {/* Dropdown Gợi ý */}
        {showDropdown && filteredSuggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
            {filteredSuggestions.map((prod) => (
              <li
                key={prod.id}
                className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer flex justify-between items-center group"
                onClick={() => {
                  setInputValue(prod.name); // Điền tên vào ô
                  onSelect(prod); // Báo lên cha
                  setShowDropdown(false);
                }}
              >
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{prod.name}</span>
                    <span className="text-[10px] text-gray-400">{prod.description || 'Không có mô tả'}</span>
                </div>
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded group-hover:bg-white">
                    {prod.sku}
                </span>
              </li>
            ))}
          </ul>
        )}
        
        {/* Dropdown Empty State (Nếu gõ mà ko thấy sp nào) */}
        {showDropdown && inputValue && filteredSuggestions.length === 0 && (
             <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-center">
                 <p className="text-xs text-gray-500 mb-2">Không tìm thấy sản phẩm này trong kho.</p>
                 <button 
                    onClick={onCreate}
                    className="text-xs text-blue-600 hover:underline font-medium"
                 >
                    + Thêm mới ngay
                 </button>
             </div>
        )}
      </div>

      {/* 2. Nút Tạo Mới (+) */}
      {/* Chỉ hiện (enable) khi trạng thái là NEW hoặc khi user đang chủ động tìm kiếm/nhập liệu */}
      <button
        onClick={onCreate}
        // Disable nếu đã Auto match hoặc đã Confirm thủ công (tránh tạo trùng)
        // Trừ khi user xóa text đi (inputValue rỗng) thì cho phép tạo lại
        disabled={(status === 'AUTO' || status === 'CONFIRMED') && !!inputValue} 
        className={`p-2 rounded-md transition-all flex-shrink-0 border ${
          status === 'NEW' || !inputValue
            ? 'bg-green-600 border-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg' 
            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
        }`}
        title="Tạo sản phẩm mới từ thông tin này"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
