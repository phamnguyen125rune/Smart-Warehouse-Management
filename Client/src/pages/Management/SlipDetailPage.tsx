import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print"; // [QUAN TRỌNG]
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { warehouseService } from "../../services/warehouseService";
import { SlipDetail } from "../../types/warehouse.types";
import { format } from "date-fns";

export default function SlipDetailPage() {
  const { type, id } = useParams(); // Lấy params từ URL
  const navigate = useNavigate();
  const [slip, setSlip] = useState<SlipDetail | null>(null);
  
  // Ref dùng để chỉ định vùng sẽ in
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type && id) {
        warehouseService.getSlipDetail(type, Number(id)).then(res => {
            if (res.success) setSlip(res.data);
        });
    }
  }, [type, id]);

  // Hook in ấn
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: slip ? `${slip.code}_Invoice` : 'Invoice',
  });

  if (!slip) return <div className="p-6">Đang tải...</div>;

  return (
    <>
      <PageMeta title={`Chi tiết phiếu ${slip.code}`} description="" />
      
      {/* THANH CÔNG CỤ (Không bị in ra) */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
            ← Quay lại
        </Button>
        <div className="flex gap-3">
            {/* Nút này sẽ gọi lệnh in trình duyệt -> Lưu PDF */}
            <Button onClick={() => handlePrint && handlePrint()}>
                In Hóa Đơn / Lưu PDF
            </Button>
        </div>
      </div>

      {/* KHU VỰC HIỂN THỊ HÓA ĐƠN (Sẽ được in) */}
      <div className="flex justify-center">
          <div 
            ref={componentRef} 
            className="w-[210mm] min-h-[297mm] bg-white p-10 shadow-lg text-gray-800 border border-gray-200 print:shadow-none print:border-none"
            style={{ fontFamily: 'Times New Roman, serif' }} // Font chữ kiểu văn bản hành chính
          >
              {/* HEADER HÓA ĐƠN */}
              <div className="flex justify-between items-start mb-8">
                  <div>
                      <h1 className="text-2xl font-bold uppercase mb-1">CÔNG TY KHO VẬN THÔNG MINH</h1>
                      <p className="text-sm">Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
                      <p className="text-sm">Hotline: 1900 1000</p>
                  </div>
                  <div className="text-right">
                      <h2 className="text-xl font-bold uppercase text-blue-800">
                          {slip.type === 'IMPORT' ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO'}
                      </h2>
                      <p className="font-mono text-lg mt-1">#{slip.code}</p>
                      <p className="text-sm mt-1">Ngày: {format(new Date(slip.created_at), 'dd/MM/yyyy')}</p>
                  </div>
              </div>

              {/* THÔNG TIN */}
              <div className="mb-6 pb-6 border-b border-gray-300">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <span className="font-bold">Người lập:</span> Admin <br/>
                          <span className="font-bold">Kho:</span> Kho Tổng
                      </div>
                      <div className="text-right">
                          <span className="font-bold">Lý do/Ghi chú:</span> <br/>
                          {slip.note}
                      </div>
                  </div>
              </div>

              {/* BẢNG SẢN PHẨM */}
              <table className="w-full mb-8 border-collapse">
                  <thead>
                      <tr className="bg-gray-100 border-y border-gray-800">
                          <th className="py-2 px-2 text-left w-10 border-r border-gray-300">STT</th>
                          <th className="py-2 px-2 text-left border-r border-gray-300">Mặt hàng</th>
                          <th className="py-2 px-2 text-left w-24 border-r border-gray-300">Mã SKU</th>
                          <th className="py-2 px-2 text-center w-20 border-r border-gray-300">SL</th>
                          <th className="py-2 px-2 text-right w-32 border-r border-gray-300">Đơn giá</th>
                          <th className="py-2 px-2 text-right w-36">Thành tiền</th>
                      </tr>
                  </thead>
                  <tbody>
                      {slip.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-300">
                              <td className="py-3 px-2 text-center border-r border-gray-300">{index + 1}</td>
                              <td className="py-3 px-2 font-semibold border-r border-gray-300">{item.product_name}</td>
                              <td className="py-3 px-2 font-mono text-sm border-r border-gray-300">{item.sku}</td>
                              <td className="py-3 px-2 text-center border-r border-gray-300">{item.quantity}</td>
                              <td className="py-3 px-2 text-right border-r border-gray-300">{item.unit_price.toLocaleString('vi-VN')}</td>
                              <td className="py-3 px-2 text-right">{item.amount.toLocaleString('vi-VN')}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>

              {/* TỔNG CỘNG */}
              <div className="flex justify-end mb-12">
                  <div className="w-1/2">
                      <div className="flex justify-between py-2 border-b border-gray-300">
                          <span>Cộng tiền hàng:</span>
                          <span className="font-bold">{slip.total_amount.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between py-2 text-xl font-bold mt-2">
                          <span>TỔNG THANH TOÁN:</span>
                          <span className="text-blue-800">{slip.total_amount.toLocaleString('vi-VN')} đ</span>
                      </div>
                  </div>
              </div>

              {/* CHỮ KÝ */}
              <div className="grid grid-cols-3 gap-4 text-center mt-10">
                  <div>
                      <p className="font-bold mb-10">Người lập phiếu</p>
                      <p className="italic text-sm">(Ký, họ tên)</p>
                  </div>
                  <div>
                      <p className="font-bold mb-10">Thủ kho</p>
                      <p className="italic text-sm">(Ký, họ tên)</p>
                  </div>
                  <div>
                      <p className="font-bold mb-10">Giám đốc</p>
                      <p className="italic text-sm">(Ký, họ tên)</p>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
}