class Conversations {
   static allConversations = [];
   static selectedIds = new Set();
   static currentConversationId = null;

   // Pagination State
   static currentPage = 1;
   static itemsPerPage = 20;
   static totalItems = 0;
   static totalPages = 1;
   static dateFilter = 'all';

   static render() {
      return `
      <div class="flex h-[calc(100vh-70px)] bg-white responsive-conversations-container">
        <!-- Messages Sidebar (Left) -->
        <div class="w-[380px] flex flex-col border-r border-gray-100 flex-shrink-0 responsive-conversations-list relative z-10">
          <div class="p-6 pb-2">
            <h2 class="text-[20px] font-bold text-gray-900 tracking-tight mb-4">Messages</h2>
            
            <!-- Filter Controls -->
            <div class="flex flex-col gap-3 mb-2">
               <div class="relative">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <circle cx="11" cy="11" r="8"></circle>
                     <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input type="text" id="conv-search" placeholder="Search current page..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#E5A000] transition-all">
               </div>
               
               <div class="relative">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                     <line x1="16" y1="2" x2="16" y2="6"></line>
                     <line x1="8" y1="2" x2="8" y2="6"></line>
                     <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <select id="conv-date-filter" class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#E5A000] transition-all appearance-none cursor-pointer bg-white">
                     <option value="all">All Time</option>
                     <option value="today">Today</option>
                     <option value="yesterday">Yesterday</option>
                     <option value="week">Last 7 Days</option>
                     <option value="month">Last 30 Days</option>
                  </select>
                  <svg class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
               </div>
               
               <div class="flex items-center gap-2">
                  <button id="conv-delete-selected" class="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                     Delete
                  </button>
                  <button id="conv-delete-all" class="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Delete All</button>
               </div>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto pl-0 space-y-0" id="conversations-list">
            <!-- Conversations will be loaded here by JavaScript -->
            <div class="p-8 text-center">
               <div class="animate-spin inline-block w-6 h-6 border-2 border-gray-200 border-t-[#E5A000] rounded-full mb-2"></div>
               <p class="text-gray-400 text-sm">Loading conversations...</p>
            </div>
          </div>

          <!-- Pagination Footer -->
          <div class="p-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
             <div class="flex justify-between items-center text-[11px] font-medium text-gray-500">
                <span id="conv-page-info">Page 1 of 1</span>
                
                <div class="relative">
                   <select id="conv-limit-select" class="appearance-none bg-white border border-gray-200 rounded px-2 py-1 pr-6 focus:outline-none focus:border-gray-300 cursor-pointer text-gray-700 text-[11px]">
                      <option value="10">10 / page</option>
                      <option value="20" selected>20 / page</option>
                      <option value="50">50 / page</option>
                   </select>
                   <svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                   </svg>
                </div>
             </div>
             
             <div class="flex items-center justify-between gap-1">
                <button id="conv-first-btn" class="flex-1 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white/50" disabled>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                </button>
                <button id="conv-prev-btn" class="flex-1 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white/50" disabled>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button id="conv-next-btn" class="flex-1 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white/50" disabled>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
                <button id="conv-last-btn" class="flex-1 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white/50" disabled>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                </button>
             </div>
          </div>
        </div>

        <!-- Chat Area (Right) -->
            <div class="flex-1 flex flex-col min-w-0 bg-white responsive-conversation-chat relative z-0">
               <!-- Mobile header (Back button + Title) -->
               <div class="conversation-mobile-header" style="display:none; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #E2E8F0; background: #fff; position: sticky; top: 0; z-index: 20;">
                  <button class="back-to-list-btn" aria-label="Back to list" style="background:transparent;border:none;font-size:18px;cursor:pointer;padding:6px;">&larr;</button>
                  <h3 class="conversation-title" style="margin:0;font-size:16px;font-weight:600;">Select a conversation</h3>
                  <div style="width:32px;"></div>
               </div>
               
               <!-- Messages Feed (Empty State Initially) -->
               <div class="flex-1 overflow-y-auto p-8 space-y-8" id="conversation-messages">
                  <div class="flex items-center justify-center h-full text-center">
                     <div>
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p class="text-gray-400 text-[14px]">Select a conversation to view messages</p>
                     </div>
                  </div>
               </div>

               <!-- Bottom Action -->
               <div id="join-bar-container" class="join-conversation-bar p-8 border-t border-gray-100 hidden">
                   <button class="w-full bg-[#E5A000] hover:bg-[#D49000] text-white font-bold py-4 rounded-xl shadow-sm transition-all text-[15px]" id="join-conversation-btn" style="display: none;">
                      Join Conversation
                   </button>
               </div>
        </div>
        
        <style>
           .conversation-item.active {
               background-color: #f3f4f6 !important;
               border-left: 4px solid #E5A000 !important;
           }
           
           /* Markdown styling for bot messages */
           .bot-message-content h1,
           .bot-message-content h2,
           .bot-message-content h3 {
               margin-top: 12px;
               margin-bottom: 8px;
               font-weight: 700;
               color: #111;
               line-height: 1.3;
           }
           
           .bot-message-content p {
               margin: 8px 0;
               line-height: 1.6;
           }
           
           .bot-message-content ul,
           .bot-message-content ol {
               margin: 8px 0;
               padding-left: 24px;
           }
           
           .bot-message-content li {
               margin: 4px 0;
               line-height: 1.6;
           }
           
           .bot-message-content code {
               background: #f3f4f6;
               padding: 2px 6px;
               border-radius: 4px;
               font-family: 'Courier New', monospace;
               font-size: 13px;
           }
           
           .bot-message-content pre {
               background: #f3f4f6;
               padding: 12px;
               border-radius: 8px;
               overflow-x: auto;
               margin: 8px 0;
           }
           
           .bot-message-content pre code {
               background: transparent;
               padding: 0;
           }
           
           .bot-message-content a {
               color: #E5A000;
               text-decoration: underline;
           }
           
           .bot-message-content a:hover {
               color: #D49000;
           }
           
           .bot-message-content blockquote {
               border-left: 3px solid #E5A000;
               padding-left: 12px;
               margin: 8px 0;
               color: #666;
               font-style: italic;
           }
           
           @media (max-width: 768px) {
              .responsive-conversation-chat {
                 max-height: 100vh !important;
                 height: calc(100vh - 70px) !important;
                 position: fixed !important;
                 top: 70px !important;
                 left: 0 !important;
                 right: 0 !important;
                 bottom: 0 !important;
                 z-index: 50 !important;
              }
              .responsive-conversations-list {
                 max-height: none !important;
                 width: 100% !important;
              }
           }
        </style>
      </div>
    `;
   }

