/**
 * AI Academic Engine Test Console Component.
 * Allows interactive execution and validation of all three action_types with strict JSON output.
 */
import { executeEngine } from '../engine/academicEngine.js';
import { validateEngineOutput } from '../engine/engineValidator.js';
import { trackerStore } from '../store/trackerStore.js';

const DEFAULT_PAYLOADS = {
  GENERATE_ROADMAP: {
    action_type: "GENERATE_ROADMAP",
    roadmap_context: {
      syllabus_text: "Unit 1: Process Synchronization & Concurrency\n- Critical section problem, Peterson's algorithm\n- Mutex locks, Semaphores, Condition variables\n- Classical synchronization: Readers-Writers, Dining Philosophers\n\nUnit 2: Memory Management & Virtual Memory\n- Paging, Segmentation, TLB lookups\n- Demand paging, Page replacement algorithms (FIFO, LRU, Optimal)\n- Thrashing, Working-set model\n\nUnit 3: Storage & File Systems\n- Disk scheduling algorithms (FCFS, SCAN, C-SCAN)\n- File allocation methods: Contiguous, Linked, Indexed",
      days_remaining: 7,
      hours_per_day: 3.5
    }
  },
  GENERATE_QUIZ: {
    action_type: "GENERATE_QUIZ",
    quiz_context: {
      topic_name: "Virtual Memory & Demand Paging",
      key_concepts: [
        "TLB hit vs miss penalties",
        "Belady's anomaly in FIFO vs LRU",
        "Page fault handling and disk swap latency",
        "Thrashing and working-set size"
      ],
      difficulty_level: "Hard"
    }
  },
  RECALIBRATE_SCHEDULE: {
    action_type: "RECALIBRATE_SCHEDULE",
    recalibration_context: {
      weak_topic: "Virtual Memory & Demand Paging",
      quiz_score_percentage: 45,
      missed_concepts: [
        "Belady's anomaly in FIFO vs LRU",
        "Thrashing and working-set size"
      ],
      max_daily_hours: 4.0,
      remaining_schedule: [
        {
          day_number: 2,
          allocated_hours: 3.5,
          topics: [
            {
              topic_id: "T103",
              name: "Storage Architecture & Disk Scheduling",
              key_concepts: ["SCAN", "C-SCAN", "Elevator algorithm"],
              estimated_minutes: 90,
              difficulty_level: "Medium"
            },
            {
              topic_id: "T104",
              name: "File System Allocation Methods",
              key_concepts: ["Indexed allocation", "Inodes", "Free space bitmap"],
              estimated_minutes: 80,
              difficulty_level: "Medium"
            }
          ],
          revision_focus: "Disk seek optimization"
        },
        {
          day_number: 3,
          allocated_hours: 3.0,
          topics: [
            {
              topic_id: "T105",
              name: "Security, Protection & Access Control",
              key_concepts: ["Access matrix", "Capability lists"],
              estimated_minutes: 75,
              difficulty_level: "Easy"
            }
          ],
          revision_focus: "Access matrix models"
        }
      ]
    }
  }
};

