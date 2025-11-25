import axiosClient from './axiosClient';
import { LoginResponse, UserProfile } from '../types/auth.types';

export const authService = {
  login: (credentials: { employee_id: string; password: string }) => {
    return axiosClient.post<any, LoginResponse>('/auth/login', credentials);
  },

  loginWithGoogle: (code: string) => {
    return axiosClient.post<any, LoginResponse>('/auth/google', { code });
  },

  getMyProfile: () => {
    return axiosClient.get<any, UserProfile>('/auth/profile/me');
  },

  updateProfile: (data: Partial<UserProfile>) => {
    return axiosClient.put('/auth/profile/me', data);
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return axiosClient.post('/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/signin';
  }
};