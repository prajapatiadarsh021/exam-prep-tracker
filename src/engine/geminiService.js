/**
 * Google Gemini API Service for PrepPulse.
 * Handles direct integration with Gemini 1.5 Flash / Pro models for:
 * 1. Conversational AI Study Coach & Question Answering
 * 2. High-Yield Conceptual Quiz Generation
 * 3. Adaptive Today's Study Planning
 * 4. Syllabus-to-Exam Roadmap Breakdown
 */

import { trackerStore } from '../store/trackerStore.js';

export class GeminiService {
  /**
   * Retrieve active Gemini API Key from store or environment
   */
  static getApiKey() {
    const state = trackerStore.getState();
    const storedKey = state.settings?.geminiApiKey?.trim();
    if (storedKey) return storedKey;

    // Check Vite environment variable if present
    const envKey = import.meta.env?.VITE_GEMINI_API_KEY?.trim();
    if (envKey) return envKey;

    return '';
  }

  /**
   * Check if Gemini API is configured
   */
  static isConfigured() {
    const key = this.getApiKey();
    return Boolean(key && key.length > 10);
  }

  /**
   * Retrieve selected model
   */
  static getModel() {
    const state = trackerStore.getState();
    return state.settings?.geminiModel || 'gemini-1.5-flash';
  }

  /**
   * Test API key connectivity
   */
  static async testConnection(apiKey, model = 'gemini-1.5-flash') {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with the word "CONNECTED" only.' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: Authentication failed`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, message: text.trim() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate conversational response from Gemini with full exam context
   */
  static async generateChatResponse(userMessage, chatHistory = []) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const state = trackerStore.getState();
    const model = this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Determine Reference Context and User Question
    let referenceText = state.referenceContext || state.syllabusText || '';
    let questionText = userMessage;

    // Check if the user pasted explicit Reference Context / Context block in their prompt
    const refMatch = userMessage.match(/(?:Reference Context|Context):\s*["']?([\s\S]*?)["']?\s*(?:User Question|Question):\s*([\s\S]+)/i);
    if (refMatch) {
      referenceText = refMatch[1].trim();
      questionText = refMatch[2].trim();
    }

    const systemInstruction = `You are a precise question-answering assistant. Answer the user's question using ONLY the provided reference context below.

### Rules:
- Base your answer strictly on the facts present in the reference text.
- Do not introduce outside knowledge, assumptions, or extrapolations.
- If the reference text does not contain enough information to answer the question, respond with: "The provided context does not contain sufficient information to answer this question."
- Keep the response clear, structured, and factual.

---
**Reference Context:**
"""
${referenceText}
"""`;

    // Map recent history (last 6 turns)
    const recentMessages = (chatHistory || []).slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Add current user prompt
    const contents = [
      ...recentMessages,
      {
        role: 'user',
        parts: [{ text: `**User Question:**\n${questionText}` }]
      }
    ];

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1000
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini API returned error ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('Gemini did not return a response text.');
    }

    return candidate.content.parts[0].text;
  }

  /**
   * Generate a rigorous conceptual MCQ quiz question for a topic using Gemini
   */
  static async generateQuizQuestion(topicName, keyConcepts = []) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const model = this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `Generate a single high-yield conceptual multiple-choice question for an exam on the topic "${topicName}".
Key concepts to test: ${keyConcepts.join(', ') || topicName}.
Requirements:
1. Question must test deep architectural, behavioral, or analytical principles (NOT simple rote definitions).
2. Exactly 4 plausible options (A, B, C, D).
3. Exactly one correct option.
4. Thorough explanation explaining why the correct choice is right and why distractors fail.
5. Return JSON ONLY matching this exact schema:
{
  "questionText": "...",
  "options": ["Option A string", "Option B string", "Option C string", "Option D string"],
  "correctOptionIndex": 0,
  "conceptTested": "...",
  "explanation": "..."
}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        maxOutputTokens: 1024
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini API error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No quiz output from Gemini');

    try {
      const parsed = JSON.parse(rawText);
      return {
        questionId: 'gemini-q-' + Date.now(),
        questionText: parsed.questionText,
        options: parsed.options,
        correctOptionIndex: parsed.correctOptionIndex,
        conceptTested: parsed.conceptTested || topicName,
        explanation: parsed.explanation
      };
    } catch (e) {
      // Regex extraction fallback
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questionId: 'gemini-q-' + Date.now(),
          questionText: parsed.questionText,
          options: parsed.options,
          correctOptionIndex: parsed.correctOptionIndex,
          conceptTested: parsed.conceptTested || topicName,
          explanation: parsed.explanation
        };
      }
      throw new Error('Failed to parse Gemini quiz JSON response');
    }
  }

  /**
   * Generate an optimized study plan for today using Gemini
   */
  static async generateTodayPlan(state) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const model = this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const pendingTopics = [];
    if (state.roadmap?.daily_plan) {
      state.roadmap.daily_plan.forEach(day => {
        day.topics.forEach(t => {
          if (state.topicProgress[t.topic_id] !== 'completed') {
            pendingTopics.push({ id: t.topic_id, name: t.name, day: day.day_number, est: t.estimated_hours });
          }
        });
      });
    }

    const prompt = `The student is preparing for "${state.syllabusTitle}" with ${state.daysRemaining} days left.
Pending topics available:
${JSON.stringify(pendingTopics.slice(0, 10))}

Pick the top 2 to 3 most important topics for TODAY's revision session.
Return JSON ONLY matching this schema:
{
  "dayNumber": 1,
  "theme": "A catchy 2-4 word theme for today",
  "reasoning": "A 1-sentence motivation explaining why these topics are prioritized today",
  "selectedTopicIds": ["id1", "id2"]
}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        maxOutputTokens: 600
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini API error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);
    return parsed;
  }

  /**
   * Structure and generate an entire exam roadmap from text using Gemini
   */
  static async generateExamRoadmapFromGemini(syllabusText, days, hours, examTitle) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const model = this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `You are an expert curriculum planner.
Create a structured day-by-day exam prep roadmap for:
- Subject: "${examTitle}"
- Total Days Remaining: ${days}
- Daily Study Hours: ${hours}
- Raw Syllabus Content:
${syllabusText}

Divide the topics evenly across ${days} days.
Return JSON ONLY matching this schema:
{
  "exam_title": "${examTitle}",
  "total_days": ${days},
  "daily_plan": [
    {
      "day_number": 1,
      "theme": "Theme title",
      "topics": [
        {
          "topic_id": "topic-1",
          "name": "Topic Name",
          "estimated_hours": 1.5,
          "difficulty_level": "medium",
          "key_concepts": ["Concept 1", "Concept 2"]
        }
      ]
    }
  ]
}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        maxOutputTokens: 2048
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini API error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(rawText);
  }
}
