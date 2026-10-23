/**
 * Roadmap Schedule & KPI Dashboard View.
 */
import { trackerStore } from '../store/trackerStore.js';

export function renderRoadmapView(container) {
  const state = trackerStore.getState();
  const roadmap = state.roadmap;

  if (!roadmap || !roadmap.daily_plan) {
    container.innerHTML = `
      <div style="text-align:center; padding:4rem 2rem;">
        <h3>No active roadmap generated yet.</h3>
        <p style="color:var(--text-secondary); margin:1rem 0;">Click "New Plan" or choose a preset syllabus to get started.</p>
      </div>
    `;
    return;
  }

  // Calculate statistics
  let totalTopics = 0;
  let completedTopics = 0;
  let totalHours = 0;

  roadmap.daily_plan.forEach(day => {
    totalHours += day.allocated_hours || 0;
    day.topics.forEach(t => {
      totalTopics++;
      if (state.topicProgress[t.topic_id] === 'completed') {
        completedTopics++;
      }
    });
  });

  const completionPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const weakCount = state.weakTopics.length;
  const revisionDaysCount = roadmap.total_days >= 4 ? 2 : 1;

  container.innerHTML = `
    <!-- KPI Overview Cards -->
    <section class="kpi-grid" aria-label="Key Performance Indicators">
      <div class="kpi-card cyan">
        <div class="kpi-info">
          <h4>Plan Horizon</h4>
          <div class="kpi-value" id="kpi-total-days">${roadmap.total_days} Days</div>
          <div class="kpi-subtext">${state.hoursPerDay}h/day cap | ${totalHours.toFixed(1)}h total load</div>
        </div>
        <div class="kpi-icon-bubble">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      </div>

      <div class="kpi-card emerald">
        <div class="kpi-info">
          <h4>Syllabus Mastery</h4>
          <div class="kpi-value" id="kpi-completion-percent">${completionPercent}%</div>
          <div class="kpi-subtext">${completedTopics} of ${totalTopics} topics mastered</div>
        </div>
        <div class="kpi-icon-bubble">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
      </div>

      <div class="kpi-card ${weakCount > 0 ? 'amber' : 'emerald'}">
        <div class="kpi-info">
          <h4>Cognitive Load & Health</h4>
          <div class="kpi-value" style="font-size:1.35rem; font-weight:700;">
            ${weakCount > 0 ? `${weakCount} Topic Needs Review` : 'Balanced'}
          </div>
          <div class="kpi-subtext">
            Final ${revisionDaysCount} days reserved for full revision
          </div>
        </div>
        <div class="kpi-icon-bubble">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
      </div>

      <div class="kpi-card purple">
        <div class="kpi-info">
          <h4>Adaptive Recovery</h4>
          <div class="kpi-value" style="font-size:1.35rem; font-weight:700;">
            ${roadmap.daily_plan.some(d => d.includes_recovery_slot) ? 'Active' : 'Standby'}
          </div>
          <div class="kpi-subtext">
            ${roadmap.daily_plan.some(d => d.includes_recovery_slot) ? 'Recovery slot injected in Day N+1' : 'Ready for diagnostic feedback'}
          </div>
        </div>
        <div class="kpi-icon-bubble">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- Controls Bar -->
    <div class="roadmap-controls-bar">
      <div class="roadmap-title-area">
        <h2>
          <span>${state.syllabusTitle || 'Study Roadmap'}</span>
          <span class="badge-cognitive-health">Cognitive Load Balanced</span>
        </h2>
        <span style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
          Evenly distributed topics without violating daily ${state.hoursPerDay}h limits
        </span>
      </div>

      <div style="display:flex; align-items:center; gap:0.75rem;">
        ${weakCount > 0 ? `
          <button class="btn-primary" id="btn-quick-recalibrate" style="background:linear-gradient(135deg, #A855F7, #7C3AED);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Recalibrate Schedule (${weakCount} Weak)
          </button>
        ` : ''}

        <button class="btn-secondary" id="btn-export-plan-json" title="Export this roadmap as strict JSON">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export JSON
        </button>
      </div>
    </div>

    <!-- Days Timeline Grid -->
    <div class="days-timeline-grid" id="days-timeline-container">
      ${roadmap.daily_plan.map(day => renderDayCard(day, state)).join('')}
    </div>
  `;

  // Attach event listeners for day cards
  attachRoadmapListeners(container, state);
}

