class Sidebar {
  static render() {
    const email = sessionStorage.getItem('adminEmail') || 'admin@example.com';
    const initials = email.split('@')[0].substring(0, 2).toUpperCase();
    const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

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
            <a href="#" data-page="dashboard" class="nav-item active">
              <img src="../image/dashboard.svg" alt="Dashboard" width="24" height="24">
              <span>Dashboard</span>
            </a>
            
            <a href="#" data-page="knowledge" class="nav-item">
              <img src="../image/knowldege.svg" alt="Knowledge Base" width="24" height="24">
              <span>Knowledge Base</span>
            </a>

            <a href="#" data-page="conversations" class="nav-item">
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
            <div class="user-avatar text-white font-bold bg-[#E5A000]">
              <span>${initials}</span>
            </div>
            <div class="user-info-text">
              <div class="user-name">${name}</div>
              <div class="user-email">${email}</div>
            </div>
          </div>
          <button id="logout-btn" class="logout-icon-btn" title="Logout">
            <img src="../image/logout.svg" alt="Logout" width="20" height="20">
          </button>
        </div>
      </aside>
    `;
  }
}
