(function () {
  'use strict';

  const CONFIG = {
    widgetId: 'ai-chatbot-widget',
  };

  function initChatbot() {
    if (document.getElementById(CONFIG.widgetId)) return;

    const widgetContainer = document.createElement('div');
    widgetContainer.id = CONFIG.widgetId;
    widgetContainer.innerHTML = getWidgetHTML();
    document.body.appendChild(widgetContainer);

    injectStyles();
    attachEventListeners();

    // Expose sendSuggestion globally
    window.sendSuggestion = (text) => {
      const input = document.getElementById('chatbot-input');
      const sendBtn = document.getElementById('chatbot-send');
      if (input && sendBtn) {
        input.value = text;
        sendBtn.click();
      }
    };
  }

  function getWidgetHTML() {
    return `
      <div class="chatbot-window" id="chatbot-window" style="display: none;">
        <div class="chatbot-header">
          <div class="header-left">
            <button class="icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div class="header-logo">
              <img src="/image/vectorized%20(7)%202.png" alt="Logo" style="width: 36px; height: 36px; object-fit: contain;">
            </div>
            <span class="header-title">Chat bot</span>
          </div>
          <div class="header-right">
            <button class="icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 7 12 4 15 7"></polyline><polyline points="9 17 12 20 15 17"></polyline><line x1="12" y1="4" x2="12" y2="20"></line></svg>
            </button>
            <button class="icon-btn" id="chatbot-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div class="chatbot-messages" id="chatbot-messages">
          <div class="chat-intro-text">Welcome to our Website! Ask us anything.</div>
          <div class="chatbot-message bot-message">
            <p>Hi! How can I support you today?</p>
          </div>
          <div class="suggestion-chips" id="initial-suggestions">
            <button class="suggestion-chip" onclick="window.sendSuggestion('Learn About Our Courses')">1. Learn About Our Courses</button>
            <button class="suggestion-chip" onclick="window.sendSuggestion('Help Me Choose a Program')">2. Help Me Choose a Program</button>
            <button class="suggestion-chip" onclick="window.sendSuggestion('Watch Free Training')">3. Watch Free Training</button>
          </div>
        </div>

        <div class="chatbot-input-container">
          <div class="chatbot-input-wrapper">
            <input type="text" class="chatbot-input" placeholder="Message here..." id="chatbot-input" />
            <button class="chatbot-send-btn" id="chatbot-send">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_18_398)">
                  <path d="M11.25 10H6.25" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3.78835 17.2876C3.7444 17.4076 3.73831 17.5382 3.77089 17.6618C3.80347 17.7854 3.87316 17.896 3.97056 17.9787C4.06796 18.0615 4.18839 18.1124 4.31562 18.1246C4.44284 18.1368 4.57075 18.1097 4.6821 18.0469L17.8071 10.5399C17.9048 10.4859 17.9862 10.4066 18.0429 10.3105C18.0996 10.2143 18.1295 10.1047 18.1295 9.99303C18.1295 9.88139 18.0996 9.77178 18.0429 9.67561C17.9862 9.57944 17.9048 9.50021 17.8071 9.44616L4.6821 1.95788C4.57109 1.89579 4.44378 1.86905 4.31717 1.88123C4.19056 1.89341 4.07068 1.94393 3.97354 2.02604C3.87641 2.10814 3.80663 2.21794 3.77354 2.34075C3.74045 2.46356 3.74561 2.59355 3.78835 2.71334L6.25007 10.0001L3.78835 17.2876Z" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <defs>
                  <clipPath id="clip0_18_398">
                    <rect width="20" height="20" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="chatbot-toggle-container">
        <button class="chatbot-toggle" id="chatbot-toggle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 18.4301H13L8.54999 21.39C7.88999 21.83 7 21.3601 7 20.5601V18.4301C4 18.4301 2 16.4301 2 13.4301V7.42999C2 4.42999 4 2.42999 7 2.42999H17C20 2.42999 22 4.42999 22 7.42999V13.4301C22 16.4301 20 18.4301 17 18.4301Z" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12.0001 11.36V11.15C12.0001 10.47 12.4201 10.11 12.8401 9.82001C13.2501 9.54001 13.66 9.18002 13.66 8.52002C13.66 7.60002 12.9201 6.85999 12.0001 6.85999C11.0801 6.85999 10.3401 7.60002 10.3401 8.52002" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.9955 13.75H12.0045" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  function injectStyles() {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const style = document.createElement('style');
    style.textContent = `
      #ai-chatbot-widget {
        position: fixed;
        bottom: 32px;
        right: 32px;
        z-index: 10000;
        font-family: 'Outfit', sans-serif;
      }

      .chatbot-window {
        width: 410px;
        height: 705px;
        max-height: calc(100vh - 120px); /* Responsive fix for desktop */
        background: #FFFFFF;
        box-shadow: 0 12px 48px rgba(0,0,0,0.12);
        border-radius: 24px 24px 32px 32px;
        position: absolute; 
        bottom: 72px; 
        right: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .chatbot-header {
        height: 72px;
        padding: 0 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #F0F0F0;
      }

      .header-left, .header-right { display: flex; align-items: center; gap: 12px; }
      .header-title { font-weight: 700; font-size: 18px; color: #111; }

      .header-logo {
        width: 36px;
        height: 36px;
        background: #D59800;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-btn { background: none; border: none; cursor: pointer; color: #333; display: flex; align-items: center; padding: 4px; }
      .icon-btn svg { width: 18px; height: 18px; }

      .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: none;
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .chatbot-messages::-webkit-scrollbar { display: none; }

      .chat-intro-text {
        font-size: 13.5px;
        color: #757575;
        text-align: center;
        margin: 8px 0 16px 0;
      }

      .chatbot-message { max-width: 85%; }
      .chatbot-message p {
        font-size: 14.5px;
        line-height: 1.4;
        padding: 12px 18px;
        margin: 0;
        white-space: pre-wrap;
      }

      .bot-message { align-self: flex-start; }
      .bot-message p { background: #F3F3F3; color: #1a1a1a; border-radius: 20px 20px 20px 4px; }

      .user-message { align-self: flex-end; }
      .user-message p { background: #D59800; color: white; border-radius: 20px 20px 4px 20px; }

      .message-metadata {
        font-size: 12px;
        color: #8E8E8E;
        margin-top: 6px;
        padding-left: 4px;
      }

      .chatbot-input-container {
        padding-top: 10px;
      }

      .chatbot-input-wrapper {
        display: flex;
        align-items: center;
        background: #FFFFFF;
        border: 1px solid #E5E5E5;
        border-radius: 32px;
        padding: 6px 6px 6px 24px;
        height: 56px;
        margin: 0 20px 24px 20px;
      }

      .chatbot-input {
        flex: 1;
        border: none;
        outline: none;
        font-family: 'Outfit', sans-serif;
        font-size: 14.5px;
        color: #333;
        background: transparent;
      }

      .chatbot-send-btn {
        width: 44px;
        height: 44px;
        background: #D59800;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .chatbot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .chatbot-toggle-container {
        display: flex;
        justify-content: flex-end;
      }

      .chatbot-toggle {
        width: 56px;
        height: 56px;
        background: #D59800;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        border: none;
      }

      .suggestion-chips {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 20px 0 20px;
        margin-bottom: 0px;
      }

      .suggestion-chip {
        background: #FFFFFF;
        border: 1px solid #D59800;
        color: #D59800;
        padding: 10px 16px;
        border-radius: 12px;
        font-family: 'Outfit', sans-serif;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        width: 100%;
      }

      .suggestion-chip:hover {
        background: #FFF8E1;
      }

      .bot-followup-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
        width: 100%;
      }
      
      .followup-chip {
        background: #ffffff;
        border: 1px solid #D59800;
        color: #D59800;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
        font-family: 'Outfit', sans-serif;
      }
      
      .followup-chip:hover {
        background: #FFF8E1;
      }

      /* Mobile Responsive Styles */
      @media (max-width: 768px) {
        #ai-chatbot-widget { bottom: 16px; right: 16px; }
        .chatbot-window {
          width: calc(100vw - 32px);
          max-width: 410px;
          height: calc(100vh - 100px);
          max-height: 705px;
          bottom: 64px;
        }
        .chatbot-messages { padding: 16px 16px; gap: 10px; }
        .chatbot-input-wrapper { margin: 0 16px 16px 16px; height: 48px; }
      }

      @media (max-width: 480px) {
        #ai-chatbot-widget { bottom: 12px; right: 12px; }
        .chatbot-window { width: calc(100vw - 24px); bottom: 60px; }
        .chatbot-toggle { width: 48px; height: 48px; }
      }
    `;
    document.head.appendChild(style);
  }

  function attachEventListeners() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const window_ = document.getElementById('chatbot-window');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');

    const sessionId = getOrCreateSessionId();

    toggleBtn.addEventListener('click', () => {
      window_.style.display = window_.style.display === 'none' ? 'flex' : 'none';
      if (window_.style.display === 'flex') input.focus();
    });

    closeBtn.addEventListener('click', () => { window_.style.display = 'none'; });

    const handleSend = async () => {
      const message = input.value.trim();
      if (!message) return;

      addMessage(message, 'user');
      input.value = '';
      sendBtn.disabled = true;

      // Remove initial suggestions if present
      const initialSuggestions = document.getElementById('initial-suggestions');
      if (initialSuggestions) {
        initialSuggestions.remove();
      }

      // Placeholder for streaming bot response
      const { textNode, metadataNode } = addStreamingMessage();
      let fullResponse = "";

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId }),
        });

        if (!response.ok) throw new Error('Failed to send message');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr || dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);

                // Handle streaming chunks - the format is { chunk: "text" }
                if (parsed.chunk) {
                  fullResponse += parsed.chunk;
                  textNode.innerText = fullResponse;
                  const messagesContainer = document.getElementById('chatbot-messages');
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }

                // Handle errors
                if (parsed.error) {
                  textNode.innerText = parsed.error;
                }
              } catch (e) {
                console.debug('Parse error:', e);
              }
            }
          }
        }

        // Parse Follow-up Questions
        const followupMatch = fullResponse.match(/<<<FOLLOWUP: (.*?)>>>/);
        if (followupMatch) {
          fullResponse = fullResponse.replace(followupMatch[0], '').trim();
          textNode.innerText = fullResponse; // Clean text

          const questions = followupMatch[1].split('|').map(q => q.trim());
          if (questions.length > 0) {
            const followupContainer = document.createElement('div');
            followupContainer.className = 'bot-followup-container';

            questions.forEach(q => {
              const btn = document.createElement('button');
              btn.className = 'followup-chip';
              btn.innerText = q;
              btn.onclick = () => window.sendSuggestion(q);
              followupContainer.appendChild(btn);
            });

            // Append to the message container (not inside the p tag)
            // textNode.parentNode is the msgDiv
            textNode.parentNode.appendChild(followupContainer);
            const messagesContainer = document.getElementById('chatbot-messages');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }

        // Final update with timestamp
        metadataNode.innerText = `AI Agent • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        // Replace placeholder message with final response if empty
        if (!fullResponse) {
          textNode.innerText = 'Sorry, I could not generate a response.';
        }

      } catch (error) {
        console.error('Error sending message:', error);
        textNode.innerText = "Sorry, I'm having trouble connecting. Please try again later.";
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !sendBtn.disabled) handleSend();
    });
  }

  function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('chatbot_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('chatbot_session_id', sessionId);
    }
    return sessionId;
  }

  function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chatbot-message ${sender}-message`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let html = `<p>${text}</p>`;
    if (sender === 'bot') {
      html += `<div class="message-metadata">AI Agent • ${time}</div>`;
    }

    msgDiv.innerHTML = html;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function addStreamingMessage() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chatbot-message bot-message';

    const p = document.createElement('p');
    p.innerText = '...';

    const metadata = document.createElement('div');
    metadata.className = 'message-metadata';
    metadata.innerText = 'AI Agent • typing...';

    msgDiv.appendChild(p);
    msgDiv.appendChild(metadata);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return { textNode: p, metadataNode: metadata };
  }

  initChatbot();
})();