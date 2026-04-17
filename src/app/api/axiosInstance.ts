import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { auth } from '../firebaseConfig';

const retryConfig = {
  retries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffFactor: 2,
  statusCodesToRetry: [408, 429, 500, 502, 503, 504],
};

const shouldRetry = (error: AxiosError): boolean => {
  if (!error.response) return false;
  const config = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };
  if (config._retry === false) return false;
  if (config._retryCount && config._retryCount >= retryConfig.retries) return false;
  return retryConfig.statusCodesToRetry.includes(error.response.status);
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: false,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    const retryableConfig = config as AxiosRequestConfig & { _retryCount?: number };
    retryableConfig._retryCount = retryableConfig._retryCount || 0;
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };
    if (shouldRetry(error) && config) {
      config._retryCount = (config._retryCount || 0) + 1;
      const delay = Math.min(
        retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor, config._retryCount - 1),
        retryConfig.maxDelayMs,
      );
      const jitter = delay * 0.1 * Math.random();
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      return axiosInstance(config);
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
