class Escalations {
   static render() {
      return `
      <div class="px-8 py-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
           <div class="flex items-center gap-3">
             <h1 class="text-[24px] font-bold text-[#1E293B]">Escalations Issues</h1>
             <span class="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md text-[13px] font-medium" id="escalations-count">12</span>
           </div>
        </div>

        <!-- Controls -->
        <div class="flex justify-between items-center gap-4 mb-6">
           <!-- Search Input -->
           <div class="relative flex-1">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search by Email, or Key words" class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[14px] placeholder-gray-400" id="escalations-search">
           </div>
           
           <!-- Sort Button -->
           <button class="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-[14px] font-medium transition-colors whitespace-nowrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="21" y1="10" x2="3" y2="10"></line>
                 <line x1="21" y1="6" x2="3" y2="6"></line>
                 <line x1="21" y1="14" x2="3" y2="14"></line>
                 <line x1="21" y1="18" x2="3" y2="18"></line>
              </svg>
              Sort by
           </button>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
           <table class="w-full">
              <thead class="bg-gray-50/50 border-b border-gray-100">
                 <tr>
                    <th class="w-16 p-5 text-center">
                       <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer">
                    </th>
                    <th class="text-left py-5 px-2 text-[13px] font-semibold text-gray-500">User</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">User Question</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Reason</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Issue date</th>
                    <th class="w-16 p-5"></th>
                 </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="escalations-table-body">
                 <tr><td colspan="6" class="p-4 text-center text-gray-400 text-sm">Loading...</td></tr>
              </tbody>
           </table>
        </div>

        <!-- Pagination -->
        <div class="flex justify-between items-center text-[13px] font-medium text-gray-600 px-2 mt-4">
           <div class="flex items-center gap-3">
              <span id="escalations-page-info">Page 1 of 4</span>
              <div class="relative">
                 <select class="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-gray-300 cursor-pointer text-gray-700 text-[13px]">
                    <option>8</option>
                    <option>16</option>
                    <option>24</option>
                 </select>
                 <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                 </svg>
              </div>
           </div>
           
           <div class="flex items-center gap-4">
              <span id="escalations-page-info2">Page 1 of 4</span>
              <div class="flex items-center gap-1">
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                 </button>
              </div>
           </div>
        </div>
      </div>
    `;
   }

   static renderRows(data = []) {
      if (data.length === 0) {
         return '<tr><td colspan="6" class="p-4 text-center text-gray-400 text-sm">No escalations found</td></tr>';
      }

      return data.map(row => `
      <tr class="group hover:bg-gray-50/50 transition-colors">
        <td class="p-5 text-center">
           <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity">
        </td>
        <td class="py-5 px-2">
           <div class="flex items-center gap-3">
             <span class="text-[15px] font-semibold text-gray-700">${this.escapeHtml(row.user)}</span>
           </div>
        </td>
        <td class="py-5 px-4 text-[14px] text-gray-600 font-medium max-w-md truncate">${this.escapeHtml(row.question || '-')}</td>
        <td class="py-5 px-4">
           <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[13px] font-medium ${this.getReasonBadgeClass(row.reason)}">
              <span class="w-2 h-2 rounded-full" style="background-color: ${this.getReasonColor(row.reason)}"></span>
              ${this.escapeHtml(row.reason || '-')}
           </span>
        </td>
        <td class="py-5 px-4 text-[14px] text-gray-500">${this.formatDate(row.date)}</td>
        <td class="p-5 text-center">
           <button class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="12" cy="12" r="1"></circle>
                 <circle cx="12" cy="5" r="1"></circle>
                 <circle cx="12" cy="19" r="1"></circle>
              </svg>
           </button>
        </td>
      </tr>
    `).join('');
   }

   static getReasonBadgeClass(reason) {
      if (reason === 'Low confidence') {
         return 'bg-orange-50 text-orange-700';
      }
      return 'bg-gray-100 text-gray-700';
   }

   static getReasonColor(reason) {
      if (reason === 'Low confidence') {
         return '#f39c12';
      }
      return '#cbd5e1';
   }

   static escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
   }

   static formatDate(dateStr) {
      if (!dateStr) return '-';
      try {
         const date = new Date(dateStr);
         return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
         });
      } catch {
         return dateStr;
      }
   }

   static async loadEscalations() {
      try {
         // Sample data matching the screenshot
         const escalations = [
            {
               user: 'cameron.w@ironkey.com',
               question: 'How can I verify if I have already purchased a course?',
               reason: 'Low confidence',
               date: '2025-12-29T05:43:00'
            },
            {
               user: 'floyd.miles@ironkey.com',
               question: 'How can I find the location of content within the Elite Course?',
               reason: 'Low confidence',
               date: '2025-12-12T01:36:00'
            },
            {
               user: 'bessie.cooper@ironkey.com',
               question: 'What should I do if I can see the next lesson but am unable to click it?',
               reason: 'Low confidence',
               date: '2025-11-18T03:41:00'
            },
            {
               user: 'annette.black@ironkey.com',
               question: 'It is not an option; I see the next lesson but am not able to click on it?',
               reason: 'Low confidence',
               date: '2025-11-14T12:01:00'
            },
            {
               user: 'kristin.watson@ironkey.com',
               question: 'What should I do if I\'m having trouble playing a video?',
               reason: 'Low confidence',
               date: '2025-10-11T11:16:00'
            },
            {
               user: 'courtney.henry@ironkey.com',
               question: 'What program includes a WhatsApp community?',
               reason: 'Low confidence',
               date: '2025-10-02T10:51:00'
            },
            {
               user: 'darrell.steward@ironkey.com',
               question: 'Is there a community with the Elite course?',
               reason: 'Low confidence',
               date: '2025-09-12T05:16:00'
            },
            {
               user: 'jenny.wilson@ironkey.com',
               question: 'Is the Elite program suitable for international customers?',
               reason: 'Low confidence',
               date: '2025-09-12T02:41:00'
            }
         ];
         
         // Update UI
         document.getElementById('escalations-count').textContent = escalations.length;
         document.getElementById('escalations-table-body').innerHTML = this.renderRows(escalations);
         document.getElementById('escalations-page-info').textContent = `Page 1 of ${Math.ceil(escalations.length / 8) || 1}`;
         document.getElementById('escalations-page-info2').textContent = `Page 1 of ${Math.ceil(escalations.length / 8) || 1}`;
      } catch (error) {
         console.error('Failed to load escalations:', error);
         document.getElementById('escalations-table-body').innerHTML = 
            '<tr><td colspan="6" class="p-4 text-center text-red-500 text-sm">Failed to load escalations</td></tr>';
      }
   }

   static afterRender() {
      // Load escalations
      this.loadEscalations();

      // Add search functionality
      const searchInput = document.getElementById('escalations-search');
      if (searchInput) {
         searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            // Add search logic here when connected to backend
            console.log('Searching for:', query);
         });
      }
   }
}
