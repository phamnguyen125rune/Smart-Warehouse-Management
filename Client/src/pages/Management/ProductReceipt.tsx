import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import InputProducts from "../../components/tables/ProductTables/InputProducts";
import FileInputExample from "../../components/form/form-elements/FileInputExample";
import CreateProductModal from "../../components/Product/CreateProductModal";
import EditProductModal from "../../components/Product/EditProductModal";
import InfoLegend from "../../components/tables/ProductTables/InfoLegend";
import { warehouseService } from "../../services/warehouseService";
import { ImportSlipItemUI, CreateImportSlipPayload, Product, OCRResponse } from "../../types/warehouse.types";
import toast from "react-hot-toast";

// ICON COMPONENTS NHANH, siêng thì bở lại phía icon
const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const ChevronUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);
const TerminalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
);

export default function ProductReceipt() {
    const [products, setProducts] = useState<ImportSlipItemUI[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State lưu URL ảnh preview
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    // State lưu raw text để debug
    const [debugRawText, setDebugRawText] = useState<string | null>(null);

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [ocrTextForCreate, setOcrTextForCreate] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    // [STATE Quản lí đóng mở
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(true); // Mặc định mở
    const [isDebugOpen, setIsDebugOpen] = useState(false);    // Mặc định đóng

    // --- 1. UPLOAD & PARSE ---
    const handleImageUpload = async (file: File) => {
        setIsLoading(true);
        // setError(null);
        setDebugRawText(null);
        const toastId = toast.loading("Đang phân tích hóa đơn...");

        const previewUrl = URL.createObjectURL(file);
        setImagePreviewUrl(previewUrl);

        try {
            const response = await warehouseService.uploadInvoice(file);
            
            // [DEBUG] In toàn bộ phản hồi từ Server ra Console của trình duyệt (F12)
            console.log("Server Response:", response);

            if (response.success) {
                const data = response.data as any; 
                
                // [FIX] Nếu raw_text rỗng, ta gán một câu thông báo để khung debug vẫn hiện ra
                const rawTextFromAI = data.raw_text;
                if (!rawTextFromAI || rawTextFromAI.trim() === "") {
                    setDebugRawText("AI trả về chuỗi rỗng. Có thể do lỗi Model hoặc đường dẫn ảnh.");
                } else {
                    setDebugRawText(rawTextFromAI);
                }
                
                const smartItems = data.items || [];
                
                if (smartItems.length === 0) {
                    toast.error("Không tìm thấy sản phẩm nào!", { id: toastId });
                    setProducts([]);
                } else {
                    toast.success(`Tìm thấy ${smartItems.length} sản phẩm`, { id: toastId });
                    setProducts(smartItems);
                }
            } else {
                toast.error(response.error || "Lỗi xử lý ảnh.", { id: toastId });
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Lỗi kết nối server.", { id: toastId });
        } finally {
            setIsLoading(false);
            toast.dismiss(toastId);
        }
    };

    useEffect(() => {
        return () => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]);


    const handleOpenEditPrice = (product: Product) => {
        setProductToEdit(product);
        setIsEditModalOpen(true);
    };
    const handleEditSuccess = () => {
        window.location.reload();
    };

    // --- CÁC HÀM XỬ LÝ  ---
    const handleUpdateRow = (tempId: number, updatedData: Partial<ImportSlipItemUI>) => {
        setProducts(prev => prev.map(item => item.tempId !== tempId ? item : { 
            ...item, 
            ...updatedData,
            needsManualCheck: false 
        }));
    };

    const handleRemoveRow = (tempId: number) => {
        setProducts(prev => prev.filter(p => p.tempId !== tempId));
    };

    const handleOpenCreateModal = (ocrText: string) => {
        setOcrTextForCreate(ocrText);
        setIsCreateModalOpen(true);
    };

    const handleCreateSuccess = (newProduct: any) => {
        setProducts(prev => prev.map(item => {
            if (item.ocrText === ocrTextForCreate) {
                return {
                    ...item,
                    productId: newProduct.id,
                    productName: newProduct.name,
                    sku: newProduct.sku,
                    isUserEdited: true
                };
            }
            return item;
        }));
        setIsCreateModalOpen(false);
    };

    const handleAddManualRow = () => {
        const newRow: ImportSlipItemUI = {
            tempId: Date.now(),
            ocrText: "",
            productId: null, productName: "", sku: "", itemName: "",
            quantity: 1, unitPrice: 0, amount: 0,
            confidence: 1.0, status: 'NEW', isUserEdited: true, updatePrice: false,
            needsManualCheck: false
        };
        setProducts(prev => [...prev, newRow]);
    };

    const handleClearAll = () => {
        setProducts([]);
        setImagePreviewUrl(null);
        setError(null);
        setDebugRawText(null);
    };

    // --- SAVE ---
    const handleSaveSlip = async () => {
        const hasUnresolvedItems = products.some(p => !p.productId);
        const hasInvalidItems = products.some(p => p.needsManualCheck || p.amount === 0);

        if (hasUnresolvedItems) {
            toast.error("Vui lòng xử lý các dòng màu xanh lá trước.");
            return;
        }
        if (hasInvalidItems) {
            toast.error("Có dòng bị sai tiền hoặc logic. Vui lòng kiểm tra lại.");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Đang lưu phiếu nhập...");
        try {
            const totalAmount = products.reduce((sum, p) => sum + p.amount, 0);
            const payload: CreateImportSlipPayload = {
                code: `IMP-${Date.now()}`,
                invoice_total: totalAmount,
                items: products.map(p => ({
                    itemName: p.productName,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    amount: p.amount,
                    updatePrice: p.updatePrice
                }))
            };

            const response = await warehouseService.createImportSlip(payload);
            if (response.success) {
                toast.success("Nhập kho thành công!", { id: toastId });
                handleClearAll();
            } else {
                toast.error(response.error || 'Lỗi lưu phiếu.', { id: toastId });
            }
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const cardClass = "flex flex-col h-full rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]";
    const cardHeaderClass = "flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.05] flex-shrink-0";
    const collapsibleHeaderClass = "flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.05] flex-shrink-0 cursor-pointer hover:bg-gray-50/50 transition-colors select-none";
    return (
        <>
            <PageMeta title="Nhập kho thông minh" description="Nhập kho từ hóa đơn OCR" />
            <PageBreadcrumb pageTitle="Nhập kho từ Hóa đơn" />

            {/* KHUNG DEBUG AI */}
            {debugRawText && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden shadow-sm">
                    {/* Header Debug - Click để mở */}
                    <div 
                        onClick={() => setIsDebugOpen(!isDebugOpen)}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${isDebugOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                <TerminalIcon />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-white">AI Analysis Log</h4>
                                <p className="text-xs text-gray-500">Raw output từ mô hình OCR</p>
                            </div>
                        </div>
                        <div className="text-gray-400">
                            {isDebugOpen ? <ChevronUp /> : <ChevronDown />}
                        </div>
                    </div>

                    {/* Content Debug - Ẩn hiện theo state */}
                    {isDebugOpen && (
                        <div className="p-0 bg-[#1e1e1e]">
                            <pre className="p-4 text-xs font-mono text-gray-400 whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                                {debugRawText}
                            </pre>
                        </div>
                    )}
                </div>
            )}      

            <div className="flex flex-col h-[calc(100vh-130px)] gap-6 overflow-hidden">
                {products.length > 0 ? (
                    <div className="flex flex-1 gap-6 overflow-hidden h-full">
                        {/* CỘT TRÁI: ẢNH */}
                        {imagePreviewUrl && (
                            <div className={`flex flex-col transition-all duration-300 ease-in-out ${isInvoiceOpen ? 'w-1/3 min-w-[300px]' : 'w-[60px] min-w-[60px]'}`}>
                                <div className={cardClass}>
                                    {/* Header - Bấm vào để đóng/mở */}
                                    <div className={collapsibleHeaderClass} onClick={() => setIsInvoiceOpen(!isInvoiceOpen)} title={isInvoiceOpen ? "Thu gọn" : "Mở rộng"}>
                                        {isInvoiceOpen ? (
                                            <h3 className="font-semibold text-gray-800 dark:text-white/90">Hóa đơn gốc</h3>
                                        ) : (
                                            <div className="flex justify-center w-full"></div> // Icon khi đóng
                                        )}
                                        <div className="text-gray-400">
                                            {isInvoiceOpen ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                    </div>

                                    {/* Nội dung ảnh - Chỉ hiện khi mở */}
                                    {isInvoiceOpen && (
                                        <div className="flex-1 overflow-auto bg-gray-100 relative min-h-0 m-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                            <ZoomableImage src={imagePreviewUrl} />
                                        </div>
                                    )}
                                    
                                    {/* Khi đóng, hiện thanh dọc để biết đây là chỗ chứa ảnh */}
                                    {!isInvoiceOpen && (
                                        <div 
                                            className="flex-1 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                                            onClick={() => setIsInvoiceOpen(true)}
                                        >
                                            <span className="writing-vertical text-gray-400 text-sm font-medium rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                                Bấm để xem ảnh
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* CỘT PHẢI: BẢNG */}
                        <div className="flex-1 h-full flex flex-col min-w-0">
                            <div className={cardClass}>
                                <div className={cardHeaderClass}>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-800 dark:text-white/90">Dữ liệu</h3>
                                        <InfoLegend />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleClearAll} disabled={isLoading}>Hủy bỏ</Button>
                                        <Button size="sm" onClick={handleSaveSlip} disabled={isLoading}>
                                            {isLoading ? "Đang lưu..." : "Hoàn tất"}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 p-3 min-h-0 p-0 overflow-hidden flex flex-col">
                                    <InputProducts
                                        products={products}
                                        onUpdateProduct={handleUpdateRow}
                                        onRemoveProduct={handleRemoveRow}
                                        onOpenCreateModal={handleOpenCreateModal}
                                        onAddRow={handleAddManualRow}
                                        onEditProductPrice={handleOpenEditPrice}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 h-full">
                        <div className={`${cardClass} justify-center items-center relative`}>
                            
                            {/* [LOADING SPINNER] Logic hiển thị Loading tại đây */}
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center animate-in fade-in duration-300">
                                    {/* Vòng tròn xoay */}
                                    <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                    
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Đang phân tích hóa đơn...</h3>
                                    <p className="text-sm text-gray-500 mt-2 animate-pulse">AI đang đọc ảnh, vui lòng đợi trong giây lát</p>
                                </div>
                            ) : (
                                /* Giao diện Upload bình thường */
                                <div className="w-full p-6">
                                    <h3 className="text-center text-xl font-semibold mb-6 text-gray-800 dark:text-white">Tải lên hóa đơn</h3>
                                    <FileInputExample onFileUpload={handleImageUpload} disabled={isLoading} />
                                    <div className="text-center text-sm text-gray-500 font-medium my-4">HOẶC</div>
                                    <div className="flex justify-center">
                                        <Button variant="outline" onClick={handleAddManualRow} className="px-8 py-3">
                                            + Tạo phiếu nhập thủ công
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                initialName={ocrTextForCreate}
                onSuccess={handleCreateSuccess}
            />
            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                product={productToEdit}
                onSuccess={handleEditSuccess}
            />
        </>
    );
}

const ZoomableImage = ({ src }: { src: string }) => {
  const [transformStyle, setTransformStyle] = useState({});
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setTransformStyle({ transformOrigin: `${x}% ${y}%`, transform: "scale(2.5)" });
  };
  return (
    <div className="overflow-hidden w-full h-full flex items-center justify-center cursor-zoom-in rounded-lg"
      onMouseMove={handleMouseMove} onMouseLeave={() => setTransformStyle({ transformOrigin: "center center", transform: "scale(1)" })}>
      <img src={src} alt="Invoice Preview" className="w-full h-auto object-contain transition-transform duration-200 ease-out" style={transformStyle} />
    </div>
  );
};