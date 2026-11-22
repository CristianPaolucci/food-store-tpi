import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { LoginCredentials, AuthResponse } from '../types/auth.types';
import type { User } from '../../../store/authStore';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // FastAPI OAuth2PasswordRequestForm espera datos como form-urlencoded
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await axiosInstance.post<AuthResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (userData: { username: string; email: string; full_name: string; password: string }): Promise<User> => {
    const response = await axiosInstance.post<User>('/auth/register', userData);
    return response.data;
  },
};