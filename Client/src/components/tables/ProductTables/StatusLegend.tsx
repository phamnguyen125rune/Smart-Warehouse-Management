export default function StatusLegend() {
  return (
    <div className="block text-xs mb-3 px-1">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-3 h-3 rounded-full border border-green-400 bg-green-50"></span>
        <span className="text-gray-600 dark:text-gray-400">
          <strong>Mới (New):</strong> Chưa có trong kho, cần tạo mới.
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-3 h-3 rounded-full border border-yellow-400 bg-yellow-50"></span>
        <span className="text-gray-600 dark:text-gray-400">
          <strong>Gợi ý (Suggestion):</strong> Ảnh bị mờ hệ thống không chắc chắn, cần kiểm tra lại.
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-3 h-3 rounded-full border border-blue-400 bg-blue-50"></span>
        <span className="text-gray-600 dark:text-gray-400">
          <strong>Đã xác nhận (Confirmed):</strong> Dữ liệu do bạn vừa chỉnh sửa/tạo mới.
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-3 h-3 rounded-full border border-gray-300 bg-white"></span>
        <span className="text-gray-600 dark:text-gray-400">
          <strong>Tự động (Auto):</strong> Khớp chính xác (100%), an toàn để nhập.
        </span>
      </div>
    </div>
  );
}
