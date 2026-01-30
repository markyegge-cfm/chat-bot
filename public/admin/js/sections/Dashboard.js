class Dashboard {
   static render() {
      return `
      <div class="px-8 py-8 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
            <p class="text-slate-500 mt-1 text-base">Real-time overview of system performance and knowledge base.</p>
          </div>
          <div class="flex items-center gap-3">
             <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                System Operational
             </span>
             <button onclick="Dashboard.loadStats()" class="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Refresh Data">
                <i class="fas fa-sync-alt"></i>
             </button>
          </div>
        </div>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <!-- Knowledge Card -->
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300 group">
            <div class="flex justify-between items-start mb-4">
               <div class="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <i class="fas fa-book text-blue-600 text-xl"></i>
               </div>
               <span class="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Total Files</span>
            </div>
            <div>
               <h3 class="text-3xl font-bold text-slate-800 mb-1" id="dash-total-files">0</h3>
               <p class="text-sm text-slate-500">Knowledge Base Assets</p>
            </div>
          </div>

          <!-- Conversations Card -->
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300 group">
            <div class="flex justify-between items-start mb-4">
               <div class="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <i class="fas fa-comments text-indigo-600 text-xl"></i>
               </div>
               <span class="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">All Time</span>
            </div>
             <div>
               <h3 class="text-3xl font-bold text-slate-800 mb-1" id="dash-conv-count">0</h3>
               <p class="text-sm text-slate-500">Total Conversations</p>
            </div>
          </div>

           <!-- Escalations Card -->
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300 group">
            <div class="flex justify-between items-start mb-4">
               <div class="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                  <i class="fas fa-exclamation-triangle text-amber-600 text-xl"></i>
               </div>
               <span class="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Action Required</span>
            </div>
             <div>
               <h3 class="text-3xl font-bold text-slate-800 mb-1" id="dash-escalations">0</h3>
               <p class="text-sm text-slate-500">Pending Escalations</p>
            </div>
          </div>

           <!-- AI Health Card (Mock) -->
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300 group">
            <div class="flex justify-between items-start mb-4">
               <div class="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                  <i class="fas fa-robot text-purple-600 text-xl"></i>
               </div>
               <span class="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Status</span>
            </div>
             <div>
               <div class="flex items-baseline gap-2">
                  <h3 class="text-xl font-bold text-slate-800 mb-1">Active</h3>
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
               </div>
               <p class="text-sm text-slate-500">Vertex AI Model</p>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           <!-- Trend Chart -->
           <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <i class="fas fa-chart-line text-blue-500"></i> Escalation Trends
              </h3>
              <div class="relative h-80 w-full">
                 <canvas id="activiyChart"></canvas>
              </div>
           </div>

           <!-- Distribution Chart -->
           <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <i class="fas fa-pie-chart text-indigo-500"></i> Knowledge Types
              </h3>
              <div class="relative flex-1 flex items-center justify-center min-h-[300px]">
                 <canvas id="distributionChart"></canvas>
              </div>
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
         const result = await res.json();
         if (!result.success) throw new Error(result.error || 'Failed to load stats');

         const data = result.data || {};
         const knowledge = data.knowledge || { totalFiles: 0, byType: {} };
         const conv = data.conversations || { total: 0 };
         const esc = data.escalations || { total: 0, items: [] };

         // Update Text Stats
         this.animateValue('dash-total-files', 0, knowledge.totalFiles || 0, 1000);
         this.animateValue('dash-conv-count', 0, conv.total || 0, 1000);
         this.animateValue('dash-escalations', 0, esc.total || 0, 1000);

         // Render Charts
         this.renderCharts(knowledge, esc.items || []);

      } catch (error) {
         console.error('Failed to load dashboard stats:', error);
      }
   }

   static animateValue(id, start, end, duration) {
      const obj = document.getElementById(id);
      if (!obj) return;
      let startTimestamp = null;
      const step = (timestamp) => {
         if (!startTimestamp) startTimestamp = timestamp;
         const progress = Math.min((timestamp - startTimestamp) / duration, 1);
         obj.innerHTML = Math.floor(progress * (end - start) + start);
         if (progress < 1) {
            window.requestAnimationFrame(step);
         }
      };
      window.requestAnimationFrame(step);
   }

   static renderCharts(knowledgeData, escalationsData) {
      // 1. Knowledge Distribution Chart (Doughnut)
      const ctxDist = document.getElementById('distributionChart');
      if (ctxDist) {
         // Destroy existing if any (simplistic approach, assumes re-render calls renderCharts)
         if (window.distChartInstance) window.distChartInstance.destroy();

         const dataValues = [
            (knowledgeData.byType && knowledgeData.byType.pdf) || 0,
            (knowledgeData.byType && knowledgeData.byType.manual) || 0,
            (knowledgeData.byType && knowledgeData.byType.csv) || 0,
            (knowledgeData.byType && knowledgeData.byType.docx) || 0,
         ];

         window.distChartInstance = new Chart(ctxDist, {
            type: 'doughnut',
            data: {
               labels: ['PDF Documents', 'Manual Entries', 'CSV Data', 'DOCX Files'],
               datasets: [{
                  data: dataValues,
                  backgroundColor: [
                     '#3B82F6', // Blue
                     '#10B981', // Emerald
                     '#F59E0B', // Amber
                     '#6366F1'  // Indigo
                  ],
                  borderWidth: 0,
                  hoverOffset: 4
               }]
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     position: 'bottom',
                     labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                           family: "'Outfit', sans-serif",
                           size: 12
                        }
                     }
                  }
               },
               cutout: '70%'
            }
         });
      }

      // 2. Activity/Trend Chart (Line)
      const ctxActivity = document.getElementById('activiyChart');
      if (ctxActivity) {
         if (window.activityChartInstance) window.activityChartInstance.destroy();

         // Process escalations data to get counts per day
         const daysMap = {};
         // Initialize last 7 days with 0
         for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            daysMap[dateStr] = 0;
         }

         // Fill with actual data
         escalationsData.forEach(item => {
            if (item.date) {
               const d = new Date(item.date);
               const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
               if (daysMap.hasOwnProperty(dateStr)) {
                  daysMap[dateStr]++;
               }
            }
         });

         const labels = Object.keys(daysMap);
         const data = Object.values(daysMap);

         window.activityChartInstance = new Chart(ctxActivity, {
            type: 'line',
            data: {
               labels: labels,
               datasets: [{
                  label: 'Escalations',
                  data: data,
                  borderColor: '#F59E0B',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointBackgroundColor: '#fff',
                  pointBorderColor: '#F59E0B',
                  pointBorderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6
               }]
            },
            options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                  legend: {
                     display: false
                  },
                  tooltip: {
                     backgroundColor: '#1E293B',
                     padding: 12,
                     titleFont: {
                        size: 13,
                        family: "'Outfit', sans-serif"
                     },
                     bodyFont: {
                        size: 13,
                        family: "'Outfit', sans-serif"
                     },
                     displayColors: false,
                     callbacks: {
                        label: (context) => ` ${context.parsed.y} Escalations`
                     }
                  }
               },
               scales: {
                  y: {
                     beginAtZero: true,
                     grid: {
                        color: '#F1F5F9',
                        drawBorder: false
                     },
                     ticks: {
                        stepSize: 1,
                        font: {
                           family: "'Outfit', sans-serif",
                           size: 11
                        },
                        color: '#94A3B8'
                     }
                  },
                  x: {
                     grid: {
                        display: false
                     },
                     ticks: {
                        font: {
                           family: "'Outfit', sans-serif",
                           size: 11
                        },
                        color: '#94A3B8'
                     }
                  }
               }
            }
         });
      }
   }
}

