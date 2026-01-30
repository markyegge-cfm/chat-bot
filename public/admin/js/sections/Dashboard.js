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
      

         
          </div>
        </div>
      </div>
    `;
  }

  static async afterRender() {
    await this.loadStats();
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
}
