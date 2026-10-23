/**
 * Floating Study Focus & Pomodoro HUD Component.
 */
import { trackerStore } from '../store/trackerStore.js';

export function renderStudyTimer(container) {
  const state = trackerStore.getState();
  const { isRunning, timeLeft, mode, activeTopicId } = state.pomodoro;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const activeTopic = activeTopicId ? trackerStore.findTopicById(activeTopicId) : null;

  container.innerHTML = `
    <aside class="timer-hud" id="study-timer-hud" aria-label="Study Focus Timer">
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span class="timer-hud-mode">${mode === 'work' ? 'Focus Session' : 'Rest Break'}</span>
        ${activeTopic ? `
          <span style="font-size:0.75rem; color:var(--text-primary); max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            • ${activeTopic.name}
          </span>
        ` : ''}
      </div>

      <div class="timer-hud-digits" id="timer-digits-display">${timeFormatted}</div>

      <div style="display:flex; align-items:center; gap:0.4rem;">
        <button class="timer-btn-round" id="btn-timer-toggle" title="${isRunning ? 'Pause Timer' : 'Start Focus Timer'}">
          ${isRunning ? `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ` : `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          `}
        </button>

        <button class="timer-btn-round" id="btn-timer-reset" style="background:rgba(255,255,255,0.08); color:var(--text-muted);" title="Reset Timer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
      </div>
    </aside>
  `;

  // Timer button listeners
  const btnToggle = container.querySelector('#btn-timer-toggle');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      if (isRunning) {
        trackerStore.pausePomodoro();
      } else {
        trackerStore.startPomodoro();
      }
    });
  }

  const btnReset = container.querySelector('#btn-timer-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      trackerStore.resetPomodoro();
    });
  }
}
