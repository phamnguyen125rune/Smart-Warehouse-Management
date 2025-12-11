export default function InfoLegend() {
  return (
    <div className="relative group inline-block ml-2">
      {/* Icon Info kích hoạt Hover */}
      <div className="cursor-help flex items-center justify-center w-5 h-5 rounded-full border border-gray-400 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors">
        <span className="text-xs font-bold">i</span>
      </div>

      {/* Tooltip Content */}
      <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-xl text-xs text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="w-3 h-3 mt-0.5 rounded-full border border-green-400 bg-green-50 flex-shrink-0"></span>
            <div>
                <strong className="text-gray-800 dark:text-white">Mới (New):</strong>
                <p>Chưa có trong kho, cần tạo mới.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-3 h-3 mt-0.5 rounded-full border border-yellow-400 bg-yellow-50 flex-shrink-0"></span>
            <div>
                <strong className="text-gray-800 dark:text-white">Gợi ý (Suggestion):</strong>
                <p>Hệ thống không chắc chắn, cần kiểm tra lại.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-3 h-3 mt-0.5 rounded-full border border-blue-400 bg-blue-50 flex-shrink-0"></span>
            <div>
                <strong className="text-gray-800 dark:text-white">Đã xác nhận:</strong>
                <p>Dữ liệu do bạn vừa chỉnh sửa.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-3 h-3 mt-0.5 rounded-full border border-gray-300 bg-white flex-shrink-0"></span>
            <div>
                <strong className="text-gray-800 dark:text-white">Tự động (Auto):</strong>
                <p>Khớp chính xác (100%).</p>
            </div>
          </div>
        </div>
        
        {/* Mũi tên chỉ lên */}
        <div className="absolute -top-1.5 left-1.5 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45 dark:bg-gray-800 dark:border-gray-700"></div>
      </div>
    </div>
  );
}