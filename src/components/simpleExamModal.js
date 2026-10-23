/**
 * Simple Exam Modal Component.
 * Enables quick switching between preset exams or creating a custom exam roadmap.
 */

import { trackerStore } from '../store/trackerStore.js';
import { SAMPLE_SYLLABI } from '../data/sampleSyllabi.js';

export function renderSimpleExamModal(container) {
  const state = trackerStore.getState();

  container.innerHTML = `
    <div class="modal-overlay" id="simple-exam-modal-overlay">
      <div class="modal-card simple-exam-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <h3>Switch or Plan Exam</h3>
            <p>Pick a popular curriculum or configure your own exam countdown.</p>
          </div>
          <button class="modal-close-btn" id="btn-close-exam-modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body-simple">
          <!-- 1. Presets Selection -->
          <div class="exam-section-block">
            <label class="section-label">⚡ Quick Presets</label>
            <div class="presets-simple-grid">
              ${SAMPLE_SYLLABI.map(preset => `
                <button class="preset-card-btn ${state.syllabusTitle === preset.title ? 'active' : ''}" data-preset-id="${preset.id}">
                  <div class="preset-meta-top">
                    <span class="preset-days-badge">${preset.defaultDays} Days</span>
                    <span class="preset-cat">${preset.category}</span>
                  </div>
                  <strong class="preset-name">${preset.title}</strong>
                  <span class="preset-sub">${preset.description}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="divider-text">
            <span>OR CREATE CUSTOM EXAM</span>
          </div>

          <!-- 2. Custom Exam Form -->
          <form id="custom-exam-form" class="custom-exam-form">
            <div class="form-row">
              <div class="form-group flex-2">
                <label for="custom-exam-title">Exam Subject / Title</label>
                <input type="text" id="custom-exam-title" placeholder="e.g. Organic Chemistry Final" required />
              </div>
              <div class="form-group flex-1">
                <label for="custom-exam-days">Days Left</label>
                <input type="number" id="custom-exam-days" min="1" max="180" value="7" required />
              </div>
              <div class="form-group flex-1">
                <label for="custom-exam-hours">Hours / Day</label>
                <input type="number" id="custom-exam-hours" min="1" max="16" step="0.5" value="4.0" required />
              </div>
            </div>

            <div class="form-group">
              <label for="custom-exam-topics">Syllabus Topics (One per line)</label>
              <textarea
                id="custom-exam-topics"
                rows="4"
                placeholder="Unit 1: Fundamentals&#10;Unit 2: Core Equations&#10;Unit 3: Problem Applications&#10;Unit 4: Review & Synthesis"
                required
              ></textarea>
            </div>

            <div class="modal-footer-actions">
              <button type="button" class="btn-secondary" id="btn-cancel-exam-modal">Cancel</button>
              <button type="submit" class="btn-primary" id="btn-save-custom-exam">Save & Start Prep</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Attach Event Handlers
  const modal = container.querySelector('#simple-exam-modal-overlay');
  const btnClose = container.querySelector('#btn-close-exam-modal');
  const btnCancel = container.querySelector('#btn-cancel-exam-modal');

  const closeModal = () => {
    if (modal) modal.classList.remove('active');
  };

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  // Click outside to close
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Preset Selection
  container.querySelectorAll('.preset-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetId = e.currentTarget.getAttribute('data-preset-id');
      const preset = SAMPLE_SYLLABI.find(p => p.id === presetId);
      trackerStore.loadPreset(presetId);

      trackerStore.addChatMessage({
        sender: 'bot',
        text: `🔄 Switched your exam to **${preset.title}** with **${preset.defaultDays} days remaining**.\n\nYour checklist has been updated. Ask me *"What should I study today?"* to get rolling!`,
        type: 'text'
      });

      closeModal();
    });
  });

  // Custom Form Submit
  const form = container.querySelector('#custom-exam-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = container.querySelector('#custom-exam-title').value.trim();
      const days = container.querySelector('#custom-exam-days').value;
      const hours = container.querySelector('#custom-exam-hours').value;
      const topicsText = container.querySelector('#custom-exam-topics').value.trim();

      if (!title || !topicsText) return;

      // Construct clean syllabus text format
      const formattedSyllabus = topicsText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `- ${line}`)
        .join('\n');

      trackerStore.createRoadmap(formattedSyllabus, days, hours, title);

      trackerStore.addChatMessage({
        sender: 'bot',
        text: `🎯 Successfully configured **${title}** with a **${days}-day countdown**.\n\nI've generated your custom checklist on the left. Type **"What should I study today?"** to begin!`,
        type: 'text'
      });

      closeModal();
    });
  }
}
