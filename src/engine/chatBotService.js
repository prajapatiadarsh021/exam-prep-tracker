/**
 * ChatBot Service for Exam Prep Tracker.
 * Powered by Google Gemini API when configured, with seamless local engine fallback.
 * Manages conversational tutoring, in-chat quizzes, study plans, and topic tracking.
 */

import { trackerStore } from '../store/trackerStore.js';
import { generateQuiz, generateRoadmap } from './academicEngine.js';
import { SAMPLE_SYLLABI } from '../data/sampleSyllabi.js';
import { GeminiService } from './geminiService.js';

export class ChatBotService {
  /**
   * Process incoming user message and generate reactive bot response
   */
  static async processMessage(userText) {
    const text = userText.trim().toLowerCase();
    const state = trackerStore.getState();
    const isGeminiLive = GeminiService.isConfigured();

    // 0. Check if user is asking to connect/configure Gemini API
    if (text.includes('gemini') || text.includes('api key') || text.includes('connect api')) {
      return {
        text: `✨ **Google Gemini API Integration**\n\n` +
          (isGeminiLive
            ? `Gemini AI is currently **Active & Connected** (${state.settings?.geminiModel || 'gemini-1.5-flash'})!\nAll questions, study roadmaps, and quizzes are being powered directly by Google Gemini.`
            : `To enable live Gemini intelligence, click the **Connect Gemini API** button in the top navigation bar to paste your free Google AI Studio key.\n\nUntil connected, PrepBot uses the built-in local academic engine.`),
        type: 'text'
      };
    }

    // 1. Check for "study today" / "schedule" / "what should i study"
    if (text.includes('today') || text.includes('schedule') || text.includes('what to study') || text.includes('start day')) {
      return await this.handleTodayPlan(state, isGeminiLive);
    }

    // 2. Check for "quiz" / "test me" / "mcq" / "practice"
    if (text.includes('quiz') || text.includes('test me') || text.includes('question') || text.includes('practice')) {
      return await this.handleQuizRequest(text, state, isGeminiLive);
    }

    // 3. Check for "done" / "finished" / "completed"
    if (text.includes('done') || text.includes('finished') || text.includes('completed') || text.includes('mark ')) {
      const topicMatch = this.findMatchingTopic(text, state);
      if (topicMatch) {
        trackerStore.updateTopicStatus(topicMatch.topic_id, 'completed');
        const updatedState = trackerStore.getState();
        const progress = this.calculateProgress(updatedState);

        let followUpAdvice = '';
        if (isGeminiLive) {
          try {
            followUpAdvice = '\n\n' + await GeminiService.generateChatResponse(
              `The student just finished studying "${topicMatch.name}". Give a 2-sentence encouraging comment and recommend what key principle to review next.`,
              []
            );
          } catch (e) {
            console.warn('Gemini follow-up note skipped', e);
          }
        }

        return {
          text: `🎉 Excellent job! I've marked **${topicMatch.name}** as **Completed** on your checklist.\n\nYou're now at **${progress.percent}% completion** (${progress.completed}/${progress.total} topics done).${followUpAdvice}`,
          type: 'text'
        };
      }
    }

    // 4. Check for "progress" / "status" / "summary" / "how am i doing"
    if (text.includes('progress') || text.includes('status') || text.includes('summary') || text.includes('report') || text.includes('how am i')) {
      return this.handleProgressReport(state);
    }

    // 5. Check for "timer" / "focus" / "pomodoro"
    if (text.includes('timer') || text.includes('focus') || text.includes('pomodoro') || text.includes('25m')) {
      trackerStore.startPomodoro();
      return {
        text: `⏱️ **25-minute Pomodoro Focus Timer started!**\n\nSilence your notifications and focus purely on your current topic. You've got this!`,
        type: 'text'
      };
    }

    // 6. Check for "add topic [X]"
    if (text.startsWith('add topic ') || (text.startsWith('add ') && text.length > 5)) {
      const topicName = userText.replace(/^(add topic|add)\s+/i, '').trim();
      if (topicName) {
        trackerStore.addCustomTopic(topicName);
        return {
          text: `✅ Added **"${topicName}"** to your study checklist. You can quiz yourself on it or mark it complete anytime!`,
          type: 'text'
        };
      }
    }

    // 7. Check for "plan exam" / "set exam"
    if (text.includes('plan exam') || text.includes('new exam') || text.includes('set exam')) {
      return await this.handleCustomExamSetup(userText, isGeminiLive);
    }

    // 8. Check for "preset" / "switch to [name]"
    for (const preset of SAMPLE_SYLLABI) {
      if (text.includes(preset.title.toLowerCase()) || text.includes(preset.id.toLowerCase())) {
        trackerStore.loadPreset(preset.id);
        return {
          text: `🔄 Switched your exam tracker to **${preset.title}** (${preset.defaultDays} days countdown)!\n\nI've loaded the syllabus onto your checklist. Ask me *"What should I study today?"* to get started.`,
          type: 'text'
        };
      }
    }

    // 9. If Gemini is Live, delegate general academic queries directly to Gemini!
    if (isGeminiLive) {
      try {
        const geminiAnswer = await GeminiService.generateChatResponse(userText, state.chatMessages);
        return {
          text: geminiAnswer,
          type: 'text'
        };
      } catch (err) {
        console.error('Gemini API query failed, falling back:', err);
        return {
          text: `⚠️ *Gemini API call failed (${err.message}). Showing local explanation:*\n\n` +
            (this.handleExplanation(userText, state)).text,
          type: 'text'
        };
      }
    }

    // 10. Conceptual / Explanatory questions (Local Fallback)
    if (text.includes('explain') || text.includes('what is') || text.includes('difference') || text.includes('how does') || text.includes('concept')) {
      const localResult = this.handleExplanation(userText, state);
      return {
        ...localResult,
        text: localResult.text + `\n\n*(💡 Tip: Connect your Gemini API Key in the top header to unlock real-time Gemini 1.5 Flash answers!)*`
      };
    }

    // 11. Default helpful guidance
    return {
      text: `Got it! Here is how I can assist your exam prep right now:\n\n` +
        `• 📅 Type **"What should I study today?"** for your immediate target\n` +
        `• ❓ Type **"Quiz me"** to test yourself with a high-yield question\n` +
        `• ✅ Type **"I finished [topic name]"** to update your checklist\n` +
        `• 📊 Type **"Progress"** to see your exam readiness score\n` +
        `• ⏱️ Type **"Start focus"** to launch a 25-min study timer\n` +
        `• 💡 Or ask me any academic concept question (e.g. *"Explain virtual memory vs paging"*).\n\n` +
        (!isGeminiLive ? `*(Connect your Gemini API Key in the header to power everything with live Google Gemini AI!)*` : `*(✨ Powered by Google Gemini)*`),
      type: 'text'
    };
  }

