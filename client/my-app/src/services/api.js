import axios from 'axios';

const API_URL = 'https://suyalgeneralstore.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiFormData = axios.create({
  baseURL: API_URL,
});

export const itemAPI = {
  getAll: () => api.get('/items'),
  getById: (id) => api.get(`/items/${id}`),

  create: (data) => {
    if (data instanceof FormData) {
      return apiFormData.post('/add-items', data);
    }
    return api.post('/add-items', data);
  },

  update: (id, data) => {
    if (data instanceof FormData) {
      return apiFormData.put(`/update-item/${id}`, data);
    }
    return api.put(`/update-item/${id}`, data);
  },

  delete: (id) => api.delete(`/delete-item/${id}`),
};