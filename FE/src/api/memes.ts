import axios from 'axios';
import { API_URL } from '../config';
import { User } from '../types/user';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Meme {
  _id: string;
  title: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  topTextSize: number;
  bottomTextSize: number;
  topTextColor: string;
  bottomTextColor: string;
  topTextStroke: string;
  bottomTextStroke: string;
  topTextPosition: number;
  bottomTextPosition: number;
  topTextEffect: string;
  bottomTextEffect: string;
  imageFilter: string;
  isDraft: boolean;
  user: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      username: string;
    };
    text: string;
    createdAt: string;
  }>;
  reportDetails?: {
    reportedBy: string[];
    reportCount: number;
    lastReportedAt: string;
  };
}

export interface Comment {
  _id: string;
  text: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface MemesResponse {
  memes: Meme[];
  totalPages: number;
  currentPage: number;
  totalMemes: number;
}

export interface CreateMemeFormData {
  title: string;
  image?: File;
  imageUrl?: string;
  topText: string;
  bottomText: string;
  topTextSize: number;
  bottomTextSize: number;
  topTextColor: string;
  bottomTextColor: string;
  topTextPosition: number;
  bottomTextPosition: number;
  isDraft: boolean;
}

export interface UserStats {
  totalMemes: number;
  totalViews: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalComments: number;
}

// API Functions
export const getMemes = async (page: number = 1, limit: number = 12): Promise<MemesResponse> => {
  const response = await api.get(`/memes?page=${page}&limit=${limit}`);
  return response.data;
};

export const getTrendingMemes = async (page: number = 1, limit: number = 12): Promise<MemesResponse> => {
  const response = await api.get(`/memes/trending?page=${page}&limit=${limit}`);
  return response.data;
};

export const getWeeklyTrendingMemes = async (page: number = 1, limit: number = 12): Promise<MemesResponse> => {
  const response = await api.get(`/memes/trending/weekly?page=${page}&limit=${limit}`);
  return response.data;
};

export const getUserMemes = async (userId: string, page: number = 1, limit: number = 12): Promise<MemesResponse> => {
  console.log('API: Getting user memes', { userId, page, limit });
  try {
    const response = await api.get(`/memes/user/${userId}?page=${page}&limit=${limit}`);
    console.log('API: User memes response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error getting user memes:', error);
    throw error;
  }
};

export const getMemeById = async (id: string): Promise<Meme> => {
  const response = await api.get(`/memes/${id}`);
  return response.data;
};

export const createMeme = async (formData: FormData): Promise<Meme> => {
  try {
    // Convert text positions to numbers before sending
    const topTextPosition = parseFloat(formData.get('topTextPosition') as string) || 0.5;
    const bottomTextPosition = parseFloat(formData.get('bottomTextPosition') as string) || 0.5;
    
    // Update form data with numeric values
    formData.set('topTextPosition', topTextPosition.toString());
    formData.set('bottomTextPosition', bottomTextPosition.toString());

    // Log the data being sent
    const data = {
      title: formData.get('title'),
      imageUrl: formData.get('imageUrl'),
      hasImage: formData.has('image'),
      isDraft: formData.get('isDraft'),
      topTextPosition,
      bottomTextPosition
    };
    console.log('Sending meme creation request with data:', data);

    const response = await api.post('/memes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error in createMeme:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to create meme');
    }
    throw error;
  }
};

export const updateMeme = async (id: string, data: Partial<Meme>): Promise<Meme> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const response = await api.put(`/memes/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteMeme = async (id: string): Promise<void> => {
  await api.delete(`/memes/${id}`);
};

export const voteMeme = async (memeId: string, voteType: 'up' | 'down'): Promise<Meme> => {
  try {
    console.log('Sending vote request:', { memeId, voteType });
    const response = await api.post(`/memes/${memeId}/vote`, { voteType });
    console.log('Vote response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error voting on meme:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const addComment = async (memeId: string, text: string): Promise<Meme> => {
  try {
    console.log('Sending comment request:', { memeId, text });
    const response = await api.post(`/memes/${memeId}/comments`, { text });
    console.log('Comment response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const deleteComment = async (memeId: string, commentId: string): Promise<void> => {
  await api.delete(`/memes/${memeId}/comments/${commentId}`);
};

export const reportMeme = async (id: string, reason: string): Promise<void> => {
  await api.post(`/memes/${id}/report`, { reason });
};

export const getMemeOfTheDay = async (): Promise<Meme> => {
  const response = await api.get('/memes/meme-of-the-day');
  return response.data;
};

export const getWeeklyChampion = async (): Promise<Meme> => {
  const response = await api.get('/memes/weekly-champion');
  return response.data;
};

export const getMemeDetails = async (memeId: string): Promise<Meme> => {
  const response = await api.get(`/memes/${memeId}`);
  return response.data;
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
  console.log('API: Getting user stats', { userId });
  try {
    const response = await api.get(`/users/${userId}/stats`);
    console.log('API: User stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error getting user stats:', error);
    throw error;
  }
};

export const getUserTopMemes = async (userId: string, limit: number = 5): Promise<Meme[]> => {
  console.log('API: Getting user top memes', { userId, limit });
  try {
    const response = await api.get(`/memes/user/${userId}/top?limit=${limit}`);
    console.log('API: User top memes response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error getting user top memes:', error);
    throw error;
  }
};

export const getRelatedMemes = async (memeId: string): Promise<Meme[]> => {
  const response = await api.get(`/memes/${memeId}/related`);
  return response.data;
};

export const getHighlights = async (): Promise<Meme[]> => {
  try {
    const response = await api.get('/memes/highlights');
    return response.data;
  } catch (error) {
    console.error('Error fetching highlights:', error);
    throw error;
  }
}; 