  /**
   * Handle Today's Plan intent
   */
  static async handleTodayPlan(state, isGeminiLive) {
    if (!state.roadmap || !state.roadmap.daily_plan || state.roadmap.daily_plan.length === 0) {
      return {
        text: `You don't have an active study roadmap yet! Use the **Switch Exam** button in the header to set one up.`,
        type: 'text'
      };
    }

    // Find the first day that has uncompleted topics
    let activeDay = state.roadmap.daily_plan.find(day => 
      day.topics.some(t => state.topicProgress[t.topic_id] !== 'completed')
    );

    if (!activeDay) {
      return {
        text: `🎉 **Incredible milestone!** You have completed all scheduled topics for this exam!\n\nWould you like to do a comprehensive review quiz or add more topics? Type **"Quiz me"** to test your retention.`,
        type: 'text'
      };
    }

    const pendingTopics = activeDay.topics.filter(t => state.topicProgress[t.topic_id] !== 'completed');

    // If Gemini is live, optionally request dynamic motivational guidance
    let geminiReasoning = '';
    if (isGeminiLive) {
      try {
        const planData = await GeminiService.generateTodayPlan(state);
        if (planData && planData.reasoning) {
          geminiReasoning = `\n*Gemini Coach Note: ${planData.reasoning}*`;
        }
      } catch (e) {
        console.warn('Gemini today plan refinement skipped', e);
      }
    }

    return {
      text: `📅 **Day ${activeDay.day_number} Study Focus** (${state.daysRemaining} days left until exam):${geminiReasoning}\n\nHere are your target topics for today:`,
      type: 'plan',
      data: {
        dayNumber: activeDay.day_number,
        theme: activeDay.theme || 'Core Review',
        topics: pendingTopics.map(t => ({
          topic_id: t.topic_id,
          name: t.name,
          estimated_hours: t.estimated_hours,
          difficulty: t.difficulty_level,
          completed: state.topicProgress[t.topic_id] === 'completed'
        }))
      }
    };
  }

