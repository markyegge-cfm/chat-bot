/**
 * API Service - Centralized API communication utility
 * Handles all HTTP requests to the Express backend
 */

class APIService {
  constructor(baseUrl = '') {
    // Auto-detect API base URL
    this.baseUrl = baseUrl || this.getApiBaseUrl();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Auto-detect API base URL based on environment
   */
  getApiBaseUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // In development, use localhost:3000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:3000`;
    }

    // In production, use same host
    const portStr = port ? `:${port}` : '';
    return `${protocol}//${hostname}${portStr}`;
  }

  /**
   * Get auth token from session storage
   */
  getAuthToken() {
    return sessionStorage.getItem('authToken');
  }

  /**
   * Set auth token in session storage
   */
  setAuthToken(token) {
    if (token) {
      sessionStorage.setItem('authToken', token);
    }
  }

  /**
   * Get request headers with auth token if available
   */
  getHeaders() {
    const headers = { ...this.defaultHeaders };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle unauthorized
      if (response.status === 401) {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('authToken');
        window.location.href = '/admin/login';
        return null;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * POST request with FormData (for file uploads)
   */
  postFormData(endpoint, formData, options = {}) {
    const headers = this.getHeaders();
    delete headers['Content-Type']; // Let browser set it for FormData
    
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers,
      ...options,
    });
  }

  /**
   * Admin: Login
   */
  adminLogin(email, password) {
    return this.post('/api/admin/login', { email, password });
  }

  /**
   * Admin: Get dashboard statistics
   */
  adminGetDashboardStats() {
    return this.get('/api/admin/dashboard');
  }

  /**
   * Admin: Get conversations
   */
  adminGetConversations(page = 1, pageSize = 10) {
    return this.get(`/api/admin/conversations?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Admin: Get specific conversation details
   */
  adminGetConversation(conversationId) {
    return this.get(`/api/admin/conversations/${conversationId}`);
  }

  /**
   * Admin: Get conversation messages/history
   */
  adminGetConversationMessages(conversationId) {
    return this.get(`/api/admin/conversations/${conversationId}/messages`);
  }

  /**
   * Admin: Get escalations
   */
  adminGetEscalations(page = 1, pageSize = 10) {
    return this.get(`/api/admin/escalations?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Admin: Upload document
   */
  adminUploadDocument(formData) {
    return this.postFormData('/api/admin/documents/upload', formData);
  }

  /**
   * Chat: Send message
   */
  chatSendMessage(message, sessionId) {
    return this.post('/api/chat', { message, sessionId });
  }

  /**
   * Chat: Get conversation history
   */
  chatGetHistory(sessionId) {
    return this.get(`/api/chat/history/${sessionId}`);
  }
}

// Create global instance
window.apiService = new APIService();