function renderDayCard(day, state) {
  const isAllCompleted = day.topics.length > 0 && day.topics.every(t => state.topicProgress[t.topic_id] === 'completed');
  const isRevisionDay = day.topics.length === 0 || day.topics.every(t => t.topic_id.startsWith('REV') || t.name.toLowerCase().includes('revision') || t.name.toLowerCase().includes('mock'));
  const hasRecovery = Boolean(day.includes_recovery_slot && day.recovery_details);

  return `
    <div class="day-card ${isAllCompleted ? 'completed' : ''} ${hasRecovery ? 'has-recovery' : ''} ${isRevisionDay ? 'revision-day' : ''}" id="day-card-${day.day_number}">
      <div class="day-card-header">
        <div class="day-meta">
          <span class="day-number-pill">${isAllCompleted ? '✓ Done' : `Day ${day.day_number}`}</span>
          <span class="day-title">${isRevisionDay ? 'Revision & Mocks' : `Session ${day.day_number}`}</span>
        </div>
        <div class="day-hours-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          ${day.allocated_hours}h / ${state.hoursPerDay}h
        </div>
      </div>

      ${hasRecovery ? `
        <div class="recovery-slot-banner" id="recovery-slot-day-${day.day_number}">
          <div class="recovery-slot-header">
            <span class="recovery-slot-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Adaptive Recovery Slot: ${day.recovery_details.topic}
            </span>
            <span class="recovery-duration-badge">+${day.recovery_details.allotted_minutes} min</span>
          </div>
          <div style="font-size:0.7rem; color:#E9D5FF;">Focus Remediation Areas:</div>
          <ul class="recovery-focus-list">
            ${(day.recovery_details.focus_areas || []).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${day.revision_focus ? `
        <div class="day-revision-banner">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span><strong>Focus:</strong> ${day.revision_focus}</span>
        </div>
      ` : ''}

      <div class="day-topics-list">
        ${day.topics.map(topic => renderTopicItem(topic, state)).join('')}
      </div>
    </div>
  `;
}

function renderTopicItem(topic, state) {
  const status = state.topicProgress[topic.topic_id] || 'todo';
  const history = state.quizHistory[topic.topic_id];
  const isWeak = state.weakTopics.includes(topic.topic_id);

  return `
    <div class="topic-item-card ${status} ${isWeak ? 'needs-review' : ''}" id="topic-item-${topic.topic_id}">
      <div class="topic-header">
        <div style="display:flex; align-items:flex-start; gap:0.65rem;">
          <button class="btn-mark-status ${status === 'completed' ? 'completed' : ''}" 
                  data-topic-id="${topic.topic_id}" 
                  data-current-status="${status}"
                  title="Toggle Completion Status"
                  id="btn-status-${topic.topic_id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${status === 'completed' 
                ? '<circle cx="12" cy="12" r="10" fill="currentColor"/><polyline points="9 12 11 14 15 10" stroke="#080B11"/>'
                : '<circle cx="12" cy="12" r="10"/>'}
            </svg>
          </button>
          <div>
            <div class="topic-name">${topic.name}</div>
            ${history ? `
              <div style="font-size:0.7rem; color:${history.score >= 70 ? 'var(--success)' : 'var(--danger)'}; margin-top:2px;">
                Quiz Score: ${history.score}% ${history.score < 70 ? '• Needs Recalibration' : '• Mastered'}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="topic-badges">
          <span class="badge-difficulty ${topic.difficulty_level.toLowerCase()}">${topic.difficulty_level}</span>
          <span class="badge-time">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${topic.estimated_minutes}m
          </span>
        </div>
      </div>

      <div class="key-concepts-container">
        ${(topic.key_concepts || []).map(concept => `
          <span class="concept-pill">${concept}</span>
        `).join('')}
      </div>

      <div class="topic-actions">
        <button class="btn-quiz-trigger" 
                data-topic-id="${topic.topic_id}"
                id="btn-quiz-start-${topic.topic_id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          ${history ? 'Retake Quiz' : 'Diagnostic Quiz'}
        </button>

        <button class="btn-timer-trigger" 
                data-topic-id="${topic.topic_id}"
                id="btn-timer-start-${topic.topic_id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Study Focus
        </button>
      </div>
    </div>
  `;
}

function attachRoadmapListeners(container, state) {
  // Topic toggle status
  container.querySelectorAll('.btn-mark-status').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const topicId = btn.getAttribute('data-topic-id');
      const currentStatus = btn.getAttribute('data-current-status');
      const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      trackerStore.updateTopicStatus(topicId, newStatus);
    });
  });

  // Start Diagnostic Quiz
  container.querySelectorAll('.btn-quiz-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const topicId = btn.getAttribute('data-topic-id');
      const topic = trackerStore.findTopicById(topicId);
      if (topic) {
        trackerStore.startQuizForTopic(topic);
      }
    });
  });

  // Start Study Timer
  container.querySelectorAll('.btn-timer-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const topicId = btn.getAttribute('data-topic-id');
      trackerStore.startPomodoro(topicId);
    });
  });

  // Quick recalibrate button
  const btnQuickRecalibrate = container.querySelector('#btn-quick-recalibrate');
  if (btnQuickRecalibrate) {
    btnQuickRecalibrate.addEventListener('click', () => {
      trackerStore.setView('recalibrate');
    });
  }

  // Export JSON
  const btnExport = container.querySelector('#btn-export-plan-json');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const jsonStr = JSON.stringify(state.roadmap, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_roadmap_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
