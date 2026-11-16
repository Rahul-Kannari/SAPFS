import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Do not attempt token refresh for login or refresh requests themselves
    if (originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
        localStorage.setItem('access_token', response.data.access_token);
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  refresh: (token) => api.post('/auth/refresh', { refresh_token: token }),
  me: () => api.get('/auth/me'),
};

// Students
export const studentsAPI = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  bulkImport: (records) => api.post('/students/bulk-import', records),
  getAttendanceSummary: (id) => api.get(`/students/${id}/attendance-summary`),
};

// Faculty
export const facultyAPI = {
  list: () => api.get('/faculty'),
  get: (id) => api.get(`/faculty/${id}`),
  create: (data) => api.post('/faculty', data),
  update: (id, data) => api.put(`/faculty/${id}`, data),
};

// Courses
export const coursesAPI = {
  list: (params) => api.get('/courses', { params }),
  get: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
};

// Academic Records
export const academicAPI = {
  getByStudent: (studentId) => api.get(`/academic-records`, { params: { student_id: studentId } }),
  create: (data) => api.post('/academic-records', data),
  update: (id, data) => api.put(`/academic-records/${id}`, data),
};

// Attendance
export const attendanceAPI = {
  markBulk: (data) => api.post('/attendance/bulk', data),
  getByStudent: (studentId) => api.get(`/attendance`, { params: { student_id: studentId } }),
  getByCourse: (courseId, date) => api.get(`/attendance`, { params: { course_id: courseId, date } }),
};

// Assignments
export const assignmentsAPI = {
  list: (params) => api.get('/assignments', { params }),
  create: (data) => api.post('/assignments', data),
  submit: (data) => api.post('/assignments/submit', data),
  grade: (submissionId, data) => api.put(`/assignments/submissions/${submissionId}/grade`, data),
};

// Predictions
export const predictionsAPI = {
  predict: (data) => api.post('/predictions/predict', data),
  simulate: (data) => api.post('/predictions/simulate', data),
  retrain: () => api.post('/predictions/retrain'),
  getByStudent: (studentId) => api.get(`/predictions/student/${studentId}`),
  getRiskReport: () => api.get('/predictions/risk-report'),
  batchPredict: (params) => api.get('/predictions/batch-predict', { params }),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getPerformanceTrends: () => api.get('/dashboard/performance-trends'),
  getRiskHeatmap: () => api.get('/dashboard/risk-heatmap'),
  getAttendanceAnalytics: () => api.get('/dashboard/attendance-analytics'),
};

// Notifications
export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// AI Agents v2 (also accessible via /api/v1 prefix for convenience)
const AGENTS_BASE = 'http://localhost:8000/api/v2';
const agentsAxios = axios.create({
  baseURL: AGENTS_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});
agentsAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const agentsAPI = {
  health:       ()           => api.get('/agents/health'),
  predictV2:    (data)       => api.post('/agents/predict-v2', data),
  advisorChat:  (data)       => api.post('/agents/advisor/chat', data),
  updateFeatures: (data)     => api.post('/agents/features', data),
  getFeatures:  (id, sem)    => api.get(`/agents/features/${id}`, { params: { semester: sem } }),
  riskDashboard: ()          => api.get('/agents/risk-dashboard'),
  forecast:     (id)         => api.get(`/agents/forecast/${id}`),
  evaluation:   ()           => api.get('/agents/evaluation'),
  researchExport: (fmt='json') => api.get('/agents/research/export', { params: { fmt } }),
};

export default api;

