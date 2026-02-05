import axios, {
    type AxiosRequestConfig,
    type AxiosResponse,
    type CancelTokenSource,
  } from 'axios';
  
  // Types for API Service
  interface ApiServiceOptions extends AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    withCredentials?: boolean;
  }
  
  // Extend AxiosRequestConfig to include our custom properties
  declare module 'axios' {
    export interface AxiosRequestConfig {
      skipAuthRefresh?: boolean;
      _retry?: boolean;
    }
  }
  
  interface ApiServiceResponse<T = any> extends AxiosResponse<T> {}
  
  interface RequestCancellation {
    source: CancelTokenSource;
    cancel: (message?: string) => void;
  }
  
  // Create axios instance with base configuration
  const axiosInstance = axios.create({
    baseURL: import.meta.env.REACT_APP_API_URL || 'http://localhost:8000', // Default API URL
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Request cancellation registry
  const pendingRequests: Map<string, CancelTokenSource> = new Map();
  
  // Generate a request key based on config
  const getRequestKey = (config: AxiosRequestConfig): string => {
    const { url = '', method = '', params = {}, data = {} } = config;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
  };
  
  // Request interceptor for API calls
  axiosInstance.interceptors.request.use(
    (config) => {
      // Add token to request header
    //   const tokenData = tokenUtil.getToken();
  
    //   if (tokenData?.token) {
    //     config.headers['Authorization'] = `Bearer ${tokenData.token}`;
    //   }
  
      // Add Origin header for CORS compliance
      // This ensures the backend knows where the request is coming from
      if (typeof window !== 'undefined' && import.meta.env.NODE_ENV !=='development') {
        const origin = window.location.origin;
        config.headers['Origin'] = origin;
      }
  
      // Cancel previous pending request with the same signature if exists
      const requestKey = getRequestKey(config);
      const existingRequest = pendingRequests.get(requestKey);
  
      if (existingRequest) {
        existingRequest.cancel('Duplicate request cancelled');
        pendingRequests.delete(requestKey);
      }
  
      // Set up cancellation for this request
      const source = axios.CancelToken.source();
      config.cancelToken = source.token;
      pendingRequests.set(requestKey, source);
  
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Response interceptor for API calls
  axiosInstance.interceptors.response.use(
    (response) => {
      // Remove request from pending registry
      const requestKey = getRequestKey(response.config);
      pendingRequests.delete(requestKey);
  
      return response;
    },
    async (error) => {
      // Handle cancelled requests
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }
  
      // Remove request from pending registry
      if (error.config) {
        const requestKey = getRequestKey(error.config);
        pendingRequests.delete(requestKey);
      }
  
      const originalRequest = error.config;
  
      // Skip auth refresh for specified requests
      if (originalRequest?.skipAuthRefresh) {
        return Promise.reject(error);
      }
  
      // If error is 401 Unauthorized
      if (error.response?.status === 401) {
        // Check specific error messages that indicate token was blacklisted or invalidated
        const errorDetail = error.response?.data?.detail || '';
        const isTokenRevoked =
          errorDetail.includes('Token has been revoked') ||
          errorDetail.includes('blacklist') ||
          errorDetail.includes('invalid token');
  
        // If token was invalidated by the server, perform immediate logout
        if (isTokenRevoked) {
          console.log(
            'Token was invalidated by server, performing immediate logout'
          );
        //   tokenUtil.removeToken();
  
          // Redirect to login page
          window.location.href = '/login?reason=session_expired';
          return Promise.reject(error);
        }
  
        // If not specifically a revoked token but still 401, and we haven't tried to refresh yet
        if (!originalRequest?._retry) {
          originalRequest._retry = true;
  
          // We no longer support token refresh, proceed to logout
        //   tokenUtil.removeToken();
          window.location.href = '/login?reason=session_expired';
          return Promise.reject(error);
        }
      }
  
      return Promise.reject(error);
    }
  );
  
  /**
   * API Service with enhanced functionality
   */
  class ApiService {
    /**
     * Send a GET request
     */
    async get<T = any>(
      url: string,
      params?: any,
      options?: ApiServiceOptions
    ): Promise<ApiServiceResponse<T>> {
      return axiosInstance.get<T>(url, { ...options, params });
    }
  
    /**
     * Send a POST request
     */
    async post<T = any>(
      url: string,
      data?: any,
      options?: ApiServiceOptions
    ): Promise<ApiServiceResponse<T>> {
      return axiosInstance.post<T>(url, data, options);
    }
  
    /**
     * Send a PUT request
     */
    async put<T = any>(
      url: string,
      data?: any,
      options?: ApiServiceOptions
    ): Promise<ApiServiceResponse<T>> {
      return axiosInstance.put<T>(url, data, options);
    }
  
    /**
     * Send a DELETE request
     */
    async delete<T = any>(
      url: string,
      options?: ApiServiceOptions
    ): Promise<ApiServiceResponse<T>> {
      return axiosInstance.delete<T>(url, options);
    }
  
    /**
     * Create a cancellable request
     * Returns a source that can be used to cancel the request
     */
    createCancellationToken(): RequestCancellation {
      const source = axios.CancelToken.source();
      return {
        source,
        cancel: (message?: string) =>
          source.cancel(message || 'Request cancelled by user'),
      };
    }
  
    /**
     * Cancel all pending requests
     */
    cancelAllRequests(message?: string): void {
      pendingRequests.forEach((source) => {
        source.cancel(message || 'Cancelled by user');
      });
      pendingRequests.clear();
    }
  
    /**
     * Cancel requests by URL pattern
     */
    cancelRequestsByUrlPattern(pattern: RegExp, message?: string): void {
      pendingRequests.forEach((source, key) => {
        if (pattern.test(key)) {
          source.cancel(message || 'Cancelled by pattern match');
          pendingRequests.delete(key);
        }
      });
    }
  
    /**
     * Get the underlying Axios instance
     */
    getInstance() {
      return axiosInstance;
    }
  }
  
  // Create singleton instance
  const apiService = new ApiService();
  
  export default apiService;