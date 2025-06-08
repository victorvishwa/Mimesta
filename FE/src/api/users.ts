import { API_URL } from '../config';
import type { User } from '../types/user';
import axios from 'axios';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  avatar?: File;
}

export const usersAPI = {
  async register(data: RegisterData) {
    try {
      // Validate data before sending
      if (data.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      if (!data.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const response = await axios.post(`${API_URL}/users/register`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error(error.response.data.message || 'User already exists');
        }
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
      }
      throw error;
    }
  },

  async login(data: LoginData) {
    try {
      const response = await axios.post(`${API_URL}/users/login`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed');
    }
  },

  async getCurrentUser(token: string) {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user data');
    }
  },

  async getProfile(token: string) {
    try {
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch profile');
    }
  },

  async updateProfile(token: string, data: FormData) {
    try {
      const response = await axios.put(`${API_URL}/users/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  },

  async changePassword(token: string, data: { currentPassword: string; newPassword: string }) {
    const response = await fetch(`${API_URL}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to change password');
    }

    return response.json();
  },

  async deleteAccount(token: string) {
    try {
      const response = await axios.delete(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete account');
    }
  },
};