/**
 * Reference Context Modal Component.
 * Enables the student to view, edit, or attach reference context (syllabus, study notes,
 * textbook excerpts) that the chatbot strictly bases its answers on.
 */

import { trackerStore } from '../store/trackerStore.js';

export function renderReferenceContextModal(container) {
  const state = trackerStore.getState();
  const currentContext = state.referenceContext || state.syllabusText || '';

  let modalWrap = document.getElementById('context-modal-mount');
  if (!modalWrap) {
    modalWrap = document.createElement('div');
    modalWrap.id = 'context-modal-mount';
    container.appendChild(modalWrap);
  }

  modalWrap.innerHTML = `
    <div class="modal-overlay" id="context-modal-overlay">
      <div class="modal-card context-modal-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="context-title-row">
              <span class="context-icon">📄</span>
              <h3>Chatbot Reference Context & Grounding</h3>
            </div>
            <p>The chatbot answers strictly from this reference text using strict factual grounding rules.</p>
          </div>
          <button class="modal-close-btn" id="btn-close-context-modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body-simple">
          <div class="context-rules-box">
            <span class="rules-badge">Strict Grounding Active</span>
            <ul>
              <li>Answers are based <strong>strictly</strong> on the facts present in this text.</li>
              <li>No outside assumptions or extrapolations are made.</li>
              <li>If the text does not contain enough info, the bot responds: <em>"The provided context does not contain sufficient information to answer this question."</em></li>
            </ul>
          </div>

          <form id="reference-context-form" class="context-form">
            <div class="form-group">
              <div class="label-with-link">
                <label for="reference-context-textarea">Reference Text / Study Notes / Syllabus</label>
                <span class="context-char-count" id="context-char-count">${currentContext.length} chars</span>
              </div>
              <textarea
                id="reference-context-textarea"
                rows="12"
                placeholder="Paste your syllabus, lecture notes, textbook passages, or study guides here..."
                required
              >${currentContext}</textarea>
            </div>

            <div class="modal-footer-actions">
              <button type="button" class="btn-secondary" id="btn-reset-syllabus-context">
                Reset to Exam Syllabus
              </button>
              <button type="button" class="btn-secondary" id="btn-cancel-context-modal">Cancel</button>
              <button type="submit" class="btn-primary" id="btn-save-context">Save Reference Context</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Attach Event Handlers
  const modal = modalWrap.querySelector('#context-modal-overlay');
  const btnClose = modalWrap.querySelector('#btn-close-context-modal');
  const btnCancel = modalWrap.querySelector('#btn-cancel-context-modal');
  const textarea = modalWrap.querySelector('#reference-context-textarea');
  const charCount = modalWrap.querySelector('#context-char-count');
  const btnReset = modalWrap.querySelector('#btn-reset-syllabus-context');
  const form = modalWrap.querySelector('#reference-context-form');

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

  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      charCount.textContent = `${textarea.value.length} chars`;
    });
  }

  // Reset to original syllabus
  if (btnReset && textarea) {
    btnReset.addEventListener('click', () => {
      textarea.value = state.syllabusText || '';
      if (charCount) charCount.textContent = `${textarea.value.length} chars`;
    });
  }

  // Save Reference Context
  if (form && textarea) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = textarea.value.trim();
      trackerStore.updateReferenceContext(val);

      trackerStore.addChatMessage({
        sender: 'bot',
        text: `📄 **Reference Context Updated!** (${val.length} characters)\n\nI will now answer your questions strictly based on this reference context according to the grounding rules.`,
        type: 'text'
      });

      closeModal();
    });
  }
}
