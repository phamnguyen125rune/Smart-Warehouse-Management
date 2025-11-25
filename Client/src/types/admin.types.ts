// src/types/admin.types.ts

// Dữ liệu Role từ API /admin/roles
export interface Role {
  id: number;
  name: string;
}

// Dữ liệu User hiển thị trên bảng (Table) - Từ API /admin/users
export interface AdminUser {
  id: number;
  employee_id: string;
  full_name: string;
  email: string | null;
  role: string; // Backend trả về tên role (ví dụ: 'eemployer')
}

// Dữ liệu form gửi lên để Tạo mới (Create)
export interface CreateUserPayload {
  employee_id: string;
  full_name: string;
  password?: string;
  role: string; // Backend nhận tên role
}

// Dữ liệu form gửi lên để Cập nhật (Update)
export interface UpdateUserPayload {
  full_name?: string;
  password?: string;
}

export interface AdminResponse {
  message: string;
  success?: boolean;
  [key: string]: any; // Cho phép thêm các trường khác nếu có
}