   static afterRender() {
      this.allConversations = [];
      // Initialize pagination defaults
      this.currentPage = 1;
      this.itemsPerPage = 20;

      this.setupListeners();
      this.loadConversations();
   }

   static setupListeners() {
      // Search listener
      const searchInput = document.getElementById('conv-search');
      if (searchInput) {
         searchInput.addEventListener('input', () => this.filterConversations());
      }

      // Date filter listener
      const dateFilter = document.getElementById('conv-date-filter');
      if (dateFilter) {
         dateFilter.addEventListener('change', (e) => {
            this.dateFilter = e.target.value;
            this.filterConversations();
         });
      }

      // Pagination listeners
      const limitSelect = document.getElementById('conv-limit-select');
      if (limitSelect) {
         limitSelect.value = this.itemsPerPage;
         limitSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadConversations();
         });
      }

      document.getElementById('conv-first-btn')?.addEventListener('click', () => { this.currentPage = 1; this.loadConversations(); });
      document.getElementById('conv-prev-btn')?.addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage--; this.loadConversations(); } });
      document.getElementById('conv-next-btn')?.addEventListener('click', () => { if (this.currentPage < this.totalPages) { this.currentPage++; this.loadConversations(); } });
      document.getElementById('conv-last-btn')?.addEventListener('click', () => { this.currentPage = this.totalPages; this.loadConversations(); });

      // Delete buttons listeners
      const deleteSelectedBtn = document.getElementById('conv-delete-selected');
      const deleteAllBtn = document.getElementById('conv-delete-all');

      if (deleteSelectedBtn) {
         deleteSelectedBtn.addEventListener('click', async () => {
            await this.deleteSelected();
         });
      }

      if (deleteAllBtn) {
         deleteAllBtn.addEventListener('click', async () => {
            await this.deleteAll();
         });
      }
   }

   static async loadConversations() {
      try {
         const list = document.getElementById('conversations-list');
         if (list) {
            if (this.allConversations.length === 0) {
               list.innerHTML = `
                  <div class="h-full flex items-center justify-center p-8">
                     <div class="animate-spin inline-block w-6 h-6 border-2 border-gray-200 border-t-[#E5A000] rounded-full"></div>
                  </div>
               `;
            }
         }

         console.log(`📊 Fetching conversations page ${this.currentPage}, limit ${this.itemsPerPage}...`);
         const data = await window.apiService.adminGetConversations(this.currentPage, this.itemsPerPage);

         if (data && (data.success || Array.isArray(data.conversations))) {
            this.allConversations = data.conversations || [];
            this.totalItems = data.total || 0;
            this.totalPages = data.totalPages || Math.ceil(this.totalItems / this.itemsPerPage) || 1;

            this.selectedIds.clear();
            this.renderConversationList(this.allConversations);
            this.updatePaginationControls();

            // Handle deep linking to a specific session (e.g. #conversations/<sessionId> or #conversations/<sessionId>/<encodedQuery>)
            if (window.app && window.app.currentParams && window.app.currentParams[0]) {
               try {
                  const sessionId = window.app.currentParams[0];
                  // Try to find the conversation in the currently loaded page
                  const convoElem = document.querySelector(`[data-conversation-id="${sessionId}"]`);
                  if (convoElem) {
                     // Make it active in the list
                     document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                     convoElem.classList.add('active');

                     const h3 = convoElem.querySelector('h3');
                     const titleText = h3 ? h3.textContent : 'Conversation';
                     if (document.querySelector('.conversation-title')) {
                        document.querySelector('.conversation-title').textContent = titleText;
                     }

                     this.currentConversationId = sessionId;
                     // Load messages for the conversation
                     await this.loadConversationMessages(sessionId);

                     // If there's an encoded query parameter (e.g. question), try to highlight the matching message
                     if (window.app.currentParams[1]) {
                        const q = decodeURIComponent(window.app.currentParams[1]);
                        const messagesContainer = document.getElementById('conversation-messages');
                        if (messagesContainer) {
                           // Wait briefly to ensure messages are rendered
                           setTimeout(() => {
                              // Search for the first element that contains the query text
                              const candidates = Array.from(messagesContainer.querySelectorAll('*')).filter(el => el.innerText && el.innerText.includes(q));
                              if (candidates.length) {
                                 const el = candidates[0];
                                 el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                 el.classList.add('ring', 'ring-amber-300');
                                 setTimeout(() => el.classList.remove('ring', 'ring-amber-300'), 4000);
                              }
                           }, 250);
                        }
                     }
                  } else {
                     // Conversation not present on the current page. Inform the user to adjust filters/pages.
                     this.showToast('Conversation requested — if it does not appear, change page or filters to locate the session.', 'info');
                  }
               } catch (err) {
                  console.error('Deep link handling failed:', err);
               }
            }
         } else {
            if (list) list.innerHTML = '<div class="p-8 text-center text-gray-400 text-sm">No conversations found</div>';
         }
      } catch (error) {
         console.error('❌ Failed to load conversations:', error);
         this.showToast('Failed to load conversations', 'error');
         const list = document.getElementById('conversations-list');
         if (list) list.innerHTML = '<div class="p-8 text-center text-red-400 text-sm">Error loading data</div>';
      }
   }

   static updatePaginationControls() {
      const pageInfo = document.getElementById('conv-page-info');
      const firstBtn = document.getElementById('conv-first-btn');
      const prevBtn = document.getElementById('conv-prev-btn');
      const nextBtn = document.getElementById('conv-next-btn');
      const lastBtn = document.getElementById('conv-last-btn');
      const deleteSelectedBtn = document.getElementById('conv-delete-selected');
      const deleteAllBtn = document.getElementById('conv-delete-all');

      if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;

      if (firstBtn) firstBtn.disabled = this.currentPage <= 1;
      if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
      if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
      if (lastBtn) lastBtn.disabled = this.currentPage >= this.totalPages;

      // Update delete buttons state based on availability of data
      if (deleteAllBtn) deleteAllBtn.disabled = this.totalItems === 0;
      if (deleteSelectedBtn) {
         deleteSelectedBtn.disabled = this.selectedIds.size === 0;
         const svgIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
         deleteSelectedBtn.innerHTML = this.selectedIds.size > 0
            ? `${svgIcon}<span class="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">${this.selectedIds.size}</span> Delete`
            : `${svgIcon}Delete`;
      }
   }

   static filterConversations() {
      const searchInput = document.getElementById('conv-search');
      const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

      const filtered = this.allConversations.filter(conv => {
         // Search filter
         const matchesSearch = !searchTerm || 
            conv.title?.toLowerCase().includes(searchTerm) ||
            conv.id.toLowerCase().includes(searchTerm) ||
            (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm));

         if (!matchesSearch) return false;

         // Date filter
         if (this.dateFilter === 'all') return true;

         let convDate;
         if (conv.startedAt && typeof conv.startedAt === 'object' && conv.startedAt._seconds) {
            convDate = new Date(conv.startedAt._seconds * 1000);
         } else if (conv.startedAt && typeof conv.startedAt === 'string') {
            convDate = new Date(conv.startedAt);
         } else {
            return true; // If no date, include it
         }

         const now = new Date();
         const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
         const yesterdayStart = new Date(todayStart);
         yesterdayStart.setDate(yesterdayStart.getDate() - 1);
         const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
         const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

         switch (this.dateFilter) {
            case 'today':
               return convDate >= todayStart;
            case 'yesterday':
               return convDate >= yesterdayStart && convDate < todayStart;
            case 'week':
               return convDate >= weekAgo;
            case 'month':
               return convDate >= monthAgo;
            default:
               return true;
         }
      });

      this.renderConversationList(filtered);
   }

   static renderConversationList(conversations) {
      const container = document.getElementById('conversations-list');
      if (!container) return;

      if (conversations.length === 0) {
         container.innerHTML = '<div class="p-8 text-center text-gray-400 text-sm">No conversations on this page</div>';
         return;
      }

      const html = conversations.map((conv) => {
         let startTime;
         if (conv.startedAt && typeof conv.startedAt === 'object' && conv.startedAt._seconds) {
            startTime = new Date(conv.startedAt._seconds * 1000);
         } else if (conv.startedAt && typeof conv.startedAt === 'string') {
            startTime = new Date(conv.startedAt);
         } else {
            startTime = new Date();
         }

         const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         const dateShort = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

         let title = conv.title;
         if (!title || title.startsWith('Visitor')) {
            title = conv.topic || `Chat ${dateShort}`;
         }
         if (!title) title = `Visitor ${conv.id.substring(0, 4)}`;

         // Generate avatar with initials and color
         const getAvatarData = (id, title) => {
            const colors = [
               '#E5A000', // Gold
               '#3B82F6', // Blue
               '#10B981', // Green
               '#F59E0B', // Amber
               '#8B5CF6', // Purple
               '#EF4444', // Red
               '#06B6D4', // Cyan
               '#EC4899', // Pink
            ];
            const colorIndex = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
            const bgColor = colors[colorIndex];
            
            // Get initials from title
            const words = title.split(' ').filter(w => w.length > 0);
            let initials = 'U';
            if (words.length >= 2) {
               initials = (words[0][0] + words[1][0]).toUpperCase();
            } else if (words.length === 1 && words[0].length > 0) {
               initials = words[0].substring(0, 2).toUpperCase();
            }
            
            return { initials, bgColor };
         };

         const { initials, bgColor } = getAvatarData(conv.id, title);

         return `
            <div class="group flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all relative overflow-hidden conversation-item" data-conversation-id="${conv.id}">
               <div class="pt-1" onclick="event.stopPropagation()">
                  <input type="checkbox" class="conv-row-checkbox w-4 h-4 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer" data-id="${conv.id}" ${this.selectedIds.has(String(conv.id)) ? 'checked' : ''}>
               </div>
                     <div class="relative flex-shrink-0">
                                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm" style="background-color: ${bgColor};" title="${this.escapeHtml(title)}">
                                                          <!-- Robot avatar (SVG) - white stroke/icon for visibility -->
                                                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                             <!-- Head outline -->
                                                             <rect x="4" y="6" width="16" height="10" rx="2" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linejoin="round" />
                                                             <!-- Antenna/head top -->
                                                             <rect x="9" y="3.6" width="6" height="3" rx="0.8" stroke="#FFFFFF" stroke-width="1.4" fill="none" />
                                                             <!-- Eyes (small filled dots for contrast) -->
                                                             <circle cx="9.5" cy="11.5" r="0.9" fill="#FFFFFF" />
                                                             <circle cx="14.5" cy="11.5" r="0.9" fill="#FFFFFF" />
                                                             <!-- Mouth line -->
                                                             <line x1="9.5" y1="14.2" x2="14.5" y2="14.2" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" />
                                                          </svg>
                                  </div>
                               </div>
               <div class="flex-1 min-w-0">
                 <div class="flex justify-between items-baseline mb-0.5">
                   <h3 class="text-[13px] font-bold text-gray-900 truncate pr-2">${this.escapeHtml(title)}</h3>
                   <span class="text-[10px] text-gray-400 font-medium shrink-0">${dateShort}</span>
                 </div>
                 <p class="text-[12px] text-gray-500 truncate leading-relaxed">${this.escapeHtml(conv.lastMessage || 'No messages')}</p>
               </div>
            </div>
         `;
      }).join('');

      container.innerHTML = html;
      this.setupConversationListeners();
   }

   static setupConversationListeners() {
      const conversationItems = document.querySelectorAll('.conversation-item');
      const conversationList = document.querySelector('.responsive-conversations-list');
      const conversationChat = document.querySelector('.responsive-conversation-chat');
      const mobileHeader = document.querySelector('.conversation-mobile-header');
      const sidebar = document.querySelector('.sidebar');
      const backBtn = mobileHeader && mobileHeader.querySelector('.back-to-list-btn');

      const isMobile = () => window.innerWidth <= 768;

      conversationItems.forEach(item => {
         item.addEventListener('click', async () => {
            conversationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const conversationId = item.dataset.conversationId;
            const h3 = item.querySelector('h3');
            const titleText = h3 ? h3.textContent : 'Conversation';

            if (document.querySelector('.conversation-title')) {
               document.querySelector('.conversation-title').textContent = titleText;
            }

            this.currentConversationId = conversationId;
            await this.loadConversationMessages(conversationId);

            if (isMobile()) {
               conversationList.classList.add('hidden');
               conversationChat.classList.add('show');
               if (mobileHeader) mobileHeader.style.display = 'flex';
               if (sidebar) sidebar.style.display = 'none';
            }
         });

         // Context menu for delete
         item.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            const sessionId = item.dataset.conversationId;
            const ok = await this.showConfirm('Delete this conversation?');
            if (ok) {
               await this.deleteConversation(sessionId);
            }
         });
      });

      if (backBtn) {
         backBtn.addEventListener('click', () => {
            if (isMobile()) {
               conversationList.classList.remove('hidden');
               conversationChat.classList.remove('show');
               if (mobileHeader) mobileHeader.style.display = 'none';
               if (sidebar) sidebar.style.display = 'flex';
            }
         });
      }

      // Checkbox listeners
      document.querySelectorAll('.conv-row-checkbox').forEach(cb => {
         cb.addEventListener('change', (e) => {
            const id = cb.dataset.id;
            if (cb.checked) {
               this.selectedIds.add(String(id));
            } else {
               this.selectedIds.delete(String(id));
            }

            this.updatePaginationControls(); // Update delete button counts
         });
      });
   }

   static async loadConversationMessages(conversationId) {
      const messagesContainer = document.getElementById('conversation-messages');

      try {
         messagesContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
               <div class="text-center">
                  <div class="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-[#E5A000] rounded-full mb-2"></div>
                  <p class="text-gray-400 text-[14px]">Loading messages...</p>
               </div>
            </div>
         `;

         const messages = await window.apiService.getConversationMessages(conversationId);

         if (!messages || messages.length === 0) {
            messagesContainer.innerHTML = `
               <div class="flex items-center justify-center h-full">
                  <p class="text-gray-400 text-[14px]">No messages in this conversation</p>
               </div>
            `;
            return;
         }

         this.renderMessages(messages);
      } catch (error) {
         console.error('Failed to load messages:', error);
         messagesContainer.innerHTML = `
            <div class="flex items-center justify-center h-full text-center">
               <div>
                  <p class="text-red-500 text-[14px]">Failed to load messages</p>
               </div>
            </div>
         `;
      }
   }

   static renderMessages(messages) {
      const messagesContainer = document.getElementById('conversation-messages');

      const html = messages.map(msg => {
         const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         const isUser = msg.sender === 'user';

         if (isUser) {
            return `
               <div class="flex justify-end gap-3 mb-6">
                  <div class="flex flex-col items-end max-w-[85%]">
                     <div class="bg-gray-100 rounded-2xl rounded-tr-sm px-5 py-3">
                        <p class="text-[14px] text-gray-800 leading-relaxed">${this.escapeHtml(msg.content)}</p>
                     </div>
                     <span class="text-[10px] text-gray-400 mt-1 mr-1">${timestamp}</span>
                  </div>
               </div>
             `;
         } else {
            return `
               <div class="flex gap-3 mb-6 max-w-[85%]">
                  <div class="w-8 h-8 rounded-full bg-[#E5A000] flex items-center justify-center flex-shrink-0 text-white shadow-sm overflow-hidden">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                  </div>
                  <div class="flex flex-col">
                     <div class="border border-gray-100 rounded-2xl rounded-tl-sm p-5 shadow-sm bg-white bot-message-content">
                        ${this.parseMarkdown(msg.content)}
                     </div>
                     <span class="text-[10px] text-gray-400 mt-1 ml-1">${timestamp}</span>
                  </div>
               </div>
             `;
         }
      }).join('');

      messagesContainer.innerHTML = html;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
   }

   /**
    * Parse markdown to HTML for bot messages
    */
   static parseMarkdown(text) {
      if (!text) return '';
      
      // Escape HTML first
      text = text.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;');

      // Headers
      text = text.replace(/^### (.*?)$/gm, '<h3 class="text-[15px] font-bold text-gray-900 mt-3 mb-2">$1</h3>');
      text = text.replace(/^## (.*?)$/gm, '<h2 class="text-[16px] font-bold text-gray-900 mt-3 mb-2">$1</h2>');
      text = text.replace(/^# (.*?)$/gm, '<h1 class="text-[18px] font-bold text-gray-900 mt-3 mb-2">$1</h1>');

      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
      text = text.replace(/__(.*?)__/g, '<strong class="font-bold text-gray-900">$1</strong>');

      // Italic
      text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
      text = text.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

      // Code blocks
      text = text.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2"><code class="text-[13px] font-mono">$1</code></pre>');

      // Inline code
      text = text.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>');

      // Links
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-[#E5A000] underline hover:text-[#D49000]">$1</a>');

      // Unordered lists
      text = text.replace(/^\* (.*?)$/gm, '<li class="ml-4">$1</li>');
      text = text.replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>');
      text = text.replace(/(<li class="ml-4">.*<\/li>\n?)+/g, '<ul class="list-disc ml-4 my-2 space-y-1">$&</ul>');

      // Ordered lists
      text = text.replace(/^\d+\. (.*?)$/gm, '<li class="ml-4">$1</li>');
      
      // Blockquotes
      text = text.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-[#E5A000] pl-3 italic text-gray-600 my-2">$1</blockquote>');

      // Line breaks
      text = text.replace(/\n\n/g, '</p><p class="text-[14px] text-gray-700 leading-relaxed my-2">');
      text = text.replace(/\n/g, '<br>');

      // Wrap in paragraphs if not already in block element
      if (!text.match(/^<(h[1-6]|ul|ol|pre|blockquote)/)) {
         text = '<p class="text-[14px] text-gray-700 leading-relaxed">' + text + '</p>';
      }

      return text;
   }

   static async deleteConversation(sessionId) {
      try {
         const res = await fetch(`/api/conversations/${sessionId}`, { method: 'DELETE' });
         const result = await res.json();
         if (result.success) {
            this.showToast('Conversation deleted', 'success');
            await this.loadConversations();

            // Clear view if deleted currently viewed
            if (this.currentConversationId === sessionId) {
               document.getElementById('conversation-messages').innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-gray-400 text-sm">Select a conversation</p></div>';
            }
         } else {
            this.showToast('Failed to delete', 'error');
         }
      } catch (err) {
         console.error(err);
         this.showToast('Error deleting conversation', 'error');
      }
   }

   static async deleteSelected() {
      if (this.selectedIds.size === 0) {
         this.showToast('No conversations selected', 'info');
         return;
      }

      const ok = await this.showConfirm(`Delete ${this.selectedIds.size} selected conversation${this.selectedIds.size > 1 ? 's' : ''}?`);
      if (!ok) return;

      try {
         const ids = Array.from(this.selectedIds);
         const res = await fetch('/api/conversations/batch-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
         });
         const result = await res.json();
         if (result.success) {
            this.showToast(`Deleted ${ids.length} conversation${ids.length > 1 ? 's' : ''}`, 'success');
            this.selectedIds.clear();
            await this.loadConversations();
         } else {
            this.showToast('Batch delete failed', 'error');
         }
      } catch (err) {
         console.error(err);
         this.showToast('Error in batch delete', 'error');
      }
   }

   static async deleteAll() {
      const ok = await this.showConfirm('Delete ALL conversations? This cannot be undone.');
      if (!ok) return;

      try {
         const res = await fetch('/api/conversations', { method: 'DELETE' });
         const result = await res.json();
         if (result.success) {
            this.showToast('All conversations deleted', 'success');
            this.selectedIds.clear();
            await this.loadConversations();
         } else {
            this.showToast('Delete all failed', 'error');
         }
      } catch (err) {
         console.error(err);
         this.showToast('Error deleting all', 'error');
      }
   }

   static showConfirm(message) {
      return new Promise((resolve) => {
         const overlay = document.createElement('div');
         overlay.className = 'fixed inset-0 bg-black/40 z-[300] flex items-center justify-center backdrop-blur-sm';

         const modal = document.createElement('div');
         modal.className = 'bg-white rounded-xl p-6 w-[400px] shadow-2xl text-center transform scale-100 transition-all';
         modal.innerHTML = `
            <div class="mb-4 text-amber-500 flex justify-center">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Action</h3>
            <p class="text-gray-600 mb-6 text-sm">${this.escapeHtml(message)}</p>
            <div class="flex gap-3 justify-center">
               <button class="px-4 py-2 rounded-lg bg-gray-100 font-medium text-gray-700 hover:bg-gray-200 transition-colors" id="confirm-cancel">Cancel</button>
               <button class="px-4 py-2 rounded-lg bg-red-600 font-medium text-white hover:bg-red-700 transition-colors shadow-sm" id="confirm-ok">Delete</button>
            </div>
         `;

         overlay.appendChild(modal);
         document.body.appendChild(overlay);

         const cleanup = (val) => {
            overlay.remove();
            resolve(val);
         };

         overlay.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
         overlay.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
         overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
      });
   }

   static showToast(message, type = 'info') {
      const toast = document.createElement('div');
      const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
      toast.className = `fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl text-white z-[400] transition-all duration-300 transform translate-y-[-20px] opacity-0 ${colors[type] || colors.info} flex items-center gap-3 font-medium text-sm`;
      toast.innerHTML = `<span>${message}</span>`;
      document.body.appendChild(toast);

      requestAnimationFrame(() => {
         toast.classList.remove('translate-y-[-20px]', 'opacity-0');
      });

      setTimeout(() => {
         toast.classList.add('translate-y-[-10px]', 'opacity-0');
         setTimeout(() => toast.remove(), 300);
      }, 3000);
   }

   static escapeHtml(text) {
      if (!text) return '';
      return text.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
   }
}