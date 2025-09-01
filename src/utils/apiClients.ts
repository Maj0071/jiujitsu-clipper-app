// src/utils/apiClient.ts
import { getAuth } from 'firebase/auth';

// Get auth instance
const auth = getAuth();

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the current user's JWT token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Create headers with authentication
   */
  private async getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Create headers for file uploads
   */
  private async getFileUploadHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {};
    
    const token = await this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for file uploads - let the browser set it
    return headers;
  }

  /**
   * Generic request method
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          error: data?.detail || data?.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders(includeAuth);
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders(includeAuth);
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * File upload request
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const headers = await this.getFileUploadHeaders();
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional form data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  /**
   * Download file request
   */
  async downloadFile(endpoint: string): Promise<ApiResponse<Blob>> {
    const token = await this.getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: errorText || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      const blob = await response.blob();
      return {
        data: blob,
        status: response.status,
      };
    } catch (error) {
      console.error('File download failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Download failed',
        status: 0,
      };
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Specific API methods for your app
export const bjjApi = {
  // Video processing endpoints
  uploadVideo: (file: File) => apiClient.uploadFile('/api/video/upload', file),
  getVideoResults: (fileId: string) => apiClient.get(`/api/video/results/${fileId}`),
  downloadClip: (filename: string) => apiClient.downloadFile(`/api/video/clip/${filename}`),

  // Coach endpoints
  uploadCoachVideo: (coachId: string, file: File) => 
    apiClient.uploadFile(`/api/coaches/${coachId}/video/upload`, file),
  getCoachVideos: (coachId: string) => 
    apiClient.get(`/api/coaches/${coachId}/videos`),

  // Student endpoints
  getStudentContent: (studentId: string) => 
    apiClient.get(`/api/students/${studentId}/purchased-content`),

  // Health check (no auth required)
  healthCheck: () => apiClient.get('/', false),
  apiStatus: () => apiClient.get('/api/status', false),
};

export default apiClient;