import axios from 'axios';

// Use environment variable if available, otherwise fallback to localhost:3000
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable sending cookies in cross-origin requests
  withCredentials: true,
});

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Clear local storage if authentication fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page if needed
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Authentication services
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/signin', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signup: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/signup', {
      name,
      email,
      password,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Kick counter services
export const kickCounterService = {
  createCounter: async (period?: number) => {
    // Create counter with startedAt and period if provided
    const response = await api.post('/kick-counters', {
      startedAt: new Date().toISOString(),
      period: period || undefined, // Only include period if it's provided
    });
    return response.data;
  },

  getAllCounters: async () => {
    const response = await api.get('/kick-counters/my');
    return response.data;
  },

  getCounter: async (id: string) => {
    const response = await api.get(`/kick-counters/${id}`);
    return response.data;
  },

  recordKick: async (counterId: string) => {
    const response = await api.post('/kick-counters/record', { counterId });
    return response.data;
  },

  createKickLog: async (counterId: string, happenedAt: string) => {
    const response = await api.post('/kick-logs', {
      counterId,
      happenedAt,
    });
    return response.data;
  },

  finishCounter: async (id: string) => {
    const response = await api.put(`/kick-counters/${id}/complete`);
    return response.data;
  },

  deleteCounter: async (id: string) => {
    const response = await api.delete(`/kick-counters/${id}`);
    return response.data;
  },

  getLogsByCounter: async (counterId: string) => {
    const response = await api.get(`/kick-logs/counter/${counterId}`);
    return response.data;
  },

  deleteLog: async (id: string) => {
    const response = await api.delete(`/kick-logs/${id}`);
    return response.data;
  },
};

// Contraction counter services
export const contractionCounterService = {
  createCounter: async (createDto: { status: 'active' | 'closed' }) => {
    // Create counter with given status
    const response = await api.post('/contraction-counters', createDto);
    return response.data;
  },

  getAllCounters: async () => {
    const response = await api.get('/contraction-counters/my');
    return response.data;
  },

  getCounter: async (id: string) => {
    const response = await api.get(`/contraction-counters/${id}`);
    return response.data;
  },

  closeCounter: async (id: string) => {
    const response = await api.patch(`/contraction-counters/${id}/close`);
    return response.data;
  },

  deleteCounter: async (id: string) => {
    const response = await api.delete(`/contraction-counters/${id}`);
    return response.data;
  },
};

// Contraction logs services
export const contractionLogService = {
  createLog: async (createDto: {
    counterId: string;
    startedAt: string;
    endedAt: string;
    duration: number;
  }) => {
    const response = await api.post('/contraction-logs', createDto);
    return response.data;
  },

  getLogsByCounter: async (counterId: string) => {
    const response = await api.get(`/contraction-logs/counter/${counterId}`);
    return response.data;
  },

  deleteLog: async (id: string) => {
    const response = await api.delete(`/contraction-logs/${id}`);
    return response.data;
  },
};

export default api;
