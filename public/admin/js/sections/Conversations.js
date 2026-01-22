class Conversations {
   static render() {
      return `
      <div class="flex h-[calc(100vh-70px)] bg-white responsive-conversations-container">
        <!-- Messages Sidebar (Left) -->
        <div class="w-[380px] flex flex-col border-r border-gray-100 flex-shrink-0 responsive-conversations-list">
          <div class="p-8 pb-4">
            <h2 class="text-[20px] font-bold text-gray-900 tracking-tight">Messages</h2>
          </div>
          
          <div class="flex-1 overflow-y-auto pl-4 space-y-2 pr-0">
            <!-- Active Conversation -->
            <div class="group flex items-start gap-4 p-4 rounded-l-2xl rounded-r-none bg-gray-100 cursor-pointer border-transparent hover:bg-gray-100 transition-all relative overflow-hidden mr-0 conversation-item active" data-conversation-id="73c72">
               
               <div class="relative">
                 <div class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                   #7
                 </div>
                 <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#27ae60] rounded-full border-2 border-white"></div>
               </div>
               <div class="flex-1 min-w-0 pr-4">
                 <div class="flex justify-between items-baseline mb-1">
                   <h3 class="text-[14px] font-bold text-gray-900 font-mono">#73c72</h3>
                   <span class="text-[12px] text-gray-500 font-medium">3:15 PM</span>
                 </div>
                 <p class="text-[13px] text-gray-500 truncate leading-relaxed">let's say it does - what happens if I...</p>
               </div>
            </div>

            <!-- Conversation Item -->
            <div class="group flex items-start gap-4 p-4 rounded-l-2xl rounded-r-none hover:bg-gray-50 cursor-pointer transition-all border-l-4 border-transparent mr-0 conversation-item" data-conversation-id="18nc23">
               <div class="relative">
                 <div class="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                   #1
                 </div>
                 <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#27ae60] rounded-full border-2 border-white"></div>
               </div>
               <div class="flex-1 min-w-0 pr-4">
                 <div class="flex justify-between items-baseline mb-1">
                   <h3 class="text-[14px] font-bold text-gray-900 font-mono">#18nc23</h3>
                   <span class="text-[12px] text-gray-500 font-medium">3:15 PM</span>
                 </div>
                 <p class="text-[13px] text-gray-500 truncate leading-relaxed">do androids truly dream of electric...</p>
               </div>
            </div>

            <!-- Conversation Item -->
            <div class="group flex items-start gap-4 p-4 rounded-l-2xl rounded-r-none hover:bg-gray-50 cursor-pointer transition-all border-l-4 border-transparent mr-0 conversation-item" data-conversation-id="marus">
               <div class="relative">
                 <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                   MA
                 </div>
                 <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-300 rounded-full border-2 border-white"></div>
               </div>
               <div class="flex-1 min-w-0 pr-4">
                 <div class="flex justify-between items-baseline mb-1">
                   <h3 class="text-[14px] font-bold text-gray-900">Marus Addis</h3>
                   <span class="text-[12px] text-gray-500 font-medium">3:15 PM</span>
                 </div>
                 <p class="text-[13px] text-gray-500 truncate leading-relaxed">How do i reset my password?</p>
               </div>
            </div>

            <!-- Conversation Item -->
            <div class="group flex items-start gap-4 p-4 rounded-l-2xl rounded-r-none hover:bg-gray-50 cursor-pointer transition-all border-l-4 border-transparent mr-0 conversation-item" data-conversation-id="431gv9">
               <div class="relative">
                 <div class="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                   #4
                 </div>
               </div>
               <div class="flex-1 min-w-0 pr-4">
                 <div class="flex justify-between items-baseline mb-1">
                   <h3 class="text-[14px] font-bold text-gray-900 font-mono">#431gv9</h3>
                   <span class="text-[12px] text-gray-500 font-medium">3:15 PM</span>
                 </div>
                 <p class="text-[13px] text-gray-500 truncate leading-relaxed">How to reactivate my accout?</p>
               </div>
            </div>
          </div>
        </div>

        <!-- Chat Area (Right) -->
            <div class="flex-1 flex flex-col min-w-0 bg-white responsive-conversation-chat">
               <!-- Mobile header (Back button + Title) -->
               <div class="conversation-mobile-header" style="display:none; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #E2E8F0;">
                  <button class="back-to-list-btn" aria-label="Back to list" style="background:transparent;border:none;font-size:18px;cursor:pointer;padding:6px;">&larr;</button>
                  <h3 class="conversation-title" style="margin:0;font-size:16px;font-weight:600;">#73c72</h3>
                  <div style="width:32px;"></div>
               </div>
               <!-- Messages Feed -->
               <div class="flex-1 overflow-y-auto p-8 space-y-8">
            
            <!-- User Message -->
            <div class="flex justify-end mb-8">
               <div class="bg-gray-100 rounded-2xl rounded-tr-sm px-6 py-4 max-w-[80%]">
                  <p class="text-[15px] text-gray-800 leading-relaxed font-medium">Do AI agents actually understand what users mean, or do they just predict text?</p>
               </div>
            </div>

            <!-- AI Message -->
            <div class="flex gap-4 max-w-[90%]">
               <div class="w-10 h-10 rounded-full bg-[#E5A000] flex items-center justify-center flex-shrink-0 text-white shadow-sm overflow-hidden">
                  <img src="../image/vectorized (7) 2.png" alt="AI Agent" class="w-full h-full object-cover">
               </div>
               <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                     <span class="text-[14px] font-bold text-gray-900">AI Agent</span>
                     <span class="text-[12px] text-gray-400 font-medium">02:22 AM</span>
                  </div>
                  <div class="border border-gray-100 rounded-2xl rounded-tl-sm p-6 shadow-sm">
                     <p class="text-[15px] text-gray-700 leading-relaxed mb-4">That's a fair question — and an important one.</p>
                     <p class="text-[15px] text-gray-700 leading-relaxed">Most AI agents don't "understand" in the human sense, but they're trained to recognize patterns in language, intent, and context. That allows them to respond in ways that feel meaningful, even if the process underneath is statistical</p>
                  </div>
               </div>
            </div>

            <!-- User Message -->
            <div class="flex gap-4 max-w-[90%]">
               <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-gray-600">
                  AT
               </div>
               <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                     <span class="text-[14px] font-bold text-gray-900">#73c72</span>
                     <span class="text-[12px] text-gray-400 font-medium">02:22 AM</span>
                  </div>
                  <div class="bg-gray-100 rounded-2xl rounded-tl-sm px-6 py-4 inline-block">
                     <p class="text-[15px] text-gray-800 leading-relaxed font-medium">So it's more imitation than understanding?</p>
                  </div>
               </div>
            </div>

             <!-- AI Message -->
            <div class="flex gap-4 max-w-[90%]">
               <div class="w-10 h-10 rounded-full bg-[#E5A000] flex items-center justify-center flex-shrink-0 text-white shadow-sm overflow-hidden">
                  <img src="../image/vectorized (7) 2.png" alt="AI Agent" class="w-full h-full object-cover">
               </div>
               <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                     <span class="text-[14px] font-bold text-gray-900">AI Agent</span>
                     <span class="text-[12px] text-gray-400 font-medium">02:22 AM</span>
                  </div>
                  <div class="border border-gray-100 rounded-2xl rounded-tl-sm p-6 shadow-sm">
                     <p class="text-[15px] text-gray-700 leading-relaxed mb-4">In a way, yes — but imitation at scale can still be useful.</p>
                     <p class="text-[15px] text-gray-700 leading-relaxed mb-4">When an agent is well-designed, it doesn't just answer questions. It tracks context, adapts tone, and knows when to ask for clarification versus when to act.</p>
                     <p class="text-[15px] text-gray-700 leading-relaxed">That's what makes it feel less like a script and more like a conversation.</p>
                  </div>
               </div>
            </div>

             <!-- User Message -->
            <div class="flex gap-4 max-w-[90%]">
               <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-gray-600">
                  AT
               </div>
               <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                     <span class="text-[14px] font-bold text-gray-900">#73c72</span>
                     <span class="text-[12px] text-gray-400 font-medium">02:22 AM</span>
                  </div>
                  <div class="bg-gray-100 rounded-2xl rounded-tl-sm px-6 py-4 inline-block">
                     <p class="text-[15px] text-gray-800 leading-relaxed font-medium">Interesting. So the goal isn't intelligence, it's reliability.</p>
                  </div>
               </div>
            </div>

             <!-- AI Message -->
            <div class="flex gap-4 max-w-[90%]">
               <div class="w-10 h-10 rounded-full bg-[#E5A000] flex items-center justify-center flex-shrink-0 text-white shadow-sm overflow-hidden">
                  <img src="../image/vectorized (7) 2.png" alt="AI Agent" class="w-full h-full object-cover">
               </div>
               <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                     <span class="text-[14px] font-bold text-gray-900">AI Agent</span>
                     <span class="text-[12px] text-gray-400 font-medium">02:22 AM</span>
                  </div>
                  <div class="border border-gray-100 rounded-2xl rounded-tl-sm p-6 shadow-sm">
                     <p class="text-[15px] text-gray-700 leading-relaxed mb-4">That's the quiet secret.</p>
                     <p class="text-[15px] text-gray-700 leading-relaxed mb-4">An AI agent that's calm, consistent, and honest about its limits will outperform a "smart" one that surprises users.</p>
                     <p class="text-[15px] text-gray-700 leading-relaxed">Would you like me to show how this applies to your workflow or dashboard?</p>
                  </div>
               </div>
            </div>

          </div>

               <!-- Bottom Action -->
               <div class="join-conversation-bar p-8 border-t border-gray-100">
                   <button class="w-full bg-[#E5A000] hover:bg-[#D49000] text-white font-bold py-4 rounded-xl shadow-sm transition-all text-[15px]">
                      Join Conversation
                   </button>
               </div>
        </div>
      </div>
    `;
   }

   static afterRender() {
      this.setupConversationListeners();
   }

   static setupConversationListeners() {
      const conversationItems = document.querySelectorAll('.conversation-item');
      const conversationList = document.querySelector('.responsive-conversations-list');
      const conversationChat = document.querySelector('.responsive-conversation-chat');
      const mobileHeader = document.querySelector('.conversation-mobile-header');
      const backBtn = mobileHeader && mobileHeader.querySelector('.back-to-list-btn');

      // Helper to detect mobile at action time
      const isMobile = () => window.innerWidth <= 768;

      conversationItems.forEach(item => {
         item.addEventListener('click', () => {
            conversationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update mobile header title if present
            const titleEl = document.querySelector('.conversation-title');
            const h3 = item.querySelector('h3');
            if (titleEl && h3) titleEl.textContent = h3.textContent;

            if (isMobile()) {
               // Use classes so CSS !important rules don't block us
               conversationList.classList.add('hidden');
               conversationChat.classList.add('show');
               if (mobileHeader) mobileHeader.style.display = 'flex';
            }
         });
      });

      if (backBtn) {
         backBtn.addEventListener('click', () => {
            if (isMobile()) {
               conversationList.classList.remove('hidden');
               conversationChat.classList.remove('show');
               if (mobileHeader) mobileHeader.style.display = 'none';
            }
         });
      }

      // Handle window resize: reset to desktop layout when leaving mobile
      window.addEventListener('resize', () => {
         if (!isMobile()) {
            conversationList.classList.remove('hidden');
            conversationChat.classList.remove('show');
            if (mobileHeader) mobileHeader.style.display = 'none';
         }
      });
   }
}
