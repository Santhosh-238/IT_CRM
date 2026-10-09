const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Standard Fetch Wrapper with automatic HttpOnly Cookie Credentials
 */
async function fetchWithCookies<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Automatically passes and receives HttpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export const crmApi = {
  // Health & Redis Monitoring
  getHealth: () => fetchWithCookies<any>('/health'),
  getRedisStatus: () => fetchWithCookies<any>('/redis/status'),

  // Auth (HttpOnly Cookie-based & Redis Cached)
  register: (userData: { name: string; email: string; phone?: string; password: string; confirmPassword?: string }) =>
    fetchWithCookies<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  login: (credentials: { email: string; password: string }) =>
    fetchWithCookies<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () =>
    fetchWithCookies<any>('/auth/logout', {
      method: 'POST',
    }),
  getMe: () => fetchWithCookies<any>('/auth/me'),

  // Dashboard Stats (Cached via Redis)
  getDashboardStats: () => fetchWithCookies<any>('/dashboard/stats'),

  // Database Wipe / Reset
  clearDatabase: () =>
    fetchWithCookies<any>('/database/clear', {
      method: 'POST',
    }),
};

export default crmApi;
