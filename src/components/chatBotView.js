/**
 * ChatBot View Component.
 * Implements a simple, clear, conversational exam prep assistant with
 * interactive in-chat quiz cards, today's plan checklists, and quick prompt chips.
 */

import { trackerStore } from '../store/trackerStore.js';
import { ChatBotService } from '../engine/chatBotService.js';
import { GeminiService } from '../engine/geminiService.js';

export function renderChatBotView(container) {
  const state = trackerStore.getState();
  const messages = state.chatMessages || [];
  const isGeminiLive = GeminiService.isConfigured();
  const modelName = state.settings?.geminiModel || 'gemini-1.5-flash';

  container.innerHTML = `
    <div class="chatbot-container" id="chatbot-container">
      <!-- 1. Chat Header -->
      <div class="chatbot-header">
        <div class="bot-profile">
          <div class="bot-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
              <rect x="3" y="8" width="18" height="12" rx="4"/>
              <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
              <path d="M9 17h6"/>
            </svg>
          </div>
          <div class="bot-info">
            <div class="bot-name-row">
              <h3>PrepBot AI</h3>
              <span class="online-indicator">
                <span class="pulse-dot"></span> Online
              </span>
              ${isGeminiLive ? `
                <span class="gemini-tag-badge" title="Powered by Google Gemini ${modelName}">
                  ✨ Gemini Active
                </span>
              ` : `
                <button class="gemini-prompt-tag" id="btn-chat-enable-gemini" title="Click to connect free Gemini API key">
                  ✨ Connect Gemini AI
                </button>
              `}
            </div>
            <p class="bot-subtext">
              ${isGeminiLive ? `Live Gemini Exam Coach • Deep conceptual reasoning active` : `Conversational Exam Coach & Adaptive Planner`}
            </p>
          </div>
        </div>

        <div class="chat-header-actions">
          <button class="btn-chat-action" id="btn-open-context-modal" title="View or edit grounded reference context notes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Reference Context
          </button>
          <button class="btn-chat-action" id="btn-clear-chat" title="Clear conversation history">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Clear
          </button>
        </div>
      </div>

      <!-- 2. Message History Stream -->
      <div class="chatbot-messages" id="chatbot-messages-stream">
        ${messages.map(msg => renderMessageHTML(msg)).join('')}
      </div>

      <!-- 3. Quick Action Suggestion Chips -->
      <div class="quick-chips-bar" id="quick-chips-bar">
        <button class="chip-btn" data-prompt="What should I study today?">
          <span>📅</span> Today's Plan
        </button>
        <button class="chip-btn" data-prompt="Quiz me on a topic">
          <span>❓</span> Quick Quiz
        </button>
        <button class="chip-btn" data-prompt="Show my progress summary">
          <span>📊</span> Progress
        </button>
        <button class="chip-btn" data-prompt="Start 25m Focus Session">
          <span>⏱️</span> 25m Focus
        </button>
        <button class="chip-btn" data-prompt="Explain key concepts for this exam">
          <span>💡</span> Strategy Tips
        </button>
      </div>

      <!-- 4. Chat Input Area -->
      <form class="chatbot-input-bar" id="chatbot-form">
        <div class="input-wrapper">
          <input
            type="text"
            id="chat-user-input"
            class="chat-input"
            placeholder="Ask anything, 'Quiz me', 'What to study today', 'I finished [topic]'..."
            autocomplete="off"
            required
          />
          <button type="submit" class="btn-chat-send" id="btn-chat-send" title="Send Message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  `;

  // Attach Event Handlers
  attachChatHandlers(container);

  // Auto scroll to latest message
  const stream = container.querySelector('#chatbot-messages-stream');
  if (stream) {
    stream.scrollTop = stream.scrollHeight;
  }
}

/**
 * Render individual message HTML
 */
