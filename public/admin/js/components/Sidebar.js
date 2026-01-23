class Sidebar {
  static render() {
    return `
      <aside class="sidebar">
        <!-- Header / Logo -->
        <div class="sidebar-header">
          <div class="logo-container">
            <img src="../image/Group 1437254357.png" alt="ChatBot" class="sidebar-logo">
          </div>
        </div>

        <!-- Menu Section -->
        <div class="nav-section">
          <div class="nav-label">Home</div>
          <nav class="sidebar-nav">
            <a href="#" data-page="dashboard" class="nav-item">
              <img src="../image/dashboard.svg" alt="Dashboard" width="24" height="24">
              <span>Dashboard</span>
            </a>
            
            <a href="#" data-page="knowledge" class="nav-item">
              <img src="../image/knowldege.svg" alt="Knowledge Base" width="24" height="24">
              <span>Knowledge Base</span>
            </a>

            <a href="#" data-page="conversations" class="nav-item active">
              <img src="../image/conversation.svg" alt="Conversation" width="24" height="24">
              <span>Conversation</span>
            </a>

            <a href="#" data-page="escalations" class="nav-item">
              <img src="../image/escalation.svg" alt="Escalations" width="24" height="24">
              <span>Escalations</span>
            </a>
          </nav>
        </div>

        <!-- Footer / User Profile -->
        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="user-avatar">
              <span>AT</span>
            </div>
            <div class="user-info-text">
              <div class="user-name">Alexander</div>
              <div class="user-email">m@example.com</div>
            </div>
          </div>
          <button class="logout-icon-btn">
            <img src="../image/logout.svg" alt="Logout" width="20" height="20">
          </button>
        </div>
      </aside>
    `;
  }
}
