import axiosClient from './axiosClient';
import { UserProfile } from '../types/auth.types';
import { AdminUser, Role, CreateUserPayload, AdminResponse } from '../types/admin.types';

export const adminService = {
  // GET: Trả về mảng User
  getAllUsers: () => {
    return axiosClient.get<any, AdminUser[]>('/admin/users');
  },

  // GET: Trả về mảng Role
  getRoles: () => {
    return axiosClient.get<any, Role[]>('/admin/roles');
  },

  // POST: Tạo user mới -> Trả về AdminResponse (có message)
  registerUser: (userData: CreateUserPayload) => {
    // Tham số thứ 2 của Generic là kiểu trả về (R)
    return axiosClient.post<any, AdminResponse>('/admin/users/register', userData);
  },

  // PUT: Cập nhật user -> Trả về AdminResponse
  updateUser: (userId: number, userData: any) => {
    return axiosClient.put<any, AdminResponse>(`/admin/users/${userId}`, userData);
  },

  // PUT: Reset pass -> Trả về AdminResponse
  resetPassword: (userId: number, newPassword: string) => {
    return axiosClient.put<any, AdminResponse>(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
  },

  // DELETE: Xóa user -> Trả về AdminResponse
  deleteUser: (userId: number) => {
    return axiosClient.delete<any, AdminResponse>(`/admin/users/${userId}`);
  },
  // GHi log
  getAuditLogs: () => {
    return axiosClient.get<any, any[]>('/admin/audit-logs');
  }
};