function renderMessageHTML(msg) {
  const isUser = msg.sender === 'user';
  const formattedText = formatMarkdown(msg.text);

  return `
    <div class="chat-message-row ${isUser ? 'user-row' : 'bot-row'}" id="msg-row-${msg.id}">
      ${!isUser ? `
        <div class="msg-avatar-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="8" width="18" height="12" rx="4"/>
            <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
            <path d="M9 17h6"/>
          </svg>
        </div>
      ` : ''}

      <div class="chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}">
        <div class="msg-text-content">${formattedText}</div>

        <!-- Interactive Widget Cards -->
        ${msg.type === 'welcome' ? renderWelcomeCard() : ''}
        ${msg.type === 'quiz' && msg.data ? renderQuizCard(msg) : ''}
        ${msg.type === 'plan' && msg.data ? renderPlanCard(msg.data) : ''}
        ${msg.type === 'progress' && msg.data ? renderProgressCard(msg.data) : ''}

        <span class="msg-timestamp">${msg.timestamp || ''}</span>
      </div>
    </div>
  `;
}

/**
 * Render Welcome Action Card
 */
function renderWelcomeCard() {
  const isGeminiLive = GeminiService.isConfigured();

  return `
    <div class="inchat-card welcome-card">
      <div class="welcome-actions-grid">
        <button class="welcome-act-btn" data-prompt="What should I study today?">
          <span class="act-icon">📅</span>
          <div class="act-details">
            <strong>Today's Plan</strong>
            <span>See what to study right now</span>
          </div>
        </button>

        <button class="welcome-act-btn" data-prompt="Quiz me on a topic">
          <span class="act-icon">🎯</span>
          <div class="act-details">
            <strong>Quick Quiz</strong>
            <span>${isGeminiLive ? 'AI-generated conceptual MCQ' : 'Test 1 conceptual MCQ'}</span>
          </div>
        </button>

        <button class="welcome-act-btn" data-prompt="Show my progress summary">
          <span class="act-icon">📊</span>
          <div class="act-details">
            <strong>Check Progress</strong>
            <span>Countdown & readiness stats</span>
          </div>
        </button>

        <button class="welcome-act-btn" data-prompt="Start 25m Focus Session">
          <span class="act-icon">⏱️</span>
          <div class="act-details">
            <strong>25m Focus Timer</strong>
            <span>Launch study sprint</span>
          </div>
        </button>
      </div>

      ${!isGeminiLive ? `
        <div class="welcome-gemini-banner" id="btn-welcome-connect-gemini">
          <span class="gemini-banner-sparkle">✨</span>
          <div class="gemini-banner-text">
            <strong>Unlock Live Google Gemini AI</strong>
            <span>Add your free Gemini API key to power all chat answers & quizzes with Gemini 1.5 Flash</span>
          </div>
          <span class="btn-banner-action">Connect ↗</span>
        </div>
      ` : `
        <div class="welcome-gemini-banner live-banner">
          <span class="gemini-banner-sparkle">✨</span>
          <div class="gemini-banner-text">
            <strong>Google Gemini Intelligence Active</strong>
            <span>All responses and MCQs are generated directly by Gemini in real-time</span>
          </div>
        </div>
      `}
    </div>
  `;
}

/**
 * Render In-Chat Interactive Quiz Card
 */