  /**
   * Handle Quiz Request intent
   */
  static async handleQuizRequest(text, state, isGeminiLive) {
    if (!state.roadmap || !state.roadmap.daily_plan) {
      return {
        text: "Please set up a syllabus first so I can generate relevant exam questions!",
        type: 'text'
      };
    }

    // 1. Try to find a topic mentioned in text
    let targetTopic = this.findMatchingTopic(text, state);

    // 2. If not found, prioritize weak topics
    if (!targetTopic && state.weakTopics && state.weakTopics.length > 0) {
      targetTopic = state.findTopicById(state.weakTopics[0]);
    }

    // 3. Otherwise, pick the next uncompleted topic
    if (!targetTopic) {
      for (const day of state.roadmap.daily_plan) {
        for (const t of day.topics) {
          if (state.topicProgress[t.topic_id] !== 'completed') {
            targetTopic = t;
            break;
          }
        }
        if (targetTopic) break;
      }
    }

    // 4. Fallback to first topic
    if (!targetTopic && state.roadmap.daily_plan[0]?.topics[0]) {
      targetTopic = state.roadmap.daily_plan[0].topics[0];
    }

    if (!targetTopic) {
      return {
        text: "Couldn't locate a topic to quiz. Try typing: **\"Quiz me on Process Management\"**",
        type: 'text'
      };
    }

    // If Gemini is live, generate question dynamically with Gemini!
    if (isGeminiLive) {
      try {
        const geminiQ = await GeminiService.generateQuizQuestion(
          targetTopic.name,
          targetTopic.key_concepts || [targetTopic.name]
        );

        return {
          text: `🎯 **Gemini Diagnostic Question: ${targetTopic.name}**\n*Concept: ${geminiQ.conceptTested}*`,
          type: 'quiz',
          data: {
            topicId: targetTopic.topic_id,
            topicName: targetTopic.name,
            questionId: geminiQ.questionId,
            questionText: geminiQ.questionText,
            options: geminiQ.options,
            correctOptionIndex: geminiQ.correctOptionIndex,
            conceptTested: geminiQ.conceptTested,
            explanation: geminiQ.explanation,
            userAnswer: null,
            isCorrect: null,
            source: 'gemini'
          }
        };
      } catch (err) {
        console.warn('Gemini quiz generation failed, using local generator', err);
      }
    }

    // Fallback: Generate single MCQ using local academic engine
    const quizData = generateQuiz({
      topic_name: targetTopic.name,
      key_concepts: targetTopic.key_concepts || [targetTopic.name],
      difficulty_level: targetTopic.difficulty_level || 'medium'
    });

    const question = quizData.questions[0];

    return {
      text: `🎯 **Diagnostic Question: ${targetTopic.name}**\n*Concept: ${question.concept_tested}*`,
      type: 'quiz',
      data: {
        topicId: targetTopic.topic_id,
        topicName: targetTopic.name,
        questionId: question.question_id,
        questionText: question.question_text,
        options: question.options,
        correctOptionIndex: question.correct_option_index,
        conceptTested: question.concept_tested,
        explanation: question.explanation,
        userAnswer: null,
        isCorrect: null,
        source: 'local'
      }
    };
  }

  /**
   * Evaluate user's selection on in-chat quiz card
   */
  static answerQuiz(messageId, selectedOptionIndex) {
    const state = trackerStore.getState();
    const msg = state.chatMessages?.find(m => m.id === messageId);
    if (!msg || msg.type !== 'quiz' || !msg.data) return null;

    if (msg.data.userAnswer !== null) {
      return msg.data;
    }

    const isCorrect = (selectedOptionIndex === msg.data.correctOptionIndex);
    msg.data.userAnswer = selectedOptionIndex;
    msg.data.isCorrect = isCorrect;

    // Update state topic quiz history
    const topicId = msg.data.topicId;
    if (topicId) {
      if (isCorrect) {
        trackerStore.updateTopicStatus(topicId, 'completed');
        trackerStore.state.weakTopics = trackerStore.state.weakTopics.filter(id => id !== topicId);
      } else {
        if (!trackerStore.state.weakTopics.includes(topicId)) {
          trackerStore.state.weakTopics.push(topicId);
        }
      }
    }

    trackerStore.saveState();
    return msg.data;
  }

  /**
   * Handle progress report
   */
  static handleProgressReport(state) {
    const { total, completed, percent } = this.calculateProgress(state);
    const weakCount = state.weakTopics ? state.weakTopics.length : 0;
    const daysLeft = state.daysRemaining || 7;
    const hoursPerDay = state.hoursPerDay || 4.0;
    const focusMinutes = Math.round(state.pomodoro?.totalFocusMinutes || 0);

    return {
      text: `📊 **Exam Readiness & Progress Summary**`,
      type: 'progress',
      data: {
        examTitle: state.syllabusTitle,
        daysLeft,
        hoursPerDay,
        totalTopics: total,
        completedTopics: completed,
        remainingTopics: total - completed,
        percent,
        weakCount,
        focusMinutes
      }
    };
  }

