/**
 * Adaptive Recalibration Studio Component.
 * Interactive simulator and audit log for dynamic schedule rebalancing.
 */
import { trackerStore } from '../store/trackerStore.js';
import { recalibrateSchedule } from '../engine/academicEngine.js';

export function renderRecalibrateView(container) {
  const state = trackerStore.getState();
  const roadmap = state.roadmap;

  if (!roadmap || !roadmap.daily_plan) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem;">
        <h3>No active roadmap to recalibrate.</h3>
      </div>
    `;
    return;
  }

  // Find all topics
  const allTopics = [];
  roadmap.daily_plan.forEach(d => d.topics.forEach(t => allTopics.push(t)));

  const weakTopics = state.weakTopics.map(id => trackerStore.findTopicById(id)).filter(Boolean);
  const defaultSelectedTopic = weakTopics[0] || allTopics[0] || { topic_id: 'T101', name: 'Virtual Memory & Page Tables', key_concepts: ['TLB Misses', 'Page Replacement'] };

  container.innerHTML = `
    <div style="max-width:1100px; margin:0 auto;">
      <!-- Title & Rule Explanation Banner -->
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.5rem 2rem; margin-bottom:2rem; backdrop-filter:blur(16px);">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:700; color:#FFFFFF; display:flex; align-items:center; gap:0.6rem;">
              <span style="width:32px; height:32px; border-radius:var(--radius-sm); background:rgba(168,85,247,0.2); color:#C084FC; display:flex; align-items:center; justify-content:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </span>
              Adaptive Schedule Recalibration Studio
            </h2>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.35rem;">
              Powered by the AI Academic Engine's Adaptive Load Balancer (Rule 4 Compliance)
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge-difficulty hard" style="font-size:0.7rem;">Capacity Limit: ${state.hoursPerDay}h/day</span>
            <span class="badge-difficulty medium" style="font-size:0.7rem;">30-45m Review Slots</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; padding-top:1rem; border-top:1px solid var(--border-subtle);">
          <div style="font-size:0.8rem; color:var(--text-secondary);">
            <strong style="color:#C084FC;">1. Target Day N+1:</strong> Injects a dedicated 30–45 minute recovery review slot into the immediate next study day.
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">
            <strong style="color:#38BDF8;">2. Zero Capacity Overflow:</strong> If the added recovery slot exceeds the daily ${state.hoursPerDay}h limit, subsequent topics shift forward gracefully.
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">
            <strong style="color:#34D399;">3. Preserves Completed Work:</strong> Previous completed days are locked and will never be modified.
          </div>
        </div>
      </div>

      <!-- Recalibration Simulator Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem;">
        <!-- Left: Simulator Inputs -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.75rem; backdrop-filter:blur(16px);">
          <h3 style="font-size:1.05rem; font-weight:700; color:#FFFFFF; margin-bottom:1.25rem;">
            Simulation Parameters
          </h3>

          <div class="form-group">
            <label class="form-label" for="sim-select-topic">Select Topic with Low Diagnostic Score</label>
            <select class="form-select" id="sim-select-topic">
              ${allTopics.map(t => `
                <option value="${t.topic_id}" ${t.topic_id === defaultSelectedTopic.topic_id ? 'selected' : ''}>
                  ${t.name} (${t.difficulty_level})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="sim-quiz-score">
              Simulated Diagnostic Score: <span id="sim-score-val" style="color:#F87171; font-weight:700;">45%</span>
            </label>
            <input type="range" class="form-input" id="sim-quiz-score" min="10" max="90" step="5" value="45" style="padding:0.25rem 0;">
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-top:0.25rem;">
              <span>10% (Severe)</span>
              <span>45% (Critical)</span>
              <span>70% (Passing Threshold)</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="sim-missed-concepts">Missed Conceptual Focus Areas (Comma separated)</label>
            <input type="text" class="form-input" id="sim-missed-concepts" 
                   value="${defaultSelectedTopic.key_concepts ? defaultSelectedTopic.key_concepts.slice(0, 2).join(', ') : 'Boundary conditions, State machine race conditions'}">
          </div>

          <button class="btn-primary" id="btn-run-simulation" style="width:100%; justify-content:center; background:linear-gradient(135deg, #A855F7, #7C3AED); padding:0.8rem; margin-top:0.5rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Apply Recalibration to Schedule
          </button>
        </div>

        <!-- Right: Live Recalibration Preview -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.75rem; backdrop-filter:blur(16px); display:flex; flex-direction:column;">
          <h3 style="font-size:1.05rem; font-weight:700; color:#FFFFFF; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center;">
            <span>Engine Output Preview</span>
            <span class="badge-difficulty easy" style="font-size:0.65rem;">Strict Schema Valid</span>
          </h3>

          <div id="sim-preview-content" style="flex:1; background:#070A10; border-radius:var(--radius-md); padding:1rem; border:1px solid var(--border-subtle); font-family:var(--font-mono); font-size:0.775rem; color:#A7F3D0; overflow-y:auto; max-height:360px;">
            // Run simulation to inspect the engine's strict RECALIBRATE_SCHEDULE output payload...
          </div>
        </div>
      </div>

      <!-- Recalibration Audit Log -->
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.75rem; backdrop-filter:blur(16px);">
        <h3 style="font-size:1.05rem; font-weight:700; color:#FFFFFF; margin-bottom:1rem;">
          Recalibration Event Log
        </h3>

        ${state.recalibrationHistory.length === 0 ? `
          <div style="color:var(--text-muted); font-size:0.85rem; padding:1.5rem; text-align:center; border:1px dashed var(--border-subtle); border-radius:var(--radius-md);">
            No adaptive adjustments triggered yet. Complete a quiz below 70% or run the simulator above.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${state.recalibrationHistory.map(entry => `
              <div style="background:rgba(14, 19, 31, 0.6); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.85rem 1.25rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
                <div>
                  <div style="font-weight:600; color:#FFFFFF; font-size:0.85rem;">
                    ${entry.topicName}
                    <span style="color:#F87171; font-size:0.75rem; margin-left:6px;">(${entry.score}% Diagnostic Score)</span>
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
                    ${entry.reason}
                  </div>
                </div>
                <div style="font-size:0.75rem; color:#C084FC; font-weight:600; background:var(--recovery-bg); padding:0.25rem 0.65rem; border-radius:var(--radius-full); border:1px solid rgba(168,85,247,0.3);">
                  +${entry.recoveryMinutes}m Recovery Injected
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  // Simulator controls
  const scoreSlider = container.querySelector('#sim-quiz-score');
  const scoreVal = container.querySelector('#sim-score-val');
  const selectTopic = container.querySelector('#sim-select-topic');
  const missedInput = container.querySelector('#sim-missed-concepts');
  const btnRun = container.querySelector('#btn-run-simulation');
  const previewBox = container.querySelector('#sim-preview-content');

  if (scoreSlider && scoreVal) {
    scoreSlider.addEventListener('input', () => {
      scoreVal.textContent = `${scoreSlider.value}%`;
      scoreVal.style.color = scoreSlider.value >= 70 ? 'var(--success)' : 'var(--danger)';
    });
  }

  if (selectTopic && missedInput) {
    selectTopic.addEventListener('change', () => {
      const topic = trackerStore.findTopicById(selectTopic.value);
      if (topic && topic.key_concepts) {
        missedInput.value = topic.key_concepts.slice(0, 2).join(', ');
      }
    });
  }

  if (btnRun) {
    btnRun.addEventListener('click', () => {
      const topicId = selectTopic.value;
      const score = parseInt(scoreSlider.value, 10);
      const missed = missedInput.value.split(',').map(s => s.trim()).filter(Boolean);

      const result = trackerStore.applyRecalibration(topicId, missed, score);
      if (result && previewBox) {
        previewBox.textContent = JSON.stringify(result, null, 2);
      }
    });
  }
}
