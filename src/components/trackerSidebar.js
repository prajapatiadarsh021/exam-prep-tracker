/**
 * Tracker Sidebar Component.
 * Presents only the specific features used for tracking:
 * 1. Exam Target & Days Remaining Countdown
 * 2. Visual Syllabus Progress Bar
 * 3. Daily Checklist with 1-Click Complete & Quiz Buttons
 * 4. Inline Topic Adder
 * 5. 25-Minute Focus Pomodoro
 */

import { trackerStore } from '../store/trackerStore.js';
import { ChatBotService } from '../engine/chatBotService.js';

let activeFilter = 'all'; // 'all' | 'remaining' | 'done'

export function renderTrackerSidebar(container) {
  const state = trackerStore.getState();
  const { total, completed, percent } = ChatBotService.calculateProgress(state);
  const daysLeft = state.daysRemaining || 7;
  const weakCount = state.weakTopics ? state.weakTopics.length : 0;
  const pomodoro = state.pomodoro || { timeLeft: 25 * 60, isRunning: false, mode: 'work', totalFocusMinutes: 0 };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Flatten all topics from daily plan
  const allTopics = [];
  if (state.roadmap && state.roadmap.daily_plan) {
    state.roadmap.daily_plan.forEach(day => {
      day.topics.forEach(t => {
        allTopics.push({
          ...t,
          dayNumber: day.day_number,
          isCompleted: state.topicProgress[t.topic_id] === 'completed',
          isWeak: state.weakTopics && state.weakTopics.includes(t.topic_id)
        });
      });
    });
  }

  // Filter topics
  const filteredTopics = allTopics.filter(t => {
    if (activeFilter === 'remaining') return !t.isCompleted;
    if (activeFilter === 'done') return t.isCompleted;
    return true;
  });

  const remainingCount = total - completed;

  container.innerHTML = `
    <aside class="tracker-sidebar" id="tracker-sidebar-panel">
      <!-- 1. Exam Target Card -->
      <div class="sidebar-card exam-target-card">
        <div class="card-header-compact">
          <span class="exam-badge-icon">📘</span>
          <div class="exam-title-group">
            <h2 class="exam-title-text" title="${state.syllabusTitle}">${state.syllabusTitle}</h2>
            <div class="exam-meta-row">
              <span class="countdown-badge" id="countdown-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${daysLeft} Days Left
              </span>
              <span class="daily-target-text">${state.hoursPerDay || 4}h/day pace</span>
            </div>
          </div>
          <button class="btn-icon-tiny" id="btn-edit-exam-modal" title="Change or Customize Exam">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="progress-label-row">
            <span class="progress-text">${completed} of ${total} topics mastered</span>
            <span class="progress-percentage">${percent}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="progress-footer-stats">
            <span class="stat-pill ${percent >= 70 ? 'good' : 'warning'}">
              ${percent >= 100 ? '🎉 Syllabus Complete!' : percent >= 50 ? '🚀 Good Pace' : '⚡ Time to Push'}
            </span>
            ${weakCount > 0 ? `<span class="stat-pill review-pill">${weakCount} review needed</span>` : ''}
          </div>
        </div>
      </div>

      <!-- 2. Syllabus Checklist Card -->
      <div class="sidebar-card checklist-card">
        <div class="checklist-header">
          <div class="checklist-title-row">
            <h3>Syllabus Checklist</h3>
            <span class="topic-counter">${completed}/${total}</span>
          </div>
          <div class="filter-pills-row">
            <button class="filter-pill ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All (${total})</button>
            <button class="filter-pill ${activeFilter === 'remaining' ? 'active' : ''}" data-filter="remaining">To-Do (${remainingCount})</button>
            <button class="filter-pill ${activeFilter === 'done' ? 'active' : ''}" data-filter="done">Done (${completed})</button>
          </div>
        </div>

        <!-- Topic List -->
        <div class="topic-checklist-scroll">
          ${filteredTopics.length === 0 ? `
            <div class="empty-topics-msg">
              ${activeFilter === 'done' ? 'No topics completed yet. Check one off below!' : 'All clear! Great work.'}
            </div>
          ` : filteredTopics.map(t => `
            <div class="checklist-item ${t.isCompleted ? 'completed' : ''} ${t.isWeak ? 'weak' : ''}" data-topic-id="${t.topic_id}">
              <label class="custom-checkbox-container">
                <input type="checkbox" class="topic-checkbox" data-topic-id="${t.topic_id}" ${t.isCompleted ? 'checked' : ''} />
                <span class="checkbox-checkmark"></span>
              </label>

              <div class="topic-info">
                <span class="topic-name ${t.isCompleted ? 'line-through' : ''}">${t.name}</span>
                <div class="topic-submeta">
                  <span class="day-tag">Day ${t.dayNumber}</span>
                  ${t.estimated_hours ? `<span class="est-tag">${t.estimated_hours}h</span>` : ''}
                  ${t.isWeak ? `<span class="weak-tag">Review</span>` : ''}
                </div>
              </div>

              <button class="btn-quiz-mini" data-topic-name="${t.name}" title="Quiz me on this topic with PrepBot">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Quiz
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Inline Add Topic -->
        <form class="add-topic-form" id="add-topic-form">
          <input type="text" class="add-topic-input" id="add-topic-input" placeholder="+ Add a topic to syllabus..." required />
          <button type="submit" class="btn-add-topic" title="Add topic">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </form>
      </div>

      <!-- 3. Pomodoro Focus Timer Card -->
      <div class="sidebar-card pomodoro-card">
        <div class="pomodoro-header">
          <div class="pomodoro-title">
            <span>⏱️ Focus Timer</span>
            <span class="mode-badge ${pomodoro.mode === 'break' ? 'break' : 'work'}">
              ${pomodoro.mode === 'break' ? 'Break' : '25m Focus'}
            </span>
          </div>
          <span class="focus-logged-text">${Math.round(pomodoro.totalFocusMinutes || 0)}m focused today</span>
        </div>

        <div class="pomodoro-display">
          <span class="timer-digits">${formatTime(pomodoro.timeLeft)}</span>
        </div>

        <div class="pomodoro-actions">
          ${pomodoro.isRunning ? `
            <button class="btn-pomo btn-pause" id="btn-pomo-pause">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              Pause
            </button>
          ` : `
            <button class="btn-pomo btn-start" id="btn-pomo-start">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start Focus
            </button>
          `}
          <button class="btn-pomo btn-reset" id="btn-pomo-reset" title="Reset Timer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `;

  // Attach Event Listeners
  // 1. Topic Checkboxes
  container.querySelectorAll('.topic-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const topicId = e.target.getAttribute('data-topic-id');
      const newStatus = trackerStore.toggleTopicCompletion(topicId);
      const topic = state.findTopicById(topicId);
      
      // Let the bot drop a subtle celebratory note if checked
      if (newStatus === 'completed' && topic) {
        trackerStore.addChatMessage({
          sender: 'bot',
          text: `✅ Checked off **${topic.name}**! Great momentum.`,
          type: 'text'
        });
      }
    });
  });

  // 2. Filter Pills
  container.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeFilter = e.currentTarget.getAttribute('data-filter');
      renderTrackerSidebar(container);
    });
  });

  // 3. Quiz Buttons next to topics
  container.querySelectorAll('.btn-quiz-mini').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const topicName = e.currentTarget.getAttribute('data-topic-name');
      // Add user message asking for quiz on this topic
      trackerStore.addChatMessage({
        sender: 'user',
        text: `Quiz me on ${topicName}`,
        type: 'text'
      });
      // Generate bot quiz response
      const response = ChatBotService.handleQuizRequest(`quiz me on ${topicName}`, trackerStore.getState());
      trackerStore.addChatMessage({
        sender: 'bot',
        text: response.text,
        type: response.type,
        data: response.data
      });
    });
  });

  // 4. Add Topic Form
  const addForm = container.querySelector('#add-topic-form');
  const addInput = container.querySelector('#add-topic-input');
  if (addForm && addInput) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = addInput.value.trim();
      if (val) {
        trackerStore.addCustomTopic(val);
        addInput.value = '';
        renderTrackerSidebar(container);
      }
    });
  }

  // 5. Pomodoro Controls
  const btnStart = container.querySelector('#btn-pomo-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      trackerStore.startPomodoro();
    });
  }

  const btnPause = container.querySelector('#btn-pomo-pause');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      trackerStore.pausePomodoro();
    });
  }

  const btnReset = container.querySelector('#btn-pomo-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      trackerStore.resetPomodoro();
    });
  }

  // 6. Edit Exam Modal Button
  const btnEditExam = container.querySelector('#btn-edit-exam-modal');
  if (btnEditExam) {
    btnEditExam.addEventListener('click', () => {
      const modal = document.getElementById('simple-exam-modal-overlay');
      if (modal) modal.classList.add('active');
    });
  }
}
