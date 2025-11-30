import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { warehouseService } from "../../services/warehouseService";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string; // Tên lấy từ OCR truyền vào
  onSuccess: (newProduct: any) => void;
}

export default function CreateProductModal({ isOpen, onClose, initialName, onSuccess }: CreateProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    quantity_in_stock: 0, // Mặc định 0, sẽ cộng sau khi nhập kho
    standard_price: 0  // [FIX] Đổi tên state
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điền sẵn tên từ OCR khi mở modal
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, name: initialName, sku: "", description: "" }));
    }
  }, [isOpen, initialName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
        ...formData,
        standard_price: Number(formData.standard_price) || 0, // [FIX]
        quantity_in_stock: 0 // Luôn là 0 khi tạo mới
    };

    try {
      // Gọi API tạo sản phẩm (Cần thêm hàm này vào warehouseService)
      // Giả sử API trả về sản phẩm vừa tạo kèm ID

      const res = await warehouseService.createProduct(payload);

      if (res.success) {
        alert("Tạo sản phẩm thành công!");
        onSuccess(res.data); // Trả data về để update bảng
        onClose();
      } else {
        alert(res.error || "Lỗi tạo sản phẩm");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="p-6 bg-white rounded-2xl dark:bg-gray-900">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Thêm sản phẩm mới</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tên sản phẩm</Label>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Tên sản phẩm" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Mã SKU (Tự tạo hoặc để trống)</Label>
                <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="VD: SKU001" />
            </div>
            <div>
                <Label>Giá niêm yết (VND)</Label> {/* [FIX] Đổi label */}
                <Input type="number" name="standard_price" value={formData.standard_price} onChange={handleChange} /> {/* [FIX] Đổi name */}
            </div>
          </div>

          <div>
            <Label>Mô tả</Label>
            <Input name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả ngắn..." />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose} type="button">Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo..." : "Tạo mới"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
