import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  const errorMsg = '❌ ERROR: NEXT_PUBLIC_API_URL environment variable is missing!';
  console.error(errorMsg);
  console.error('Please set NEXT_PUBLIC_API_URL in your .env.local file');
  if (typeof window !== 'undefined') {
    throw new Error('API URL not configured. Please check environment variables.');
  }
}

const fullApiUrl = `${API_BASE_URL}/api`;
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔗 Full API URL:', fullApiUrl);

const api = axios.create({
  baseURL: fullApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      fullUrl: `${error.config?.baseURL}${error.config?.url}`,
    });
    return Promise.reject(error);
  }
);

export default api;

