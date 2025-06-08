import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Memes API
export const memesAPI = {
  getMemes: (params: { sort?: string; page?: number; limit?: number }) =>
    api.get('/memes', { params }),
  createMeme: (formData: FormData) =>
    api.post('/memes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  voteMeme: (id: string, voteType: 'up' | 'down') =>
    api.post(`/memes/${id}/vote`, { voteType }),
  addComment: (id: string, text: string) =>
    api.post(`/memes/${id}/comments`, { text }),
  flagMeme: (id: string) => api.post(`/memes/${id}/flag`),
};

// Users API
export const usersAPI = {
  getUserProfile: (id: string) => api.get(`/users/${id}`),
  getUserMemes: (id: string, params: { page?: number; limit?: number }) =>
    api.get(`/users/${id}/memes`, { params }),
  updateProfile: (data: { username?: string; email?: string }) =>
    api.patch('/users/me', data),
  deleteAccount: () => api.delete('/users/me'),
};

export default api; 