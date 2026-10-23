/**
 * Header Component for PrepPulse Exam Tracker.
 * Clean, lightweight, focused on the active exam status and quick focus timer.
 */

import { trackerStore } from '../store/trackerStore.js';
import { GeminiService } from '../engine/geminiService.js';

export function renderHeader(container) {
  const state = trackerStore.getState();
  const daysLeft = state.daysRemaining || 7;
  const pomodoro = state.pomodoro || { timeLeft: 25 * 60, isRunning: false, mode: 'work' };
  const isGeminiLive = GeminiService.isConfigured();
  const geminiModel = state.settings?.geminiModel || 'gemini-1.5-flash';

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  container.innerHTML = `
    <header class="app-header" id="main-app-header">
      <!-- Brand & Active Exam Indicator -->
      <div class="brand-section">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <path d="M12 6v6"/>
            <path d="M15 9h-6"/>
          </svg>
        </div>
        <div class="brand-text">
          <h1>
            PrepPulse
            <span class="brand-tag">AI Chat Coach</span>
          </h1>
        </div>

        <!-- Active Exam Pill -->
        <button class="active-exam-pill" id="btn-header-exam-pill" title="Click to switch or customize exam">
          <span class="exam-icon-dot"></span>
          <span class="header-exam-name">${state.syllabusTitle}</span>
          <span class="header-days-tag">${daysLeft}d left</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      <!-- Mobile View Switcher (Only visible on small viewports) -->
      <div class="mobile-view-toggle" id="mobile-view-toggle">
        <button class="mobile-toggle-btn active" id="btn-toggle-chat" data-target="chat">
          <span>💬</span> Chat Bot
        </button>
        <button class="mobile-toggle-btn" id="btn-toggle-tracker" data-target="tracker">
          <span>📋</span> Checklist
        </button>
      </div>

      <!-- Right Header Actions -->
      <div class="header-actions">
        <!-- Gemini AI Status Indicator Button -->
        <button class="btn-gemini-status ${isGeminiLive ? 'connected' : 'connect-prompt'}" id="btn-open-gemini-modal" title="Configure Google Gemini API">
          <span class="gemini-sparkle">✨</span>
          <span class="gemini-status-label">${isGeminiLive ? `Gemini Active (${geminiModel.replace('gemini-', '')})` : 'Connect Gemini API'}</span>
          ${isGeminiLive ? '<span class="status-live-dot"></span>' : ''}
        </button>

        <!-- Quick Pomodoro in Header -->
        <div class="header-timer-pill ${pomodoro.isRunning ? 'running' : ''}" id="header-timer-pill">
          <span class="timer-icon">⏱️</span>
          <span class="header-timer-digits" id="header-timer-digits">${formatTimer(pomodoro.timeLeft)}</span>
          <button class="header-timer-btn" id="btn-header-timer-toggle" title="${pomodoro.isRunning ? 'Pause' : 'Start Focus'}">
            ${pomodoro.isRunning ? `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="16"/>
              </svg>
            ` : `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            `}
          </button>
        </div>

        <button class="btn-primary" id="btn-open-exam-modal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Switch Exam
        </button>
      </div>
    </header>
  `;

  // Attach Event Listeners
  const openModal = () => {
    const modal = document.getElementById('simple-exam-modal-overlay');
    if (modal) modal.classList.add('active');
  };

  const btnOpenModal = container.querySelector('#btn-open-exam-modal');
  if (btnOpenModal) btnOpenModal.addEventListener('click', openModal);

  const btnExamPill = container.querySelector('#btn-header-exam-pill');
  if (btnExamPill) btnExamPill.addEventListener('click', openModal);

  // Gemini Modal Button
  const btnGeminiModal = container.querySelector('#btn-open-gemini-modal');
  if (btnGeminiModal) {
    btnGeminiModal.addEventListener('click', () => {
      const modal = document.getElementById('gemini-modal-overlay');
      if (modal) modal.classList.add('active');
    });
  }

  // Header Timer Button
  const btnTimerToggle = container.querySelector('#btn-header-timer-toggle');
  if (btnTimerToggle) {
    btnTimerToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (pomodoro.isRunning) {
        trackerStore.pausePomodoro();
      } else {
        trackerStore.startPomodoro();
      }
    });
  }

  // Mobile View Toggles
  const btnToggleChat = container.querySelector('#btn-toggle-chat');
  const btnToggleTracker = container.querySelector('#btn-toggle-tracker');
  const mainRegion = document.getElementById('main-workspace');

  if (btnToggleChat && btnToggleTracker && mainRegion) {
    btnToggleChat.addEventListener('click', () => {
      btnToggleChat.classList.add('active');
      btnToggleTracker.classList.remove('active');
      mainRegion.setAttribute('data-mobile-active', 'chat');
    });

    btnToggleTracker.addEventListener('click', () => {
      btnToggleTracker.classList.add('active');
      btnToggleChat.classList.remove('active');
      mainRegion.setAttribute('data-mobile-active', 'tracker');
    });
  }
}
