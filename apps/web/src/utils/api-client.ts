import axios from 'axios';

/**
 * IndieLeads API Client
 * Enterprise-grade unified architecture resolution.
 */
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    let url = envUrl.replace(/\/$/, '');
    return url.includes('/api/v1') ? url : `${url}/api/v1`;
  }

  // Unified Build Fallback: Use relative path. 
  // This is the most reliable way to connect in a single-container architecture.
  return '/api/v1';
};

const BASE_URL = getBaseURL();

const apiClient = axios.create({
  baseURL: BASE_URL,
  // 65s timeout — enough to survive a Render free-tier cold start (~40-60s)
  timeout: 65000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Silently wake up the Render server before the user interacts.
 * Call this once when the app loads. The server responds within ~60s after
 * being spun down. By pinging on app load we ensure it's warm by the time
 * the user clicks anything.
 */
export const wakeUpServer = async () => {
  try {
    const baseWithoutV1 = BASE_URL.replace('/api/v1', '');
    await axios.get(`${baseWithoutV1}/`, { timeout: 65000 });
    console.log('[API] Server is awake and ready.');
  } catch {
    console.log('[API] Warming up server...');
  }
};

// Request Interceptor: Auth & Context Injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const workspaceId = localStorage.getItem('workspaceId');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (workspaceId) config.headers['x-workspace-id'] = workspaceId;
  return config;
});

// Response Interceptor: Standardization & Auth Guard
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      return response.data;
    }
    return response;
  },
  async (error) => {
    // Session Expiry Handling
    if (error.response?.status === 401) {
      const isLoginOrSignup = window.location.hash.includes('login') || window.location.hash.includes('signup');
      if (!isLoginOrSignup) {
        localStorage.clear();
        window.location.href = '#/login';
      }
    }

    // Structured Error Extraction — surface exact backend message
    const responseData = error.response?.data;
    const errorMessage = responseData?.message || responseData?.error?.message || error.message;

    console.error(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${errorMessage}`);

    return Promise.reject(error);
  }
);

export default apiClient;
