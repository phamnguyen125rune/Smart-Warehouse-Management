import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Lấy URL từ .env (VITE_API_BASE_URL=http://localhost:5000)
const baseURL = import.meta.env.VITE_API_BASE_URL;

const axiosClient = axios.create({
  baseURL: baseURL ? `${baseURL}/api` : 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, 
});

// --- REQUEST INTERCEPTOR ---
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
let isLoggingOut = false;

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Trả về data trực tiếp để đỡ phải gọi response.data ở mọi nơi
    return response.data;
  },
  async (error: AxiosError) => {
    // Xử lý lỗi 401 (Unauthorized) -> Token hết hạn hoặc không hợp lệ
    if (error.response && (error.response.status === 401) && !isLoggingOut) {
      console.warn('Phiên đăng nhập hết hạn.');
      isLoggingOut = true;
      localStorage.removeItem('accessToken');
      
      // Redirect về trang login (Dùng window.location để reset app state)
      window.location.href = '/signin';
    }

    // Chuẩn hóa lỗi trả về để Frontend dễ hiển thị
    // Backend Python trả về: { "error": "Message" }
    const errorMessage = (error.response?.data as any)?.error || error.message || 'Lỗi không xác định';
    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosClient;