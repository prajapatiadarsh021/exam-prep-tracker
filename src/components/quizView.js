/**
 * Interactive Diagnostic Quiz Arena Component.
 * Supports taking conceptual MCQs, immediate feedback, and triggering adaptive recalibration.
 */
import { trackerStore } from '../store/trackerStore.js';

export function renderQuizView(container) {
  const state = trackerStore.getState();
  const activeQuiz = state.activeQuiz;

  if (!activeQuiz) {
    renderTopicSelector(container, state);
    return;
  }

  if (activeQuiz.isSubmitted) {
    renderQuizResults(container, state);
    return;
  }

  renderQuizActiveQuestion(container, state);
}

function renderTopicSelector(container, state) {
  const roadmap = state.roadmap;
  const allTopics = [];
  if (roadmap && roadmap.daily_plan) {
    roadmap.daily_plan.forEach(day => {
      day.topics.forEach(t => allTopics.push(t));
    });
  }

  container.innerHTML = `
    <div class="quiz-arena-container">
      <div class="quiz-card" style="text-align:center; padding:3rem 2rem;">
        <div style="width:64px; height:64px; border-radius:50%; background:rgba(99,102,241,0.15); color:#818CF8; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF; margin-bottom:0.5rem;">
          Diagnostic Conceptual Quiz Arena
        </h2>
        <p style="color:var(--text-secondary); max-width:540px; margin:0 auto 2rem auto; font-size:0.9rem;">
          Select a completed topic from your roadmap to test deep understanding. If your score falls below 70%, the Adaptive Planner will automatically inject a recovery slot into Day N+1.
        </p>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1rem; text-align:left; margin-bottom:2rem;">
          ${allTopics.map(topic => {
            const history = state.quizHistory[topic.topic_id];
            return `
              <div class="topic-item-card" style="cursor:pointer;" data-topic-id="${topic.topic_id}">
                <div style="font-weight:600; font-size:0.875rem; color:#FFFFFF; margin-bottom:0.35rem;">
                  ${topic.name}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted);">
                  <span>${topic.difficulty_level} • ${topic.estimated_minutes}m</span>
                  ${history ? `<span style="color:${history.score >= 70 ? 'var(--success)' : 'var(--danger)'}; font-weight:600;">Score: ${history.score}%</span>` : '<span style="color:#818CF8;">Untested</span>'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.topic-item-card').forEach(card => {
    card.addEventListener('click', () => {
      const topicId = card.getAttribute('data-topic-id');
      const topic = trackerStore.findTopicById(topicId);
      if (topic) {
        trackerStore.startQuizForTopic(topic);
      }
    });
  });
}

function renderQuizActiveQuestion(container, state) {
  const { topic, questions, answers, currentQuestionIndex } = state.activeQuiz;
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const selectedOptionIndex = answers[currentQ.question_id];
  const optionLetters = ['A', 'B', 'C', 'D'];

  container.innerHTML = `
    <div class="quiz-arena-container">
      <div class="quiz-card">
        <div class="quiz-header">
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; font-weight:600; color:var(--text-muted);">Diagnostic Assessment</div>
            <div class="quiz-topic-title">${topic.name}</div>
          </div>
          <div class="quiz-progress-text">Question ${currentQuestionIndex + 1} of ${totalQuestions}</div>
        </div>

        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <div class="question-box">
          <div class="question-concept-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Concept Focus: ${currentQ.concept_tested}
          </div>
          <div class="question-text">${currentQ.question_text}</div>
        </div>

        <div class="options-grid">
          ${currentQ.options.map((optText, optIdx) => `
            <button class="option-btn ${selectedOptionIndex === optIdx ? 'selected' : ''}" 
                    data-question-id="${currentQ.question_id}" 
                    data-option-index="${optIdx}"
                    id="btn-option-${optIdx}">
              <span class="option-letter">${optionLetters[optIdx]}</span>
              <span>${optText}</span>
            </button>
          `).join('')}
        </div>

        <div class="quiz-nav-footer">
          <button class="btn-secondary" id="btn-quiz-prev" ${currentQuestionIndex === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>

          <button class="btn-secondary" id="btn-quiz-cancel">
            Exit Quiz
          </button>

          ${currentQuestionIndex === totalQuestions - 1 ? `
            <button class="btn-primary" id="btn-quiz-submit" style="background:linear-gradient(135deg, #10B981, #059669);">
              Submit Assessment
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          ` : `
            <button class="btn-primary" id="btn-quiz-next">
              Next Question
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  // Option selection
  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = parseInt(btn.getAttribute('data-question-id'), 10);
      const optIdx = parseInt(btn.getAttribute('data-option-index'), 10);
      trackerStore.selectQuizAnswer(qId, optIdx);
    });
  });

  // Navigation handlers
  const btnPrev = container.querySelector('#btn-quiz-prev');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      trackerStore.setQuizQuestionIndex(currentQuestionIndex - 1);
    });
  }

  const btnNext = container.querySelector('#btn-quiz-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      trackerStore.setQuizQuestionIndex(currentQuestionIndex + 1);
    });
  }

  const btnCancel = container.querySelector('#btn-quiz-cancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      trackerStore.getState().activeQuiz = null;
      trackerStore.setView('roadmap');
    });
  }

  const btnSubmit = container.querySelector('#btn-quiz-submit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      trackerStore.submitQuiz();
    });
  }
}

