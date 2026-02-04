class Dashboard {
  static render() {
    return `
      <div class="px-8 py-8 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
            <p class="text-slate-500 mt-1 text-base">
              Real-time overview of system performance and knowledge base.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                     bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              System Operational
            </span>
            <button
              onclick="Dashboard.loadStats()"
              class="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh Data">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <!-- Knowledge -->
          <div
            class="bg-white rounded-2xl p-6 border border-slate-100 shadow
                   hover:shadow-lg transition-all cursor-pointer"
            onclick="Dashboard.navigateTo('knowledge')">
            <div class="flex justify-between mb-4">
              <div class="p-3 bg-blue-50 rounded-xl">
                <i class="fas fa-book text-blue-600 text-xl"></i>
              </div>
              <span class="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                Total Files
              </span>
            </div>
            <h3 id="dash-total-files" class="text-3xl font-bold text-slate-800">0</h3>
            <p class="text-sm text-slate-500">Knowledge Base Assets</p>
          </div>

          <!-- Conversations -->
          <div
            class="bg-white rounded-2xl p-6 border border-slate-100 shadow
                   hover:shadow-lg transition-all cursor-pointer"
            onclick="Dashboard.navigateTo('conversations')">
            <div class="flex justify-between mb-4">
              <div class="p-3 bg-indigo-50 rounded-xl">
                <i class="fas fa-comments text-indigo-600 text-xl"></i>
              </div>
              <span class="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                All Time
              </span>
            </div>
            <h3 id="dash-conv-count" class="text-3xl font-bold text-slate-800">0</h3>
            <p class="text-sm text-slate-500">Total Conversations</p>
          </div>

          <!-- Escalations -->
          <div
            class="bg-white rounded-2xl p-6 border border-slate-100 shadow
                   hover:shadow-lg transition-all cursor-pointer"
            onclick="Dashboard.navigateTo('escalations')">
            <div class="flex justify-between mb-4">
              <div class="p-3 bg-amber-50 rounded-xl">
                <i class="fas fa-exclamation-triangle text-amber-600 text-xl"></i>
              </div>
              <span class="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                Action Required
              </span>
            </div>
            <h3 id="dash-escalations" class="text-3xl font-bold text-slate-800">0</h3>
            <p class="text-sm text-slate-500">Pending Escalations</p>
          </div>

          <!-- AI Status -->
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow">
            <div class="flex justify-between mb-4">
              <div class="p-3 bg-purple-50 rounded-xl">
                <i class="fas fa-robot text-purple-600 text-xl"></i>
              </div>
              <span class="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                Status
              </span>
            </div>
            <div class="flex items-center gap-2">
              <h3 class="text-xl font-bold text-slate-800">Active</h3>
              <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
            </div>
            <p class="text-sm text-slate-500">Vertex AI Model</p>
          </div>
        </div>

        <!-- Charts -->
      

        <!-- Widget Settings Section -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow mb-8">
          <div class="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 class="text-xl font-bold text-slate-800">Widget Settings</h2>
              <p class="text-sm text-slate-500 mt-1">Configure chatbot greeting and suggestion questions</p>
            </div>
            <button
              onclick="Dashboard.saveWidgetSettings()"
              id="save-widget-btn"
              class="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 
                     transition-colors font-medium flex items-center gap-2">
              <i class="fas fa-save"></i>
              <span>Save Changes</span>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- Greeting Message -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">
                <i class="fas fa-comment-dots text-amber-600 mr-2"></i>
                Greeting Message
              </label>
              <input
                type="text"
                id="greeting-message"
                class="w-full px-4 py-3 border border-slate-300 rounded-lg 
                       focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                       transition-all text-slate-800 placeholder-slate-400"
                placeholder="Hi! How can I support you today?"
                maxlength="200"
              />
              <p class="text-xs text-slate-500 mt-2">First message shown when visitors open the chatbot</p>
            </div>

            <!-- Suggestion Questions -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">
                <i class="fas fa-lightbulb text-amber-600 mr-2"></i>
                Suggestion Questions <span class="text-slate-400 font-normal">(Max 5)</span>
              </label>
              
              <div id="suggestions-container" class="space-y-3 mb-3">
                <!-- Suggestion inputs will be rendered here -->
              </div>
              
              <button
                onclick="Dashboard.addSuggestionInput()"
                id="add-suggestion-btn"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 
                       rounded-lg hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700
                       transition-all font-medium flex items-center justify-center gap-2">
                <i class="fas fa-plus-circle"></i>
                <span>Add Suggestion</span>
              </button>
            </div>
          </div>
        </div>
         
          </div>
        </div>
      </div>
    `;
  }

  static async afterRender() {
    await this.loadStats();
    await this.loadWidgetSettings();
  }

  static async loadStats() {
    try {
      const res = await fetch('/api/stats');
      const { success, data } = await res.json();
      if (!success) throw new Error('Failed to load stats');

      const knowledge = data?.knowledge ?? {};
      const conv = data?.conversations ?? {};
      const esc = data?.escalations ?? {};

      this.animateValue('dash-total-files', 0, knowledge.totalFiles || 0, 800);
      this.animateValue('dash-conv-count', 0, conv.total || 0, 800);
      this.animateValue('dash-escalations', 0, esc.total || 0, 800);

      this.renderCharts(knowledge, esc.items || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    }
  }

  static animateValue(id, start, end, duration) {
    const el = document.getElementById(id);
    if (!el) return;

    let startTime = null;
    const step = (t) => {
      if (!startTime) startTime = t;
      const p = Math.min((t - startTime) / duration, 1);
      el.textContent = Math.floor(start + p * (end - start));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  static renderCharts(knowledge, escalations) {
    if (window.distChartInstance) window.distChartInstance.destroy();
    if (window.activityChartInstance) window.activityChartInstance.destroy();

    const distCtx = document.getElementById('distributionChart');
    const actCtx = document.getElementById('activityChart');

    if (distCtx) {
      window.distChartInstance = new Chart(distCtx, {
        type: 'doughnut',
        data: {
          labels: ['PDF', 'Manual', 'CSV', 'DOCX'],
          datasets: [{
            data: [
              knowledge.byType?.pdf || 0,
              knowledge.byType?.manual || 0,
              knowledge.byType?.csv || 0,
              knowledge.byType?.docx || 0
            ],
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6366F1']
          }]
        },
        options: { cutout: '70%' }
      });
    }

    if (actCtx) {
      const map = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        map[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
      }

      escalations.forEach(e => {
        if (e.status === 'open') {
          const k = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (map[k] !== undefined) map[k]++;
        }
      });

      window.activityChartInstance = new Chart(actCtx, {
        type: 'line',
        data: {
          labels: Object.keys(map),
          datasets: [{
            data: Object.values(map),
            borderColor: '#F59E0B',
            fill: true,
            tension: 0.4
          }]
        }
      });
    }
  }

  static navigateTo(section) {
    // Use hash routing so the main router handles loading the section
    if (typeof section === 'string' && section.length > 0) {
      window.location.hash = section;
    }
  }

  static async loadWidgetSettings() {
    try {
      const res = await fetch('/api/widget-settings');
      const { success, data } = await res.json();
      
      if (success && data) {
        // Set greeting message
        const greetingInput = document.getElementById('greeting-message');
        if (greetingInput) {
          greetingInput.value = data.greetingMessage || '';
        }

        // Set suggestions
        this.currentSuggestions = data.suggestions || [];
        this.renderSuggestions();
      }
    } catch (error) {
      console.error('Error loading widget settings:', error);
    }
  }

  static renderSuggestions() {
    const container = document.getElementById('suggestions-container');
    if (!container) return;

    container.innerHTML = '';
    this.currentSuggestions.forEach((suggestion, index) => {
      const div = document.createElement('div');
      div.className = 'flex items-center gap-3';
      div.innerHTML = `
        <span class="flex items-center justify-center min-w-[32px] h-8 rounded-lg 
                     bg-amber-50 text-amber-700 font-semibold text-sm">
          ${index + 1}
        </span>
        <input
          type="text"
          class="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg 
                 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                 transition-all text-slate-800 placeholder-slate-400"
          placeholder="Enter suggestion question"
          value="${suggestion}"
          maxlength="100"
          onchange="Dashboard.updateSuggestion(${index}, this.value)"
        />
        <button
          onclick="Dashboard.removeSuggestion(${index})"
          class="flex items-center justify-center w-9 h-9 rounded-lg 
                 text-slate-400 hover:text-red-600 hover:bg-red-50 
                 transition-all"
          title="Remove">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      container.appendChild(div);
    });

    // Update add button state
    const addBtn = document.getElementById('add-suggestion-btn');
    if (addBtn) {
      addBtn.disabled = this.currentSuggestions.length >= 5;
      if (this.currentSuggestions.length >= 5) {
        addBtn.classList.add('opacity-50', 'cursor-not-allowed');
        addBtn.querySelector('span').textContent = 'Maximum Reached';
      } else {
        addBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        addBtn.querySelector('span').textContent = 'Add Suggestion';
      }
    }
  }

  static addSuggestionInput() {
    if (!this.currentSuggestions) this.currentSuggestions = [];
    if (this.currentSuggestions.length >= 5) {
      alert('Maximum 5 suggestions allowed');
      return;
    }
    this.currentSuggestions.push('');
    this.renderSuggestions();
  }

  static updateSuggestion(index, value) {
    if (!this.currentSuggestions) this.currentSuggestions = [];
    this.currentSuggestions[index] = value;
  }

  static removeSuggestion(index) {
    if (!this.currentSuggestions) this.currentSuggestions = [];
    this.currentSuggestions.splice(index, 1);
    this.renderSuggestions();
  }

  static async saveWidgetSettings() {
    try {
      const greetingInput = document.getElementById('greeting-message');
      const greetingMessage = greetingInput?.value?.trim();

      if (!greetingMessage) {
        this.showNotification('Please enter a greeting message', 'error');
        return;
      }

      // Filter out empty suggestions
      const suggestions = (this.currentSuggestions || [])
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (suggestions.length === 0) {
        this.showNotification('Please add at least one suggestion question', 'error');
        return;
      }

      const saveBtn = document.getElementById('save-widget-btn');
      const originalContent = saveBtn?.innerHTML;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Saving Changes...</span>';
      }

      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        this.showNotification('Please login again - session expired', 'error');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
        return;
      }
      
      const res = await fetch('/api/widget-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          greetingMessage,
          suggestions
        })
      });

      const { success, message, error } = await res.json();

      if (success) {
        this.showNotification(message || 'Widget settings saved successfully!', 'success');
        await this.loadWidgetSettings();
      } else {
        // Check if it's an auth error
        if (res.status === 401 || res.status === 403) {
          this.showNotification('Session expired - please login again', 'error');
          setTimeout(() => {
            window.location.href = '/admin/login';
          }, 2000);
          return;
        }
        throw new Error(error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving widget settings:', error);
      this.showNotification('Failed to save widget settings: ' + error.message, 'error');
    } finally {
      const saveBtn = document.getElementById('save-widget-btn');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i><span>Save Changes</span>';
      }
    }
  }

  static showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('widget-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'widget-notification';
    
    const colors = {
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      info: 'bg-amber-500'
    };

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };

    notification.className = `fixed top-24 right-8 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-slideIn`;
    notification.innerHTML = `
      <i class="fas ${icons[type]} text-xl"></i>
      <span class="font-medium">${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}
