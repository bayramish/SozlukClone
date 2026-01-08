import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - token ekle
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - 401 hatası durumunda token'ı temizle
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Topics API
export const topicsAPI = {
  getAll: (page = 1, limit = 20) =>
    api.get(`/topics?page=${page}&limit=${limit}`),
  getBySlug: (slug: string) => api.get(`/topics/${slug}`),
  create: (data: { title: string }) => api.post('/topics', data),
  search: (query: string) => api.get('/topics/search/query', { params: { q: query } }),
};

// Entries API
export const entriesAPI = {
  getAll: (topicId?: number, page = 1, limit = 20) => {
    const params = new URLSearchParams();
    if (topicId) params.append('topicId', topicId.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return api.get(`/entries?${params.toString()}`);
  },
  getById: (id: number) => api.get(`/entries/${id}`),
  create: (data: { content: string; topicId: number }) =>
    api.post('/entries', data),
  update: (id: number, data: { content?: string }) =>
    api.patch(`/entries/${id}`, data),
  delete: (id: number) => api.delete(`/entries/${id}`),
};

// Votes API
export const votesAPI = {
  create: (data: { entryId: number; value: 1 | -1 }) =>
    api.post('/votes', data),
  getByEntry: (entryId: number) => api.get(`/votes/entry/${entryId}`),
};

// Users API
export const usersAPI = {
  getById: (id: number) => api.get(`/users/${id}`),
  getByUsername: (username: string) => api.get(`/users/username/${username}`),
  getUserEntries: (username: string, page = 1, limit = 20) =>
    api.get(`/users/username/${username}/entries`, { params: { page, limit } }),
  getTopEntries: (username: string, limit = 10) =>
    api.get(`/users/username/${username}/top-entries`, { params: { limit } }),
  updateProfile: (data: { email?: string; password?: string }) =>
    api.patch('/users/profile', data),
};

// Admin API
export const adminAPI = {
  // Users
  getAllUsers: (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    return api.get(`/admin/users?${params.toString()}`);
  },
  getUserById: (id: number) => api.get(`/admin/users/${id}`),
  updateUserRole: (id: number, role: 'USER' | 'MODERATOR' | 'ADMIN') =>
    api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // Topics
  moveTopic: (id: number, newTitle: string) =>
    api.patch(`/admin/topics/${id}/move`, { newTitle }),
  mergeTopics: (sourceId: number, targetId: number) =>
    api.post(`/admin/topics/${sourceId}/merge/${targetId}`),
  deleteTopic: (id: number) => api.delete(`/admin/topics/${id}`),

  // Entries
  moveEntry: (id: number, newTopicId: number) =>
    api.patch(`/admin/entries/${id}/move`, { newTopicId }),
  forceDeleteEntry: (id: number) => api.delete(`/admin/entries/${id}/force`),

  // Statistics
  getStatistics: () => api.get('/admin/stats'),

  // Activity
  getActivity: (page = 1, limit = 50) =>
    api.get(`/admin/activity?page=${page}&limit=${limit}`),
  
  // Permission Management
  getModeratorPermissions: (userId: number) =>
    api.get(`/admin/permissions/${userId}`),
  updateModeratorPermissions: (userId: number, permissions: any) =>
    api.patch(`/admin/permissions/${userId}`, permissions),
  
  // Ban Management
  banUser: (userId: number, reason: string, until?: string) =>
    api.post(`/admin/ban/${userId}`, { reason, until }),
  unbanUser: (userId: number) => api.post(`/admin/unban/${userId}`),
  getBannedUsers: () => api.get('/admin/banned-users'),
};

export default api;
