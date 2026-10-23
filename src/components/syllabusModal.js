/**
 * Syllabus Creation & Presets Modal Components.
 */
import { trackerStore } from '../store/trackerStore.js';
import { SAMPLE_SYLLABI } from '../data/sampleSyllabi.js';

export function renderModals(container) {
  container.innerHTML = `
    <!-- New Syllabus Modal -->
    <div class="modal-overlay" id="syllabus-modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">Generate Adaptive Study Roadmap</h3>
          <button class="modal-close-btn" id="btn-close-syllabus-modal">&times;</button>
        </div>

        <form id="form-create-roadmap">
          <div class="form-group">
            <label class="form-label" for="input-plan-title">Curriculum / Exam Title</label>
            <input type="text" class="form-input" id="input-plan-title" placeholder="e.g., Computer Systems Architecture (Final Exam)" required value="Custom Exam Preparation">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="input-days-remaining">Days Remaining to Exam</label>
              <input type="number" class="form-input" id="input-days-remaining" min="1" max="60" value="7" required>
              <span style="font-size:0.7rem; color:var(--text-muted);">Final 1-2 days reserved for revision</span>
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="input-hours-per-day">Max Study Hours / Day</label>
              <input type="number" class="form-input" id="input-hours-per-day" min="1" max="14" step="0.5" value="4.0" required>
              <span style="font-size:0.7rem; color:var(--text-muted);">Prevents cognitive overload</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="input-syllabus-text">Raw Syllabus Content / Units & Topics</label>
            <textarea class="form-textarea" id="input-syllabus-text" rows="8" placeholder="Paste your course units, chapters, or lecture breakdown here..." required></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
            <button type="button" class="btn-secondary" id="btn-cancel-syllabus-modal">Cancel</button>
            <button type="submit" class="btn-primary" id="btn-submit-generate-plan">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Generate AI Plan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Presets Selection Modal -->
    <div class="modal-overlay" id="presets-modal-overlay">
      <div class="modal-box" style="max-width:720px;">
        <div class="modal-header">
          <h3 class="modal-title">Select Pre-Configured Academic Curriculum</h3>
          <button class="modal-close-btn" id="btn-close-presets-modal">&times;</button>
        </div>

        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1.5rem;">
          Load a realistic, high-stakes academic syllabus pre-tuned with balanced cognitive hours and conceptual question banks.
        </p>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
          ${SAMPLE_SYLLABI.map(preset => `
            <div class="topic-item-card preset-card-btn" data-preset-id="${preset.id}" style="cursor:pointer; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                  <span class="badge-difficulty medium" style="font-size:0.65rem;">${preset.category}</span>
                  <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${preset.defaultDays} Days • ${preset.defaultHours}h/day</span>
                </div>
                <h4 style="font-size:0.95rem; font-weight:700; color:#FFFFFF; margin-bottom:0.35rem;">${preset.title}</h4>
                <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">${preset.description}</p>
              </div>
              <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.75rem; color:#818CF8; font-weight:600;">Load Plan & Schedule &rarr;</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  const syllabusOverlay = container.querySelector('#syllabus-modal-overlay');
  const presetsOverlay = container.querySelector('#presets-modal-overlay');

  const closeSyllabus = () => syllabusOverlay?.classList.remove('active');
  const closePresets = () => presetsOverlay?.classList.remove('active');

  container.querySelector('#btn-close-syllabus-modal')?.addEventListener('click', closeSyllabus);
  container.querySelector('#btn-cancel-syllabus-modal')?.addEventListener('click', closeSyllabus);
  container.querySelector('#btn-close-presets-modal')?.addEventListener('click', closePresets);

  // Form submit
  const form = container.querySelector('#form-create-roadmap');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = container.querySelector('#input-plan-title').value;
      const days = container.querySelector('#input-days-remaining').value;
      const hours = container.querySelector('#input-hours-per-day').value;
      const syllabus = container.querySelector('#input-syllabus-text').value;

      trackerStore.createRoadmap(syllabus, days, hours, title);
      closeSyllabus();
    });
  }

  // Preset click
  container.querySelectorAll('.preset-card-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetId = btn.getAttribute('data-preset-id');
      trackerStore.loadPreset(presetId);
      closePresets();
    });
  });
}
