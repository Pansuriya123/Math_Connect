import axios from 'axios';
import { baseUrl } from './Urls';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true, // This ensures cookies are sent with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (optional - for adding auth headers if needed)
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add any request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional - for handling common errors)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here if needed
    if (error.response?.status === 401) {
      // Redirect to login or handle unauthorized access
      console.log('Unauthorized access - redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
