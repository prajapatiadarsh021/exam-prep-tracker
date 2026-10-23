/**
 * Application Entry Point.
 * Coordinates simple exam prep tracker components, chat bot companion,
 * and reactive UI updates.
 */

import { trackerStore } from './store/trackerStore.js';
import { renderHeader } from './components/header.js';
import { renderTrackerSidebar } from './components/trackerSidebar.js';
import { renderChatBotView } from './components/chatBotView.js';
import { renderSimpleExamModal } from './components/simpleExamModal.js';
import { renderGeminiModal } from './components/geminiModal.js';
import { renderReferenceContextModal } from './components/referenceContextModal.js';

function initApp() {
  const headerMount = document.getElementById('header-mount-point');
  const trackerMount = document.getElementById('tracker-mount-point');
  const chatbotMount = document.getElementById('chatbot-mount-point');
  const modalsMount = document.getElementById('modals-mount-point');

  // Render modals
  renderSimpleExamModal(modalsMount);
  renderGeminiModal(modalsMount);
  renderReferenceContextModal(modalsMount);

  // Cache last chat messages length to avoid interrupting typing unless messages change
  let lastChatLength = 0;
  let lastExamTitle = '';
  let lastDaysRemaining = 0;

  function renderFullUI(state) {
    // 1. Header
    renderHeader(headerMount);

    // 2. Left Sidebar (Tracker & Checklist)
    renderTrackerSidebar(trackerMount);

    // 3. Right Panel (AI Study Chat Bot)
    renderChatBotView(chatbotMount);

    lastChatLength = state.chatMessages ? state.chatMessages.length : 0;
    lastExamTitle = state.syllabusTitle;
    lastDaysRemaining = state.daysRemaining;
  }

  // Initial full render
  renderFullUI(trackerStore.getState());

  // Subscribe to store updates
  trackerStore.subscribe((state) => {
    // If only timer is ticking, do a lightweight DOM update instead of blowing away the chat input
    const timerDigitEls = document.querySelectorAll('.header-timer-digits, .timer-digits');
    const m = Math.floor(state.pomodoro.timeLeft / 60).toString().padStart(2, '0');
    const s = (state.pomodoro.timeLeft % 60).toString().padStart(2, '0');
    const timeFormatted = `${m}:${s}`;

    timerDigitEls.forEach(el => {
      el.textContent = timeFormatted;
    });

    const currentChatLength = state.chatMessages ? state.chatMessages.length : 0;
    const chatInput = document.getElementById('chat-user-input');
    const isTyping = chatInput && (document.activeElement === chatInput || chatInput.value.length > 0);

    // If chat length changed or exam title changed, re-render chat
    if (currentChatLength !== lastChatLength || state.syllabusTitle !== lastExamTitle) {
      const savedInputVal = chatInput ? chatInput.value : '';
      renderChatBotView(chatbotMount);
      const newInput = document.getElementById('chat-user-input');
      if (newInput && savedInputVal) {
        newInput.value = savedInputVal;
        if (isTyping) newInput.focus();
      }
      lastChatLength = currentChatLength;
    }

    // Update tracker sidebar & header
    renderTrackerSidebar(trackerMount);
    renderHeader(headerMount);

    lastExamTitle = state.syllabusTitle;
    lastDaysRemaining = state.daysRemaining;
  });
}

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
