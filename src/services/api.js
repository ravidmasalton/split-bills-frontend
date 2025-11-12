import axios from 'axios';

const API_URL = 'https://split-bills-5224.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// הוספת token אוטומטית לכל בקשה
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API למשתמשים
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getCurrentUser: () => api.get('/users/me'),
  getAllUsers: () => api.get('/users/'),
};

// API לאירועים
export const eventsAPI = {
  createEvent: (eventData) => api.post('/events/', eventData),
  getMyEvents: () => api.get('/events/my-events'),
  getEvent: (eventId) => api.get(`/events/${eventId}`),
  addExpense: (eventId, expenseData) => api.post(`/events/${eventId}/expenses`, expenseData),
  updateExpense: (eventId, expenseIndex, expenseData) => api.put(`/events/${eventId}/expenses/${expenseIndex}`, expenseData),
  deleteExpense: (eventId, expenseIndex) => api.delete(`/events/${eventId}/expenses/${expenseIndex}`),
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`),  // הוסף את זה!
  finalizeEvent: (eventId, currency) => api.post(`/events/${eventId}/finalize?final_currency=${currency}`),
};
export default api;