function renderQuizCard(msg) {
  const data = msg.data;
  const isAnswered = data.userAnswer !== null;

  return `
    <div class="inchat-card quiz-card" data-msg-id="${msg.id}">
      <div class="quiz-card-header">
        <div class="quiz-badge-group">
          <span class="quiz-topic-badge">${data.topicName}</span>
          ${data.source === 'gemini' ? `<span class="quiz-gemini-pill">✨ Gemini AI</span>` : ''}
        </div>
        ${isAnswered ? `
          <span class="quiz-result-badge ${data.isCorrect ? 'correct' : 'incorrect'}">
            ${data.isCorrect ? '✓ Correct! +100%' : '✗ Incorrect (Saved to Review)'}
          </span>
        ` : `
          <span class="quiz-instruction-tag">Select one option:</span>
        `}
      </div>

      <div class="quiz-question-body">
        <p class="quiz-q-text">${data.questionText}</p>
      </div>

      <div class="quiz-options-list">
        ${data.options.map((opt, idx) => {
          let stateClass = '';
          if (isAnswered) {
            if (idx === data.correctOptionIndex) {
              stateClass = 'option-correct';
            } else if (idx === data.userAnswer) {
              stateClass = 'option-incorrect';
            } else {
              stateClass = 'option-dimmed';
            }
          }

          const optionLetters = ['A', 'B', 'C', 'D'];
          return `
            <button
              class="quiz-option-btn ${stateClass}"
              data-msg-id="${msg.id}"
              data-opt-index="${idx}"
              ${isAnswered ? 'disabled' : ''}
            >
              <span class="opt-letter">${optionLetters[idx]}</span>
              <span class="opt-label">${opt}</span>
            </button>
          `;
        }).join('')}
      </div>

      ${isAnswered ? `
        <div class="quiz-explanation-box ${data.isCorrect ? 'exp-correct' : 'exp-incorrect'}">
          <div class="exp-title">
            <strong>Concept Tested:</strong> ${data.conceptTested}
          </div>
          <p class="exp-desc">${data.explanation}</p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render In-Chat Study Plan Card
 */
function renderPlanCard(data) {
  return `
    <div class="inchat-card plan-card">
      <div class="plan-card-header">
        <span class="plan-day-badge">Day ${data.dayNumber}</span>
        <span class="plan-theme-text">${data.theme || 'Focused Revision'}</span>
      </div>

      <div class="plan-topics-list">
        ${data.topics.map(t => `
          <div class="plan-topic-row ${t.completed ? 'completed' : ''}">
            <label class="custom-checkbox-container">
              <input type="checkbox" class="inchat-topic-chk" data-topic-id="${t.topic_id}" ${t.completed ? 'checked' : ''} />
              <span class="checkbox-checkmark"></span>
            </label>
            <div class="plan-topic-details">
              <span class="plan-topic-name">${t.name}</span>
              <span class="plan-topic-est">${t.estimated_hours}h estimated</span>
            </div>
            <button class="btn-quiz-mini inchat-quiz-btn" data-topic-name="${t.name}">
              Quiz
            </button>
          </div>
        `).join('')}
      </div>

      <div class="plan-card-footer">
        <button class="btn-plan-start-timer" id="btn-inchat-start-timer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Start 25m Focus for Day ${data.dayNumber}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render In-Chat Progress Card
 */
function renderProgressCard(data) {
  return `
    <div class="inchat-card progress-card">
      <div class="prog-card-top">
        <div class="prog-main-stat">
          <span class="prog-pct-big">${data.percent}%</span>
          <span class="prog-pct-sub">Syllabus Mastered</span>
        </div>
        <div class="prog-days-stat">
          <span class="days-big">${data.daysLeft}</span>
          <span class="days-sub">Days Left</span>
        </div>
      </div>

      <div class="prog-bar-container">
        <div class="prog-bar-fill" style="width: ${data.percent}%;"></div>
      </div>

      <div class="prog-metrics-grid">
        <div class="prog-metric-tile">
          <span class="metric-val text-success">${data.completedTopics}</span>
          <span class="metric-label">Completed</span>
        </div>
        <div class="prog-metric-tile">
          <span class="metric-val text-primary">${data.remainingTopics}</span>
          <span class="metric-label">Remaining</span>
        </div>
        <div class="prog-metric-tile">
          <span class="metric-val text-warning">${data.weakCount}</span>
          <span class="metric-label">Need Review</span>
        </div>
        <div class="prog-metric-tile">
          <span class="metric-val text-cyan">${data.focusMinutes}m</span>
          <span class="metric-label">Focused</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach Event Listeners to Chat Elements
 */
function attachChatHandlers(container) {
  const isGeminiLive = GeminiService.isConfigured();
  const form = container.querySelector('#chatbot-form');
  const input = container.querySelector('#chat-user-input');
  const stream = container.querySelector('#chatbot-messages-stream');

  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    // 1. Add user message
    trackerStore.addChatMessage({
      sender: 'user',
      text: cleanText,
      type: 'text'
    });

    if (input) input.value = '';

    // 2. Add Typing Indicator element
    const typingId = 'typing-' + Date.now();
    if (stream) {
      const typingEl = document.createElement('div');
      typingEl.className = 'chat-message-row bot-row typing-row';
      typingEl.id = typingId;
      typingEl.innerHTML = `
        <div class="msg-avatar-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="8" width="18" height="12" rx="4"/>
            <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
            <path d="M9 17h6"/>
          </svg>
        </div>
        <div class="chat-bubble bot-bubble typing-bubble">
          <div class="typing-dots-anim">
            <span></span><span></span><span></span>
          </div>
          <span class="typing-status-text">${isGeminiLive ? 'PrepBot is thinking with Gemini...' : 'PrepBot is typing...'}</span>
        </div>
      `;
      stream.appendChild(typingEl);
      stream.scrollTop = stream.scrollHeight;
    }

    try {
      // 3. Process message asynchronously (via Gemini or fallback)
      const response = await ChatBotService.processMessage(cleanText);

      // Remove typing indicator
      const existingTyping = document.getElementById(typingId);
      if (existingTyping) existingTyping.remove();

      // Add bot message
      trackerStore.addChatMessage({
        sender: 'bot',
        text: response.text,
        type: response.type,
        data: response.data
      });
    } catch (err) {
      const existingTyping = document.getElementById(typingId);
      if (existingTyping) existingTyping.remove();

      trackerStore.addChatMessage({
        sender: 'bot',
        text: `⚠️ An error occurred while generating the response: ${err.message}`,
        type: 'text'
      });
    }
  };

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(input.value);
    });
  }

  // Quick Prompt Chips & Welcome Action Buttons
  container.querySelectorAll('.chip-btn, .welcome-act-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prompt = e.currentTarget.getAttribute('data-prompt');
      if (prompt) {
        sendMessage(prompt);
      }
    });
  });

  // Open Gemini Modal Triggers
  const openGeminiModal = () => {
    const modal = document.getElementById('gemini-modal-overlay');
    if (modal) modal.classList.add('active');
  };

  const btnEnableGemini = container.querySelector('#btn-chat-enable-gemini');
  if (btnEnableGemini) btnEnableGemini.addEventListener('click', openGeminiModal);

  const btnWelcomeGemini = container.querySelector('#btn-welcome-connect-gemini');
  if (btnWelcomeGemini) btnWelcomeGemini.addEventListener('click', openGeminiModal);

  // Open Reference Context Modal Trigger
  const btnOpenContext = container.querySelector('#btn-open-context-modal');
  if (btnOpenContext) {
    btnOpenContext.addEventListener('click', () => {
      const modal = document.getElementById('context-modal-overlay');
      if (modal) modal.classList.add('active');
    });
  }

  // In-Chat Quiz Option Click
  container.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const msgId = e.currentTarget.getAttribute('data-msg-id');
      const optIndex = parseInt(e.currentTarget.getAttribute('data-opt-index'), 10);
      ChatBotService.answerQuiz(msgId, optIndex);
    });
  });

  // In-Chat Plan Checkbox Click
  container.querySelectorAll('.inchat-topic-chk').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const topicId = e.target.getAttribute('data-topic-id');
      trackerStore.toggleTopicCompletion(topicId);
    });
  });

  // In-Chat Quiz Buttons
  container.querySelectorAll('.inchat-quiz-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const topicName = e.currentTarget.getAttribute('data-topic-name');
      sendMessage(`Quiz me on ${topicName}`);
    });
  });

  // In-Chat Start Timer Button
  const btnInchatTimer = container.querySelector('#btn-inchat-start-timer');
  if (btnInchatTimer) {
    btnInchatTimer.addEventListener('click', () => {
      trackerStore.startPomodoro();
      sendMessage(`Start 25m Focus Session`);
    });
  }

  // Clear Chat Button
  const btnClear = container.querySelector('#btn-clear-chat');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      trackerStore.clearChat();
    });
  }
}

/**
 * Format simple markdown text (bold, bullet points, headers) safely
 */
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• (.*$)/gim, '<li class="chat-li">$1</li>')
    .replace(/\n\n/g, '<p></p>')
    .replace(/\n/g, '<br/>');
}