function renderQuizResults(container, state) {
  const { topic, questions, answers, scorePercentage, missedConcepts } = state.activeQuiz;
  const isPassed = scorePercentage >= 70;
  const optionLetters = ['A', 'B', 'C', 'D'];

  container.innerHTML = `
    <div class="quiz-arena-container">
      <div class="quiz-card">
        <div class="quiz-result-hero">
          <div class="score-circle ${isPassed ? 'pass' : 'fail'}">
            <span class="score-percent">${scorePercentage}%</span>
            <span class="score-label">${isPassed ? 'Mastered' : 'Needs Review'}</span>
          </div>

          <h2 style="font-size:1.4rem; font-weight:700; color:#FFFFFF; margin-bottom:0.5rem;">
            ${isPassed ? 'Exceptional Conceptual Mastery!' : 'Knowledge Gaps Identified'}
          </h2>
          <p style="color:var(--text-secondary); max-width:520px; margin:0 auto; font-size:0.9rem;">
            ${isPassed 
              ? `You scored ${scorePercentage}% on ${topic.name}. Core concepts and trade-offs are firmly consolidated.`
              : `Diagnostic score of ${scorePercentage}% is below the 70% threshold. The Adaptive Engine can automatically inject a 30-45 minute recovery review slot into Day N+1 without overloading your daily hours.`}
          </p>

          ${!isPassed ? `
            <div class="recalibrate-callout">
              <div style="font-weight:700; color:#F3E8FF; font-size:0.95rem; display:flex; align-items:center; gap:0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Adaptive Schedule Recalibration Ready
              </div>
              <p style="font-size:0.8rem; color:#D8B4FE; text-align:center; margin:0;">
                Missed concepts: <strong>${missedConcepts.join(', ') || 'Underlying principles'}</strong>.<br/>
                Injecting remediation into Day N+1 and cascading overflow topics to prevent burnout.
              </p>
              <button class="btn-primary" id="btn-trigger-recalibration" style="background:linear-gradient(135deg, #A855F7, #7C3AED); padding:0.75rem 1.75rem; font-size:0.9rem;">
                Apply Adaptive Recalibration Now
              </button>
            </div>
          ` : `
            <div style="margin-top:2rem;">
              <button class="btn-primary" id="btn-return-roadmap">
                Return to Study Roadmap
              </button>
            </div>
          `}
        </div>

        <div style="margin-top:2.5rem; border-top:1px solid var(--border-subtle); padding-top:2rem;">
          <h3 style="font-size:1.1rem; font-weight:700; color:#FFFFFF; margin-bottom:1.25rem;">
            Detailed Conceptual Review & Explanations
          </h3>

          <div style="display:flex; flex-direction:column; gap:1.5rem;">
            ${questions.map((q, idx) => {
              const chosen = answers[q.question_id];
              const isCorrect = chosen === q.correct_option_index;

              return `
                <div class="question-box" style="margin-bottom:0;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="question-concept-tag">Question ${idx + 1} • ${q.concept_tested}</span>
                    <span style="font-size:0.75rem; font-weight:700; color:${isCorrect ? 'var(--success)' : 'var(--danger)'};">
                      ${isCorrect ? '✓ Correct' : '✕ Missed'}
                    </span>
                  </div>

                  <div class="question-text" style="font-size:0.95rem; margin-bottom:1rem;">
                    ${q.question_text}
                  </div>

                  <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
                    ${q.options.map((optText, oIdx) => {
                      let classes = 'option-btn';
                      if (oIdx === q.correct_option_index) {
                        classes += ' correct-reveal';
                      } else if (oIdx === chosen) {
                        classes += ' incorrect-reveal';
                      }
                      return `
                        <div class="${classes}" style="cursor:default; padding:0.75rem 1rem;">
                          <span class="option-letter">${optionLetters[oIdx]}</span>
                          <span style="font-size:0.85rem;">${optText}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <div class="explanation-card ${isCorrect ? '' : 'error-focus'}">
                    <strong>Core Principle:</strong> ${q.explanation}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach recalibrate button handler
  const btnRecalibrate = container.querySelector('#btn-trigger-recalibration');
  if (btnRecalibrate) {
    btnRecalibrate.addEventListener('click', () => {
      trackerStore.applyRecalibration(topic.topic_id, missedConcepts, scorePercentage);
      trackerStore.getState().activeQuiz = null;
      trackerStore.setView('roadmap');
    });
  }

  const btnReturn = container.querySelector('#btn-return-roadmap');
  if (btnReturn) {
    btnReturn.addEventListener('click', () => {
      trackerStore.getState().activeQuiz = null;
      trackerStore.setView('roadmap');
    });
  }
}