export function renderConsoleView(container) {
  let activeAction = 'GENERATE_ROADMAP';
  let currentOutput = null;

  function update() {
    container.innerHTML = `
      <div style="max-width:1200px; margin:0 auto;">
        <!-- Header Banner -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:1.5rem 2rem; margin-bottom:1.5rem; backdrop-filter:blur(16px); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div>
            <h2 style="font-size:1.35rem; font-weight:700; color:#FFFFFF; display:flex; align-items:center; gap:0.6rem;">
              <span style="width:32px; height:32px; border-radius:var(--radius-sm); background:rgba(6,182,212,0.2); color:#22D3EE; display:flex; align-items:center; justify-content:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4 17 10 11 4 5"/>
                  <line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
              </span>
              AI Academic Engine Live Console
            </h2>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.35rem;">
              Strict JSON Output Testing & Validation Environment (Zero Markdown, Schema Compliant)
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge-difficulty easy" style="font-size:0.75rem;">Rule 1: Strict JSON</span>
            <span class="badge-difficulty medium" style="font-size:0.75rem;">Rule 2: Cognitive Load</span>
            <span class="badge-difficulty hard" style="font-size:0.75rem;">Rule 3: Quality MCQs</span>
            <span class="badge-difficulty easy" style="font-size:0.75rem; background:rgba(168,85,247,0.15); color:#C084FC; border-color:rgba(168,85,247,0.3);">Rule 4: Adaptive Day N+1</span>
          </div>
        </div>

        <!-- Action Selector Tabs -->
        <div class="action-selector-group" id="console-action-tabs">
          <button class="action-btn-pill ${activeAction === 'GENERATE_ROADMAP' ? 'active' : ''}" data-action="GENERATE_ROADMAP">
            1. GENERATE_ROADMAP
          </button>
          <button class="action-btn-pill ${activeAction === 'GENERATE_QUIZ' ? 'active' : ''}" data-action="GENERATE_QUIZ">
            2. GENERATE_QUIZ
          </button>
          <button class="action-btn-pill ${activeAction === 'RECALIBRATE_SCHEDULE' ? 'active' : ''}" data-action="RECALIBRATE_SCHEDULE">
            3. RECALIBRATE_SCHEDULE
          </button>
        </div>

        <!-- Dual Pane Workspace -->
        <div class="console-container">
          <!-- Left: JSON Input Payload Editor -->
          <div class="console-pane">
            <div class="console-pane-header">
              <span class="console-pane-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Engine Input Payload (JSON)
              </span>
              <button class="btn-secondary" id="btn-reset-payload" style="padding:0.35rem 0.75rem; font-size:0.75rem;">
                Reset Example
              </button>
            </div>

            <textarea class="json-editor-textarea" id="console-input-json" spellcheck="false"></textarea>

            <div style="margin-top:1rem;">
              <button class="btn-primary" id="btn-run-engine" style="width:100%; justify-content:center; padding:0.75rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Execute Academic Engine
              </button>
            </div>
          </div>

          <!-- Right: Strict JSON Output & Schema Validation -->
          <div class="console-pane">
            <div class="console-pane-header">
              <span class="console-pane-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Strict JSON Output
              </span>

              <div style="display:flex; align-items:center; gap:0.5rem;">
                <button class="btn-secondary" id="btn-copy-json" style="padding:0.35rem 0.75rem; font-size:0.75rem;">
                  Copy Output
                </button>
                ${activeAction === 'GENERATE_ROADMAP' ? `
                  <button class="btn-secondary" id="btn-apply-to-app" style="padding:0.35rem 0.75rem; font-size:0.75rem; color:#34D399; border-color:rgba(16,185,129,0.3);">
                    Apply to Active App
                  </button>
                ` : ''}
              </div>
            </div>

            <div id="validation-report-box" style="margin-bottom:0.75rem;"></div>

            <pre class="json-output-viewer" id="console-output-json">// Click "Execute Academic Engine" to generate strict schema-compliant JSON...</pre>
          </div>
        </div>
      </div>
    `;

    // Populate default textarea content
    const textarea = container.querySelector('#console-input-json');
    if (textarea) {
      textarea.value = JSON.stringify(DEFAULT_PAYLOADS[activeAction], null, 2);
    }

    attachListeners();
  }

  function attachListeners() {
    // Tab switching
    container.querySelectorAll('.action-btn-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeAction = btn.getAttribute('data-action');
        update();
      });
    });

    // Reset payload
    const btnReset = container.querySelector('#btn-reset-payload');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const textarea = container.querySelector('#console-input-json');
        if (textarea) {
          textarea.value = JSON.stringify(DEFAULT_PAYLOADS[activeAction], null, 2);
        }
      });
    }

    // Execute engine
    const btnRun = container.querySelector('#btn-run-engine');
    if (btnRun) {
      btnRun.addEventListener('click', () => {
        const textarea = container.querySelector('#console-input-json');
        const outputPre = container.querySelector('#console-output-json');
        const reportBox = container.querySelector('#validation-report-box');

        try {
          const inputPayload = JSON.parse(textarea.value);
          const result = executeEngine(inputPayload);
          currentOutput = result;

          // Strict JSON output (Rule 1: no markdown backticks, explanations outside JSON)
          const jsonString = JSON.stringify(result, null, 2);
          outputPre.textContent = jsonString;

          // Validate against operational rules
          const validation = validateEngineOutput(result, inputPayload.action_type, inputPayload.roadmap_context || inputPayload.recalibration_context || {});

          if (validation.isValid) {
            reportBox.innerHTML = `
              <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:var(--radius-sm); padding:0.6rem 0.9rem; font-size:0.75rem; color:#A7F3D0; display:flex; align-items:center; justify-content:space-between;">
                <span><strong>✓ 100% Strict Schema Valid:</strong> Meets all operational rules.</span>
                <span class="schema-badge valid">Passed</span>
              </div>
            `;
          } else {
            reportBox.innerHTML = `
              <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:0.6rem 0.9rem; font-size:0.75rem; color:#FCA5A5;">
                <strong>Validation Issues Detected:</strong>
                <ul style="margin-top:0.25rem; padding-left:1.25rem;">
                  ${validation.errors.map(err => `<li>${err}</li>`).join('')}
                </ul>
              </div>
            `;
          }
        } catch (err) {
          outputPre.textContent = `// Execution Error:\n${err.message}`;
          reportBox.innerHTML = `
            <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); border-radius:var(--radius-sm); padding:0.5rem 0.85rem; font-size:0.75rem; color:#FCA5A5;">
              Syntax / Execution Error: Invalid JSON input syntax.
            </div>
          `;
        }
      });
    }

    // Copy JSON
    const btnCopy = container.querySelector('#btn-copy-json');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const outputPre = container.querySelector('#console-output-json');
        if (outputPre && outputPre.textContent) {
          navigator.clipboard.writeText(outputPre.textContent);
          btnCopy.textContent = 'Copied!';
          setTimeout(() => { btnCopy.textContent = 'Copy Output'; }, 2000);
        }
      });
    }

    // Apply to live application
    const btnApply = container.querySelector('#btn-apply-to-app');
    if (btnApply) {
      btnApply.addEventListener('click', () => {
        if (currentOutput && currentOutput.action === 'GENERATE_ROADMAP') {
          trackerStore.getState().roadmap = currentOutput;
          trackerStore.saveState();
          trackerStore.setView('roadmap');
        }
      });
    }
  }

  update();
}
