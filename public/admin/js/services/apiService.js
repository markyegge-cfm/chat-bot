class APIService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || this.getApiBaseUrl();
    this.defaultHeaders = { 'Content-Type': 'application/json' };
  }

  getApiBaseUrl() {
    const { protocol, hostname, port } = window.location;
    return (hostname === 'localhost' || hostname === '127.0.0.1') 
      ? `${protocol}//localhost:3000` 
      : `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  getHeaders() {
    const headers = { ...this.defaultHeaders };
    const token = sessionStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async getKnowledgeBase() {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge`, { headers: this.getHeaders() });
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (e) {
      console.error("API Error:", e);
      return [];
    }
  }

  async createKnowledgeItem(question, answer) {
    const response = await fetch(`${this.baseUrl}/api/knowledge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ question, answer })
    });
    return response.json();
  }

  // ============================================
  // CONVERSATION METHODS
  // ============================================

  /**
   * Get all conversations with pagination
   */
  async getConversations(page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversations?page=${page}&limit=${limit}`,
        { headers: this.getHeaders() }
      );
      const result = await response.json();
      return result.success ? result : { conversations: [], total: 0 };
    } catch (e) {
      console.error("API Error:", e);
      return { conversations: [], total: 0 };
    }
  }

  /**
   * Get a specific conversation
   */
  async getConversation(sessionId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversations/${sessionId}`,
        { headers: this.getHeaders() }
      );
      const result = await response.json();
      return result.success ? result.conversation : null;
    } catch (e) {
      console.error("API Error:", e);
      return null;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(sessionId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversations/${sessionId}/messages`,
        { headers: this.getHeaders() }
      );
      const result = await response.json();
      return result.success ? result.messages : [];
    } catch (e) {
      console.error("API Error:", e);
      return [];
    }
  }

  /**
   * Get conversations by status
   */
  async getConversationsByStatus(status, limit = 50) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversations/status/${status}?limit=${limit}`,
        { headers: this.getHeaders() }
      );
      const result = await response.json();
      return result.success ? result.conversations : [];
    } catch (e) {
      console.error("API Error:", e);
      return [];
    }
  }

  /**
   * Admin method to get all conversations
   */
  async adminGetConversations(page = 1, limit = 50) {
    try {
      const url = `${this.baseUrl}/api/conversations?page=${page}&limit=${limit}`;
      console.log('🔗 Fetching from:', url);
      const response = await fetch(url, { headers: this.getHeaders() });
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📦 Response data:', result);
      return result;
    } catch (e) {
      console.error("💥 API Error:", e);
      return { conversations: [], total: 0 };
    }
  }

  /**
   * Admin method to get conversation messages
   */
  async adminGetConversationMessages(sessionId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversations/${sessionId}/messages`,
        { headers: this.getHeaders() }
      );
      const result = await response.json();
      return result;
    } catch (e) {
      console.error("API Error:", e);
      return { messages: [] };
    }
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(sessionId, status) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversations/${sessionId}/status`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ status })
        }
      );
      return await response.json();
    } catch (e) {
      console.error("API Error:", e);
      return { success: false };
    }
  }

  /**
   * Update conversation metadata (topic, summary)
   */
  async updateConversationMetadata(sessionId, topic, summary) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversations/${sessionId}/metadata`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ topic, summary })
        }
      );
      return await response.json();
    } catch (e) {
      console.error("API Error:", e);
      return { success: false };
    }
  }
}
