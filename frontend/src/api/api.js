import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const deleteAccount = () => api.delete('/auth/delete');

// ── Sessions ──
export const createSession = (youtubeUrl) => api.post('/sessions', { youtube_url: youtubeUrl });
export const listSessions = () => api.get('/sessions');
export const getSession = (id) => api.get(`/sessions/${id}`);
export const deleteSession = (id) => api.delete(`/sessions/${id}`);

// ── Checkpoints ──
export const answerCheckpoint = (sessionId, checkpointId, answer) =>
  api.post(`/sessions/${sessionId}/answer`, { checkpoint_id: checkpointId, answer });

// ── Chat ──
export const sendChatMessage = (sessionId, message, currentTime) =>
  api.post(`/sessions/${sessionId}/chat`, { message, current_time: currentTime });

export default api;
