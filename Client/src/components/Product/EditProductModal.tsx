import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { warehouseService } from "../../services/warehouseService";
import { Product } from "../../types/warehouse.types";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void; // Callback để reload list
}

export default function EditProductModal({ isOpen, onClose, product, onSuccess }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    standard_price: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đổ dữ liệu cũ vào form khi mở modal
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name,
        sku: product.sku || "",
        description: product.description || "",
        standard_price: product.standard_price || 0
      });
      setError(null);
    }
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await warehouseService.updateProduct(product.id, formData);
      if (res.success) {
        alert("Cập nhật thành công!");
        onSuccess(); // Reload lại bảng bên ngoài
        onClose();
      } else {
        setError(res.error || "Lỗi cập nhật");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="p-6 bg-white rounded-2xl dark:bg-gray-900">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Chỉnh sửa sản phẩm
        </h3>
        
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tên sản phẩm</Label>
            <Input name="name" value={formData.name} onChange={handleChange} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Mã SKU</Label>
                <Input name="sku" value={formData.sku} onChange={handleChange} />
            </div>
            <div>
                <Label>Giá niêm yết (VND)</Label>
                <Input type="number" name="standard_price" value={formData.standard_price} onChange={handleChange} />
            </div>
          </div>

          <div>
            <Label>Mô tả</Label>
            <Input name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose} type="button">Đóng</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Lưu thay đổi" : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}