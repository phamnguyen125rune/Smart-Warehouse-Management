// src/services/notificationService.ts
import axiosClient from './axiosClient';
import { MailItem } from '../types/notification.types';


// Định nghĩa kiểu trả về mới có phân trang
interface PaginatedResponse {
  data: MailItem[];
  meta: {
    total: number;
    pages: number;
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  unread_count: number;
}

export const notificationService = {
  // Thêm tham số page và filter
  getNotifications: (page = 1, type = 'ALL') => {
    return axiosClient.get<any, PaginatedResponse>('/notifications', {
      params: { page, type }
    });
  },

// export const notificationService = {
//   // Lấy danh sách tin nhắn
//   getNotifications: () => {
//     return axiosClient.get<any, MailItem[]>('/notifications');
//   },

  // Gửi tin nhắn mới
  sendMessage: (data: { recipient_id: number; title: string; message: string; is_pinned: boolean }) => {
    return axiosClient.post('/notifications/send', data);
  },
  
  // Thêm hàm toggle pin
  togglePin: (id: number) => {
    return axiosClient.put<{ message: string; is_pinned: boolean }>(`/notifications/${id}/pin`);
  },

  // Đánh dấu đã đọc
  markAsRead: (id: number) => {
    return axiosClient.put(`/notifications/${id}/read`);
  },
  
  // Đánh dấu đọc tất cả
  markAllAsRead: () => {
    return axiosClient.put('/notifications/read-all');
  }
};