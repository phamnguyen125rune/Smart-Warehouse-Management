// src/types/auth.types.ts

// Response khi gọi API Login
export interface LoginResponse {
  access_token: string;
}

// Interface phụ cho Social Links (để code gọn hơn)
export interface SocialLinks {
  facebook: string | null;
  x: string | null;
  linkedin: string | null;
  instagram: string | null;
}

// User Profile - Map chính xác với User.to_dict() bên Python
export interface UserProfile {
  // --- Định danh & Cơ bản ---
  id: number;
  employee_id: string;      // Bắt buộc
  full_name: string;        // Bắt buộc
  role: 'manager' | 'employee'; // Union type giúp code an toàn hơn check string thường
  avatar_url: string | null;
  
  // --- Thông tin liên hệ (Có thể null) ---
  email: string | null;     // Email liên hệ cá nhân
  phone_number: string | null;
  google_auth_email: string | null; // Email dùng để login Google
  
  // --- Thông tin bổ sung ---
  bio: string | null;
  
  // --- Địa chỉ & Thuế ---
  country: string | null;
  city_state: string | null;
  postal_code: string | null;
  tax_id: string | null;

  // --- Mạng xã hội (Nested Object) ---
  social_links: SocialLinks;
}

// State quản lý bởi AuthContext
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null; // Null khi chưa đăng nhập
  loading: boolean;         // True khi đang fetch profile hoặc check token
  error?: string | null;    // Lưu lỗi nếu login thất bại
}

// Interface dùng cho Form Update Profile (Frontend gửi lên)
// Partial<UserProfile> nghĩa là cho phép gửi lên object thiếu field (chỉ gửi field cần sửa)
export type UpdateProfileData = Partial<Omit<UserProfile, 'id' | 'employee_id' | 'role' | 'social_links'>> & {
  // Flatten social links nếu form gửi dạng phẳng, hoặc giữ nguyên structure tùy Form bạn build
  facebook_url?: string;
  x_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
};

export interface UpdateProfilePayload {
  email?: string;
  phone_number?: string;
  bio?: string;
  country?: string;
  city_state?: string;
  postal_code?: string;
  tax_id?: string;
  
  // Backend nhận flat keys khi update
  facebook_url?: string;
  x_url?: string;
  linkedin_url?: string;
  instagram_url?: string;

  google_auth_email?: string;
}

export interface GeneralResponse {
  message?: string;
  success?: boolean;
  [key: string]: any;
}