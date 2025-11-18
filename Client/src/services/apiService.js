import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/imports';

/**
 * Hàm để UPLOAD ẢNH HÓA ĐƠN.
 * @param {File} file - Đối tượng File từ input.
 * @returns {Promise<Object>}
 */
export const uploadInvoiceImage = async (file) => { // TypeScript sẽ là (file: File)
  const formData = new FormData();
  
  // Key 'file' này phải khớp 100% với backend: request.files['file']
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/ocr-upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    if (error.response) {
      throw new Error(error.response.data.error || 'Lỗi từ server');
    } else if (error.request) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra lại.');
    } else {
      throw new Error('Lỗi không xác định khi gửi yêu cầu.');
    }
  }
};

/**
 * Hàm để LƯU HÓA ĐƠN.
 * @param {Object} invoiceData - Dữ liệu hóa đơn.
 * @returns {Promise<Object>}
 */
export const saveInvoice = async (invoiceData) => { // TypeScript sẽ là (invoiceData: any)
  try {
    const response = await axios.post(`${API_URL}/invoices`, invoiceData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lưu hóa đơn:", error);
    if (error.response) {
      throw new Error(error.response.data.error || 'Lỗi từ server khi lưu');
    } else if (error.request) {
      throw new Error('Không thể kết nối đến server.');
    } else {
      throw new Error('Lỗi không xác định khi gửi yêu cầu.');
    }
  }
};