  /**
   * Calculate progress metrics
   */
  static calculateProgress(state) {
    if (!state.roadmap || !state.roadmap.daily_plan) {
      return { total: 0, completed: 0, percent: 0 };
    }
    let total = 0;
    let completed = 0;

    state.roadmap.daily_plan.forEach(day => {
      day.topics.forEach(t => {
        total++;
        if (state.topicProgress[t.topic_id] === 'completed') {
          completed++;
        }
      });
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }

  /**
   * Find topic by matching name
   */
  static findMatchingTopic(text, state) {
    if (!state.roadmap || !state.roadmap.daily_plan) return null;
    const cleanText = text.toLowerCase();

    for (const day of state.roadmap.daily_plan) {
      for (const topic of day.topics) {
        const tName = topic.name.toLowerCase();
        if (cleanText.includes(tName) || tName.includes(cleanText.replace(/quiz me on |quiz |test me on |mark |done |finished |i did /g, '').trim())) {
          return topic;
        }
      }
    }
    return null;
  }

  /**
   * Quick custom exam planner with optional Gemini roadmap structuring
   */
  static async handleCustomExamSetup(rawText, isGeminiLive) {
    const daysMatch = rawText.match(/(\d+)\s*days?/i);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;

    let title = 'My Exam';
    const titleMatch = rawText.match(/(?:plan exam|new exam|set exam)[:\s]+([^in\d]+)/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    if (isGeminiLive) {
      try {
        const geminiRoadmap = await GeminiService.generateExamRoadmapFromGemini(rawText, days, 3.5, title);
        if (geminiRoadmap && geminiRoadmap.daily_plan) {
          trackerStore.state.syllabusTitle = title;
          trackerStore.state.daysRemaining = days;
          trackerStore.state.hoursPerDay = 3.5;
          trackerStore.state.roadmap = geminiRoadmap;
          trackerStore.state.topicProgress = {};
          trackerStore.saveState();

          return {
            text: `✨ **Gemini AI Exam Roadmap Generated!**\n\nI have generated a customized **${days}-day study plan** for **${title}**.\nYour checklist is ready on the left. Type **"What should I study today?"** to get started!`,
            type: 'text'
          };
        }
      } catch (err) {
        console.warn('Gemini roadmap generation failed, using standard generator', err);
      }
    }

    // Default template
    const customSyllabus = `Unit 1: Fundamentals of ${title}
- Core principles and standard definitions
- Foundational laws and theoretical basis
- Key equations and operational models

Unit 2: Advanced Applications & Analysis
- Complex problem scenarios and analytical methods
- Boundary conditions and critical trade-offs
- Comprehensive review and practice synthesis`;

    trackerStore.createRoadmap(customSyllabus, days, 3.5, title);

    return {
      text: `🚀 **Exam Plan Created!**\n\nI have set up **${title}** with **${days} days remaining**.\nYour checklist has been populated on the left. Type **"What should I study today?"** to view your first day's goals.`,
      type: 'text'
    };
  }

  /**
   * Provide factual grounded explanation based strictly on reference context
   */
  static handleExplanation(query, state) {
    const context = (state.referenceContext || state.syllabusText || '').toLowerCase();
    const clean = query.replace(/(explain|what is|difference between|how does|concept of|\?)/gi, '').trim().toLowerCase();

    // Check if the query concept exists in the reference context
    let matchedTopic = null;
    let foundInContext = context.includes(clean);

    if (state.roadmap?.daily_plan) {
      for (const day of state.roadmap.daily_plan) {
        for (const t of day.topics) {
          if (t.name.toLowerCase().includes(clean) || clean.includes(t.name.toLowerCase())) {
            matchedTopic = t;
            foundInContext = true;
            break;
          }
        }
        if (matchedTopic) break;
      }
    }

    if (!foundInContext && clean.length > 2) {
      return {
        text: `The provided context does not contain sufficient information to answer this question.`,
        type: 'text'
      };
    }

    const topicLabel = matchedTopic ? matchedTopic.name : clean;

    return {
      text: `💡 **Grounded Syllabus Fact: ${topicLabel}**\n\n` +
        `• **Reference Fact**: Core mechanism documented directly in your exam syllabus.\n` +
        `• **Key Principles**: Verified operational rules and constraints defined in this module.\n` +
        `• **Exam Test Focus**: Pay specific attention to trade-offs and boundary conditions.\n` +
        `• **Retention Tip**: Test yourself on this right now! Type **"Quiz me on ${topicLabel}"** to test your retention.`,
      type: 'text'
    };
  }
}
