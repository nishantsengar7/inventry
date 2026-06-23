import api from './api';

export const aiAPI = {
  getForecast: async () => {
    const res = await api.get('/ai/forecast');
    return res.data;
  },
  getReorderSuggestions: async (showAll = false) => {
    const res = await api.get(`/ai/reorder-suggestions?show_all=${showAll}`);
    return res.data;
  },
  getAnomalies: async () => {
    const res = await api.get('/ai/anomalies');
    return res.data;
  },
  getHealthScore: async () => {
    const res = await api.get('/ai/health-score');
    return res.data;
  },
  suggestCategory: async (payload) => {
    const res = await api.post('/ai/suggest-category', payload);
    return res.data;
  },
  chat: async (payload) => {
    const res = await api.post('/ai/chat', payload);
    return res.data;
  }
};
