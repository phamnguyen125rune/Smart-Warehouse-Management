import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import InputProducts, { Product } from "../../components/tables/ProductTables/InputProducts";
import ProductInputForm, { NewProductData } from "../../components/form/form-elements/ProductInputForm";
import FileInputExample from "../../components/form/form-elements/FileInputExample";
import { uploadInvoiceImage, saveInvoice } from "../../services/apiService";

// Define a type for the product data that includes an ID for the table

interface OcrApiResponse {
  success: boolean;
  data: string;     // Dữ liệu OCR (luôn là string khi thành công)
  error?: string;    // Lỗi có thể có hoặc không, nên dùng dấu '?'
}

interface SaveInvoiceApiResponse {
  success: boolean;
  message?: string; // Có thành công
  invoice_id?: number; // Có thành công
  error?: string; // Khi thất bại
}

const parseOcrResult = (ocrText: string): NewProductData[] => {
  if (!ocrText) return [];

  const lines = ocrText.trim().split('\n');
  const products: NewProductData[] = [];

  // Bỏ qua dòng tiêu đề đầu tiên (i = 1)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(' ');
    if (parts.length < 4) continue;

    // Lấy các giá trị số từ cuối mảng
    const unitPrice = parseFloat(parts.pop() || '0');
    const amount = parseFloat(parts.pop() || '0'); // Đổi tên từ totalPrice
    const quantity = parseInt(parts.pop() || '0', 10);
    
    // Phần còn lại chính là tên sản phẩm
    const itemName = parts.join(' ');

    if (itemName && !isNaN(quantity) && !isNaN(amount) && !isNaN(unitPrice)) {
      products.push({
        itemName: itemName, // Sửa lại cho nhất quán
        quantity,
        unitPrice: unitPrice,
        amount: amount,
      });
    }
  }

  console.log("Sản phẩm đã được parse từ OCR:", products);

  return products;
};

export default function ProductReceipt() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  //State for error loadding
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await uploadInvoiceImage(file) as OcrApiResponse;

      if (result.success) {
        const parsedProducts = parseOcrResult(result.data);
        
        if (parsedProducts.length === 0) {
          setError("Không thể nhận dạng được sản phẩm nào từ hóa đơn. Vui lòng thử lại hoặc nhập tay.");
        }

        const productsWithId: Product[] = parsedProducts.map(p => ({
          itemName: p.itemName,
          quantity: Number(p.quantity), // Chuyển "" thành 0
          amount: Number(p.amount),     // Chuyển "" thành 0
          unitPrice: Number(p.unitPrice), // Chuyển "" thành 0
          id: Date.now() + Math.random(),
        }));
        
        setProducts(productsWithId);
      } else {
        setError(result.error || "Có lỗi xảy ra khi xử lý ảnh.");
      }
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle adding a new product
  const handleAddProduct = (newProductData: NewProductData) => {
    const sanitizedData = {
      itemName: newProductData.itemName,
      quantity: Number(newProductData.quantity), // Number("") sẽ là 0
      amount: Number(newProductData.amount),
      unitPrice: Number(newProductData.unitPrice),
    };

    const newProduct: Product = {
      ...sanitizedData,
      id: Date.now(),
    };
    setProducts((prevProducts) => [...prevProducts, newProduct]);
  };

  // Chọn.
  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);
  };

  // Chỉnh sửa, và nó được thiết đặt map theo ID.
  const handleEditProduct = (updatedProduct: NewProductData) => {
    // "Dọn dẹp" dữ liệu: chuyển đổi các trường "" thành số 0
    const sanitizedData = {
      itemName: updatedProduct.itemName,
      quantity: Number(updatedProduct.quantity), // Number("") sẽ là 0
      amount: Number(updatedProduct.amount),
      unitPrice: Number(updatedProduct.unitPrice),
    };

    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === selectedProductId
          ? { ...product, ...sanitizedData } // Sử dụng dữ liệu đã được dọn dẹp
          : product
      )
    );
    setSelectedProductId(null); // Bỏ chọn sau khi sửa
  };

  // Gọi hàm xóa
  const handleDeleteProduct = (productId: number) => {
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== productId)
    );
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  };

  // --- Hàm lưu toàn bộ hóa đơn vào CSDL ---
  const handleSaveInvoice = async () => {
    if (products.length === 0) {
      setError("Không có sản phẩm nào để lưu.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const totalAmount = products.reduce((sum, p) => sum + p.amount, 0);
      // Chuẩn bị dữ liệu gửi đi (không cần ID tạm thời của React)
      const invoiceData = {
        invoice_total: totalAmount,
        items: products.map(({ id, ...rest }) => rest) // Bỏ trường 'id'
      };

      const result = await saveInvoice(invoiceData) as SaveInvoiceApiResponse;
      if (result.success) {
        // Xử lý khi thành công: reset state, hiển thị thông báo, v.v.
        alert('Lưu hóa đơn thành công!');
        setProducts([]);
        setSelectedProductId(null);
      } else {
        setError(result.error || 'Lỗi khi lưu hóa đơn.');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearProducts = () => {
    setProducts([]);
    setSelectedProductId(null);
    setError(null);
  };

  // Gom product lại gửi cho ProductInputForm
  const productToEdit = selectedProductId ? products.find(p => p.id === selectedProductId) : null;

  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Nhập kho" />
      <div className="flex flex-col md:flex-row gap-6"> {/* Use flex for side-by-side layout on medium screens and up */}
        <div className="w-full md:w-2/3 space-y-4"> {/* Product Table column */}
          <ComponentCard title="Sản phẩm">
            {products.length > 0 ? (
              // Nếu có sản phẩm, hiển thị các nút và bảng
              <>
                {/* Khu vực chứa 2 nút mới */}
                <div className="flex items-center justify-end gap-3 dark:border-white/[0.05]">
                  {/* Nút 1: Xóa và làm lại */}
                  <button
                    onClick={handleClearProducts}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                    </svg>
                    Dọn dẹp
                  </button>

                  {/* Nút 2: Lưu hóa đơn */}
                  <button
                    onClick={handleSaveInvoice}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                    </svg>
                    {/* Nút cần làm dài dễ tiện cho UX */}
                    Lưu thông tin hóa đơn
                  </button>
                </div>

                <InputProducts products={products} onSelectProduct={handleSelectProduct} />
              </>
            ) : (
              <FileInputExample onFileUpload={handleImageUpload} disabled={isLoading} />
            )}
          </ComponentCard>
        </div>
        {/* Form nhập và chỉnh sửa */}
        <div className="w-full md:w-1/3">
          <ProductInputForm
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct} // Gửi thông tin chỉnh sửa ngược lên cpm cha.
            productToEdit={productToEdit} // Truyền product từ cha xuống.
            onDeleteProduct={handleDeleteProduct}
          />
        </div>
      </div>
    </>
  );
}
