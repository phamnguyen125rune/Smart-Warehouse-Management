import { useState, useEffect } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import Button from "../../ui/button/Button";

export interface NewProductData {
  itemName: string;
  quantity: number | "";
  amount: number | "";
  unitPrice: number | "";
}

interface ProductInputFormProps {
  onAddProduct: (product: NewProductData) => void;
  productToEdit: (NewProductData & { id: number }) | null | undefined;
  onEditProduct: (updatedProduct: NewProductData) => void;
  onDeleteProduct: (productId: number) => void;
}

interface FormErrors {
  itemName?: string;
  quantity?: string;
  amount?: string;
  unitPrice?: string;
}

const initialFormState: NewProductData = {
  itemName: "",
  quantity: "",
  amount: "",
  unitPrice: "",
};

export default function ProductInputForm({ onAddProduct, productToEdit, onEditProduct, onDeleteProduct }: ProductInputFormProps) { // Destructure onDeleteProduct
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});

  // Effect to populate form when productToEdit changes
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        itemName: productToEdit.itemName,
        quantity: productToEdit.quantity,
        amount: productToEdit.amount,
        unitPrice: productToEdit.unitPrice,
      });
    } else {
      // Reset form if no product is being edited
      setFormData(initialFormState);
    }
  }, [productToEdit]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.itemName) {
      newErrors.itemName = "Tên mặt hàng là bắt buộc.";
    }
    if (!formData.quantity) {
      newErrors.quantity = "Số lượng là bắt buộc.";
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = "Số lượng phải là một số dương.";
    }
    if (!formData.amount) {
      newErrors.amount = "Thành tiền là bắt buộc.";
    } else if (isNaN(Number(formData.amount))) {
      newErrors.amount = "Thành tiền phải là một con số.";
    }
    if (!formData.unitPrice) {
      newErrors.unitPrice = "Đơn giá là bắt buộc.";
    } else if (isNaN(Number(formData.unitPrice))) {
      newErrors.unitPrice = "Đơn giá phải là một con số.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let processedValue: string | number;
    if (name === 'quantity' || name === 'amount' || name === 'unitPrice') {
      processedValue = value === '' ? '' : Number(value);
    } else {
      processedValue = value;
    }

    const updatedFormData = {
      ...formData,
      [name]: processedValue,
    };

    if (name === "quantity" || name === "unitPrice") {
      const quantity = Number(updatedFormData.quantity);
      const unitPrice = Number(updatedFormData.unitPrice);

      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        updatedFormData.amount = quantity * unitPrice;
      }
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateForm()) {
      if (productToEdit) {
        onEditProduct({
          ...formData,
          quantity: Number(formData.quantity),
          amount: Number(formData.amount),
          unitPrice: Number(formData.unitPrice),
        });
      } else {
        onAddProduct({
          ...formData,
          quantity: Number(formData.quantity),
          amount: Number(formData.amount),
          unitPrice: Number(formData.unitPrice),
        });
      }
      setFormData(initialFormState);
      setErrors({});
    }
  };

  const buttonText = productToEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm";

  return (
    <ComponentCard title={productToEdit ? "Cập nhật thông tin sản phẩm" : "Nhập thông tin sản phẩm"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemName">Tên mặt hàng</Label>
            <Input
              type="text"
              id="itemName"
              name="itemName"
              placeholder="Tên sản phẩm..."
              value={formData.itemName}
              onChange={handleInputChange}
            />
            {errors.itemName && <p className="mt-1 text-xs text-red-500">{errors.itemName}</p>}
          </div>
          <div>
            <Label htmlFor="quantity">Số lượng</Label>
            <Input
              type="number"
              id="quantity"
              name="quantity"
              placeholder="Số lượng"
              value={formData.quantity}
              onChange={handleInputChange}
            />
            {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
          </div>
          <div>
            <Label htmlFor="amount">Thành tiền</Label>
            <Input
              type="number"
              id="amount"
              name="amount"
              placeholder="Ví dụ: 710000"
              value={formData.amount}
              onChange={handleInputChange}
            />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
          </div>
          <div>
            <Label htmlFor="unitPrice">Đơn giá</Label>
            <Input
              type="number"
              id="unitPrice"
              name="unitPrice"
              placeholder="Ví dụ: 71000"
              value={formData.unitPrice}
              onChange={handleInputChange}
            />
            {errors.unitPrice && <p className="mt-1 text-xs text-red-500">{errors.unitPrice}</p>}
          </div>
          <div className="flex items-center justify-between space-x-4 pt-2">
            {productToEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onDeleteProduct(productToEdit.id)}
                className="flex-shrink-0"
              >
                Xóa
              </Button>
            )}
            <Button type="submit" className="flex-grow">
              {buttonText}
            </Button>
          </div>
        </div>
      </form>
    </ComponentCard>
  );
}
