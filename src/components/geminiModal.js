/**
 * Google Gemini API Setup Modal Component.
 * Enables users to configure, test, and activate their Gemini API key.
 */

import { trackerStore } from '../store/trackerStore.js';
import { GeminiService } from '../engine/geminiService.js';

export function renderGeminiModal(container) {
  const state = trackerStore.getState();
  const currentKey = state.settings?.geminiApiKey || '';
  const currentModel = state.settings?.geminiModel || 'gemini-1.5-flash';
  const isConnected = GeminiService.isConfigured();

  // Create or update modal container
  let modalWrap = document.getElementById('gemini-modal-mount');
  if (!modalWrap) {
    modalWrap = document.createElement('div');
    modalWrap.id = 'gemini-modal-mount';
    container.appendChild(modalWrap);
  }

  modalWrap.innerHTML = `
    <div class="modal-overlay" id="gemini-modal-overlay">
      <div class="modal-card gemini-modal-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="gemini-title-row">
              <span class="gemini-sparkle-icon">✨</span>
              <h3>Google Gemini AI Configuration</h3>
            </div>
            <p>Power your entire exam prep with live Google Gemini intelligence.</p>
          </div>
          <button class="modal-close-btn" id="btn-close-gemini-modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body-simple">
          <!-- Connection Status Card -->
          <div class="gemini-status-card ${isConnected ? 'status-connected' : 'status-disconnected'}">
            <div class="status-indicator-dot"></div>
            <div class="status-info-text">
              <strong>${isConnected ? 'Gemini AI is Connected & Active' : 'Gemini AI Not Configured'}</strong>
              <span>${isConnected ? `All chat, quizzes, and study plans are processed via ${currentModel}` : 'Add your Google Gemini API key to activate live intelligence'}</span>
            </div>
          </div>

          <!-- Configuration Form -->
          <form id="gemini-api-form" class="gemini-api-form">
            <div class="form-group">
              <div class="label-with-link">
                <label for="gemini-api-key-input">Gemini API Key</label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="get-key-link">
                  Get free key from Google AI Studio ↗
                </a>
              </div>
              <div class="api-key-input-wrapper">
                <input
                  type="password"
                  id="gemini-api-key-input"
                  placeholder="AIzaSy..."
                  value="${currentKey}"
                  autocomplete="off"
                  required
                />
                <button type="button" class="btn-toggle-key-visibility" id="btn-toggle-key-visibility" title="Show / Hide Key">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <span class="input-helper-text">Stored securely in your local browser storage. Never sent to any third party.</span>
            </div>

            <div class="form-group">
              <label for="gemini-model-select">Gemini Model</label>
              <select id="gemini-model-select" class="gemini-select">
                <option value="gemini-1.5-flash" ${currentModel === 'gemini-1.5-flash' ? 'selected' : ''}>
                  gemini-1.5-flash (Recommended: Lightning fast, low latency)
                </option>
                <option value="gemini-2.0-flash" ${currentModel === 'gemini-2.0-flash' ? 'selected' : ''}>
                  gemini-2.0-flash (Next-Gen Flash)
                </option>
                <option value="gemini-1.5-pro" ${currentModel === 'gemini-1.5-pro' ? 'selected' : ''}>
                  gemini-1.5-pro (Deep reasoning & complex syllabi)
                </option>
              </select>
            </div>

            <!-- Test Feedback Alert -->
            <div class="test-feedback-box" id="gemini-test-feedback" style="display: none;"></div>

            <div class="modal-footer-actions">
              ${isConnected ? `
                <button type="button" class="btn-danger-outline" id="btn-disconnect-gemini">
                  Disconnect Key
                </button>
              ` : ''}
              <button type="button" class="btn-secondary" id="btn-cancel-gemini-modal">Close</button>
              <button type="submit" class="btn-primary" id="btn-save-gemini-key">
                <span id="save-btn-text">Test & Save Key</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Attach Event Handlers
  const modal = modalWrap.querySelector('#gemini-modal-overlay');
  const btnClose = modalWrap.querySelector('#btn-close-gemini-modal');
  const btnCancel = modalWrap.querySelector('#btn-cancel-gemini-modal');
  const keyInput = modalWrap.querySelector('#gemini-api-key-input');
  const modelSelect = modalWrap.querySelector('#gemini-model-select');
  const btnToggleVis = modalWrap.querySelector('#btn-toggle-key-visibility');
  const feedbackBox = modalWrap.querySelector('#gemini-test-feedback');
  const form = modalWrap.querySelector('#gemini-api-form');
  const btnDisconnect = modalWrap.querySelector('#btn-disconnect-gemini');

  const closeModal = () => {
    if (modal) modal.classList.remove('active');
  };

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Toggle Visibility
  if (btnToggleVis && keyInput) {
    btnToggleVis.addEventListener('click', () => {
      if (keyInput.type === 'password') {
        keyInput.type = 'text';
      } else {
        keyInput.type = 'password';
      }
    });
  }

  // Disconnect Key
  if (btnDisconnect) {
    btnDisconnect.addEventListener('click', () => {
      trackerStore.state.settings.geminiApiKey = '';
      trackerStore.state.settings.useLiveApi = false;
      trackerStore.saveState();

      trackerStore.addChatMessage({
        sender: 'bot',
        text: '🔌 Gemini API disconnected. PrepBot has transitioned to the built-in local academic engine.',
        type: 'text'
      });

      closeModal();
    });
  }

  // Form Submit: Test connection then save
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const keyVal = keyInput.value.trim();
      const modelVal = modelSelect.value;
      const saveBtn = modalWrap.querySelector('#btn-save-gemini-key');
      const saveBtnText = modalWrap.querySelector('#save-btn-text');

      if (!keyVal) return;

      if (saveBtnText) saveBtnText.textContent = 'Testing connection...';
      if (saveBtn) saveBtn.disabled = true;
      if (feedbackBox) {
        feedbackBox.style.display = 'block';
        feedbackBox.className = 'test-feedback-box feedback-testing';
        feedbackBox.textContent = 'Testing API key with Google Gemini servers...';
      }

      const testResult = await GeminiService.testConnection(keyVal, modelVal);

      if (testResult.success) {
        if (feedbackBox) {
          feedbackBox.className = 'test-feedback-box feedback-success';
          feedbackBox.textContent = `✓ Connected successfully to Google Gemini (${modelVal})!`;
        }

        // Save into store
        trackerStore.state.settings.geminiApiKey = keyVal;
        trackerStore.state.settings.geminiModel = modelVal;
        trackerStore.state.settings.useLiveApi = true;
        trackerStore.saveState();

        trackerStore.addChatMessage({
          sender: 'bot',
          text: `✨ **Google Gemini AI Activated (${modelVal})!**\n\nAll your exam questions, concept explanations, and study schedules are now powered directly by Gemini. What would you like to explore?`,
          type: 'text'
        });

        setTimeout(() => {
          closeModal();
        }, 1200);
      } else {
        if (feedbackBox) {
          feedbackBox.className = 'test-feedback-box feedback-error';
          feedbackBox.textContent = `✗ Connection failed: ${testResult.error || 'Invalid API key or network error'}`;
        }
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Test & Save Key';
      }
    });
  }
}
