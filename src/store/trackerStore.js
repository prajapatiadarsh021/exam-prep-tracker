/**
 * Reactive State Management for the Exam Prep Tracker.
 * Manages syllabus, active roadmap, topic completion states, quiz results,
 * study timer, and recalibration history with persistent localStorage storage.
 */

import { generateRoadmap, generateQuiz, recalibrateSchedule } from '../engine/academicEngine.js';
import { SAMPLE_SYLLABI } from '../data/sampleSyllabi.js';

const STORAGE_KEY = 'prep_pulse_tracker_state_v1';

class TrackerStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();

    if (!this.state.roadmap || !this.state.roadmap.daily_plan) {
      this.initDefaultPlan();
    }

    // Pomodoro timer interval handle
    this.timerInterval = null;
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.referenceContext) {
          parsed.referenceContext = parsed.syllabusText || SAMPLE_SYLLABI[0].syllabusText;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved state, initializing fresh', e);
    }

    return {
      activeView: 'roadmap', // 'roadmap' | 'quiz' | 'recalibrate' | 'console' | 'analytics'
      syllabusText: SAMPLE_SYLLABI[0].syllabusText,
      syllabusTitle: SAMPLE_SYLLABI[0].title,
      referenceContext: SAMPLE_SYLLABI[0].syllabusText,
      daysRemaining: 7,
      hoursPerDay: 4.0,
      roadmap: null,
      topicProgress: {}, // topic_id -> 'todo' | 'in_progress' | 'completed'
      quizHistory: {},   // topic_id -> { score: number, passed: boolean, missedConcepts: [], date: string }
      weakTopics: [],    // list of topic_ids with score < 70%
      recalibrationHistory: [],
      activeQuiz: null,  // { topic, questions, answers, currentQ, submitted, result }
      pomodoro: {
        isRunning: false,
        timeLeft: 25 * 60, // 25 minutes
        mode: 'work', // 'work' | 'break'
        activeTopicId: null,
        totalFocusMinutes: 0
      },
      chatMessages: [
        {
          id: 'welcome-msg',
          sender: 'bot',
          text: "👋 Hi there! I'm your **Exam Prep AI Assistant**.\n\nI keep your study plan simple, focused, and stress-free. Here's what you can do right now:",
          type: 'welcome',
          timestamp: 'Just now'
        }
      ],
      settings: {
        geminiApiKey: '',
        useLiveApi: false,
        theme: 'dark'
      }
    };
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  getState() {
    return this.state;
  }

  initDefaultPlan() {
    const defaultSyllabus = SAMPLE_SYLLABI[0];
    this.state.syllabusTitle = defaultSyllabus.title;
    this.state.syllabusText = defaultSyllabus.syllabusText;
    this.state.daysRemaining = defaultSyllabus.defaultDays;
    this.state.hoursPerDay = defaultSyllabus.defaultHours;
    
    const roadmap = generateRoadmap({
      syllabus_text: defaultSyllabus.syllabusText,
      days_remaining: defaultSyllabus.defaultDays,
      hours_per_day: defaultSyllabus.defaultHours
    });

    this.state.roadmap = roadmap;
    this.state.topicProgress = {};
    
    // Seed first topic as completed for demonstration of completed days protection
    if (roadmap.daily_plan && roadmap.daily_plan[0] && roadmap.daily_plan[0].topics[0]) {
      const firstTopicId = roadmap.daily_plan[0].topics[0].topic_id;
      this.state.topicProgress[firstTopicId] = 'completed';
    }

    this.saveState();
  }

  // Set active top navigation view
  setView(viewName) {
    this.state.activeView = viewName;
    this.saveState();
  }

  // Load a preset syllabus
  loadPreset(presetId) {
    const preset = SAMPLE_SYLLABI.find(s => s.id === presetId);
    if (!preset) return;

    this.state.syllabusTitle = preset.title;
    this.state.syllabusText = preset.syllabusText;
    this.state.referenceContext = preset.syllabusText;
    this.state.daysRemaining = preset.defaultDays;
    this.state.hoursPerDay = preset.defaultHours;
    this.state.topicProgress = {};
    this.state.quizHistory = {};
    this.state.weakTopics = [];

    this.state.roadmap = generateRoadmap({
      syllabus_text: preset.syllabusText,
      days_remaining: preset.defaultDays,
      hours_per_day: preset.defaultHours
    });

    this.state.activeView = 'roadmap';
    this.saveState();
  }

  // Generate a brand new roadmap
  createRoadmap(syllabusText, days, hours, title = 'Custom Exam Plan') {
    this.state.syllabusText = syllabusText;
    this.state.syllabusTitle = title;
    this.state.referenceContext = syllabusText;
    this.state.daysRemaining = parseInt(days, 10);
    this.state.hoursPerDay = parseFloat(hours);
    this.state.topicProgress = {};
    this.state.quizHistory = {};
    this.state.weakTopics = [];

    const roadmap = generateRoadmap({
      syllabus_text: syllabusText,
      days_remaining: this.state.daysRemaining,
      hours_per_day: this.state.hoursPerDay
    });

    this.state.roadmap = roadmap;
    this.state.activeView = 'roadmap';
    this.saveState();
  }

  // Toggle or update topic progress status
  updateTopicStatus(topicId, status) {
    this.state.topicProgress[topicId] = status;
    this.saveState();
  }

  // Start diagnostic quiz for a topic
  startQuizForTopic(topic) {
    const quizResult = generateQuiz({
      topic_name: topic.name,
      key_concepts: topic.key_concepts,
      difficulty_level: topic.difficulty_level
    });

    this.state.activeQuiz = {
      topic: topic,
      questions: quizResult.questions,
      answers: {}, // question_id -> selected_option_index
      currentQuestionIndex: 0,
      isSubmitted: false,
      scorePercentage: 0,
      missedConcepts: []
    };

    this.state.activeView = 'quiz';
    this.saveState();
  }

  // Record an answer in active quiz
  selectQuizAnswer(questionId, optionIndex) {
    if (!this.state.activeQuiz || this.state.activeQuiz.isSubmitted) return;
    this.state.activeQuiz.answers[questionId] = optionIndex;
    this.saveState();
  }

  // Next / Prev question in quiz
  setQuizQuestionIndex(index) {
    if (!this.state.activeQuiz) return;
    this.state.activeQuiz.currentQuestionIndex = Math.max(0, Math.min(index, this.state.activeQuiz.questions.length - 1));
    this.saveState();
  }

  // Submit active quiz and evaluate results
  submitQuiz() {
    if (!this.state.activeQuiz || this.state.activeQuiz.isSubmitted) return;
    const { questions, answers, topic } = this.state.activeQuiz;

    let correctCount = 0;
    const missedConcepts = [];

    questions.forEach(q => {
      const chosen = answers[q.question_id];
      if (chosen === q.correct_option_index) {
        correctCount++;
      } else {
        missedConcepts.push(q.concept_tested);
      }
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    this.state.activeQuiz.isSubmitted = true;
    this.state.activeQuiz.scorePercentage = scorePercentage;
    this.state.activeQuiz.missedConcepts = missedConcepts;

    // Save into history
    this.state.quizHistory[topic.topic_id] = {
      score: scorePercentage,
      passed: scorePercentage >= 70,
      missedConcepts,
      date: new Date().toISOString()
    };

    // If score < 70%, flag as weak topic
    if (scorePercentage < 70) {
      if (!this.state.weakTopics.includes(topic.topic_id)) {
        this.state.weakTopics.push(topic.topic_id);
      }
      this.state.topicProgress[topic.topic_id] = 'needs_review';
    } else {
      this.state.weakTopics = this.state.weakTopics.filter(id => id !== topic.topic_id);
      this.state.topicProgress[topic.topic_id] = 'completed';
    }

    this.saveState();
  }

  // Trigger Adaptive Recalibration
  applyRecalibration(topicId, customMissed = null, customScore = null) {
    const history = this.state.quizHistory[topicId];
    const targetTopic = this.findTopicById(topicId);

    const weakTopicName = targetTopic ? targetTopic.name : 'Target Topic';
    const score = customScore !== null ? customScore : (history ? history.score : 45);
    const missed = customMissed || (history ? history.missedConcepts : targetTopic?.key_concepts || ['Core principles']);

    // Find completed days to preserve them (Rule 4: Do not touch completed days)
    const completedDayNumbers = new Set();
    const remainingDays = [];

    this.state.roadmap.daily_plan.forEach(day => {
      const allCompleted = day.topics.length > 0 && day.topics.every(t => this.state.topicProgress[t.topic_id] === 'completed');
      if (allCompleted) {
        completedDayNumbers.add(day.day_number);
      } else {
        remainingDays.push(day);
      }
    });

    if (remainingDays.length === 0) {
      console.warn('All days already completed; cannot recalibrate');
      return;
    }

    const recalibratedResult = recalibrateSchedule({
      weak_topic: weakTopicName,
      quiz_score_percentage: score,
      missed_concepts: missed,
      remaining_schedule: remainingDays,
      max_daily_hours: this.state.hoursPerDay
    });

    // Reconstruct full schedule: completed days + revised schedule
    const completedDays = this.state.roadmap.daily_plan.filter(d => completedDayNumbers.has(d.day_number));
    this.state.roadmap.daily_plan = [...completedDays, ...recalibratedResult.revised_schedule];
    this.state.roadmap.total_days = this.state.roadmap.daily_plan.length;

    // Log recalibration action
    this.state.recalibrationHistory.unshift({
      timestamp: new Date().toISOString(),
      topicId: topicId,
      topicName: weakTopicName,
      score: score,
      reason: recalibratedResult.adjustment_reason,
      recoveryMinutes: recalibratedResult.revised_schedule[0]?.recovery_details?.allotted_minutes || 35
    });

    this.saveState();
    return recalibratedResult;
  }

  findTopicById(topicId) {
    if (!this.state.roadmap || !this.state.roadmap.daily_plan) return null;
    for (const day of this.state.roadmap.daily_plan) {
      for (const topic of day.topics) {
        if (topic.topic_id === topicId) return topic;
      }
    }
    return null;
  }

  // Pomodoro Controls
  startPomodoro(topicId = null) {
    if (topicId) {
      this.state.pomodoro.activeTopicId = topicId;
      this.state.topicProgress[topicId] = 'in_progress';
    }
    this.state.pomodoro.isRunning = true;
    this.saveState();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.pomodoro.timeLeft > 0) {
        this.state.pomodoro.timeLeft--;
        if (this.state.pomodoro.mode === 'work') {
          this.state.pomodoro.totalFocusMinutes = (this.state.pomodoro.totalFocusMinutes || 0) + (1 / 60);
        }
        this.notify();
      } else {
        // Switch mode
        if (this.state.pomodoro.mode === 'work') {
          this.state.pomodoro.mode = 'break';
          this.state.pomodoro.timeLeft = 5 * 60; // 5 min break
        } else {
          this.state.pomodoro.mode = 'work';
          this.state.pomodoro.timeLeft = 25 * 60;
        }
        this.notify();
      }
    }, 1000);
  }

  pausePomodoro() {
    this.state.pomodoro.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.saveState();
  }

  resetPomodoro() {
    this.pausePomodoro();
    this.state.pomodoro.mode = 'work';
    this.state.pomodoro.timeLeft = 25 * 60;
    this.saveState();
  }

  // Chat Bot Management
  addChatMessage(msg) {
    if (!this.state.chatMessages) {
      this.state.chatMessages = [];
    }
    const message = {
      id: msg.id || 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      sender: msg.sender || 'bot', // 'user' | 'bot'
      text: msg.text || '',
      type: msg.type || 'text', // 'text' | 'quiz' | 'plan' | 'progress' | 'welcome'
      data: msg.data || null,
      timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.state.chatMessages.push(message);
    this.saveState();
    return message;
  }

  updateChatMessage(id, updates) {
    if (!this.state.chatMessages) return;
    const msg = this.state.chatMessages.find(m => m.id === id);
    if (msg) {
      Object.assign(msg, updates);
      this.saveState();
    }
  }

  clearChat() {
    this.state.chatMessages = [
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: "👋 Chat reset! I'm here to help you conquer your exam. What would you like to review?",
        type: 'welcome',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    this.saveState();
  }

  toggleTopicCompletion(topicId) {
    const current = this.state.topicProgress[topicId];
    const newStatus = current === 'completed' ? 'todo' : 'completed';
    this.state.topicProgress[topicId] = newStatus;

    // If marked completed and was in weakTopics, remove it
    if (newStatus === 'completed') {
      this.state.weakTopics = this.state.weakTopics.filter(id => id !== topicId);
    }
    this.saveState();
    return newStatus;
  }

  addCustomTopic(topicName, dayNumber = 1) {
    if (!topicName || !topicName.trim()) return null;
    if (!this.state.roadmap || !this.state.roadmap.daily_plan) return null;

    const trimmed = topicName.trim();
    const cleanId = 'topic-custom-' + Date.now();
    const newTopic = {
      topic_id: cleanId,
      name: trimmed,
      estimated_hours: 1.5,
      difficulty_level: 'medium',
      key_concepts: [trimmed, 'Key Definitions', 'Applications']
    };

    // Find target day or first day
    let targetDay = this.state.roadmap.daily_plan.find(d => d.day_number === dayNumber);
    if (!targetDay && this.state.roadmap.daily_plan.length > 0) {
      targetDay = this.state.roadmap.daily_plan[0];
    }

    if (targetDay) {
      targetDay.topics.push(newTopic);
      targetDay.total_study_hours = (targetDay.total_study_hours || 0) + 1.5;
    }

    this.state.topicProgress[cleanId] = 'todo';
    this.saveState();
    return newTopic;
  }

  updateDaysRemaining(days) {
    const d = parseInt(days, 10);
    if (!isNaN(d) && d > 0) {
      this.state.daysRemaining = d;
      this.saveState();
    }
  }

  setExamDetails(title, days, hours = 3.5) {
    this.state.syllabusTitle = title || this.state.syllabusTitle;
    this.state.daysRemaining = parseInt(days, 10) || this.state.daysRemaining;
    this.state.hoursPerDay = parseFloat(hours) || this.state.hoursPerDay;
    this.saveState();
  }

  updateReferenceContext(text) {
    this.state.referenceContext = text;
    this.saveState();
  }
}

export const trackerStore = new TrackerStore();
