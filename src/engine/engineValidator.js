/**
 * Engine Schema and Operational Rules Validator.
 * Verifies strict compliance with the Academic Engine requirements.
 */

export function validateEngineOutput(output, actionType, inputContext = {}) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    details: {}
  };

  if (!output || typeof output !== 'object') {
    result.isValid = false;
    result.errors.push('Output must be a valid JSON object.');
    return result;
  }

  if (output.action !== actionType) {
    result.isValid = false;
    result.errors.push(`Action field mismatch: Expected "${actionType}", got "${output.action}".`);
  }

  if (actionType === 'GENERATE_ROADMAP') {
    if (typeof output.total_days !== 'number' || output.total_days <= 0) {
      result.errors.push('Field "total_days" must be a positive integer.');
    }
    if (!Array.isArray(output.daily_plan) || output.daily_plan.length === 0) {
      result.errors.push('Field "daily_plan" must be a non-empty array.');
    } else {
      const maxDailyHours = inputContext.hours_per_day || 12;
      const revisionDaysCount = output.total_days >= 4 ? 2 : 1;

      output.daily_plan.forEach((day, index) => {
        if (typeof day.day_number !== 'number') {
          result.errors.push(`Day at index ${index} missing numeric "day_number".`);
        }
        if (typeof day.allocated_hours !== 'number') {
          result.errors.push(`Day ${day.day_number || index + 1} missing numeric "allocated_hours".`);
        } else if (day.allocated_hours > maxDailyHours + 0.1) {
          result.errors.push(`Day ${day.day_number} allocated hours (${day.allocated_hours}) exceeds daily cap (${maxDailyHours}).`);
        }
        if (!Array.isArray(day.topics)) {
          result.errors.push(`Day ${day.day_number} missing "topics" array.`);
        } else {
          day.topics.forEach((t, tIdx) => {
            if (!t.topic_id || !t.name || !Array.isArray(t.key_concepts)) {
              result.errors.push(`Topic at Day ${day.day_number}, item ${tIdx} missing topic_id, name, or key_concepts.`);
            }
          });
        }
        if (typeof day.revision_focus !== 'string') {
          result.warnings.push(`Day ${day.day_number} missing or empty "revision_focus" string.`);
        }
      });

      // Operational Rule 2: Cognitive Load Management - keep final 1-2 days strictly for revision
      const lastDays = output.daily_plan.slice(-revisionDaysCount);
      const allFinalAreRevision = lastDays.every(d => 
        d.topics.length === 0 || 
        d.topics.every(t => t.name.toLowerCase().includes('revision') || t.name.toLowerCase().includes('practice') || t.name.toLowerCase().includes('mock'))
      );
      if (!allFinalAreRevision) {
        result.warnings.push(`Cognitive load rule recommendation: Final ${revisionDaysCount} day(s) should be reserved strictly for revision/practice.`);
      }
    }
  }

  if (actionType === 'GENERATE_QUIZ') {
    if (!output.topic_name || typeof output.topic_name !== 'string') {
      result.errors.push('Field "topic_name" is required and must be a string.');
    }
    if (!Array.isArray(output.questions)) {
      result.errors.push('Field "questions" must be an array.');
    } else {
      // Operational Rule 3: 3 to 5 conceptual MCQs
      if (output.questions.length < 3 || output.questions.length > 5) {
        result.warnings.push(`Expected 3 to 5 questions, received ${output.questions.length}.`);
      }
      output.questions.forEach((q, i) => {
        if (!q.question_text || typeof q.question_text !== 'string') {
          result.errors.push(`Question #${i + 1} missing "question_text".`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          result.errors.push(`Question #${i + 1} must have exactly 4 distinct options.`);
        }
        if (typeof q.correct_option_index !== 'number' || q.correct_option_index < 0 || q.correct_option_index > 3) {
          result.errors.push(`Question #${i + 1} has invalid "correct_option_index" (must be 0, 1, 2, or 3).`);
        }
        if (!q.concept_tested) {
          result.errors.push(`Question #${i + 1} missing "concept_tested" field.`);
        }
        if (!q.explanation) {
          result.errors.push(`Question #${i + 1} missing "explanation" field.`);
        }
      });
    }
  }

  if (actionType === 'RECALIBRATE_SCHEDULE') {
    if (!output.adjustment_reason || typeof output.adjustment_reason !== 'string') {
      result.errors.push('Field "adjustment_reason" is required.');
    }
    if (!Array.isArray(output.revised_schedule) || output.revised_schedule.length === 0) {
      result.errors.push('Field "revised_schedule" must be a non-empty array of days.');
    } else {
      // Operational Rule 4: Inject a 30-45 minute review slot into Day N+1
      const firstRevisedDay = output.revised_schedule[0];
      if (!firstRevisedDay || !firstRevisedDay.includes_recovery_slot) {
        result.warnings.push('Day N+1 should include a recovery slot ("includes_recovery_slot": true).');
      }
      if (firstRevisedDay && firstRevisedDay.recovery_details) {
        const mins = firstRevisedDay.recovery_details.allotted_minutes;
        if (typeof mins !== 'number' || mins < 30 || mins > 45) {
          result.warnings.push(`Recovery slot should be 30-45 minutes. Received: ${mins} minutes.`);
        }
      }
      const maxDailyHours = inputContext.max_daily_hours || 12;
      output.revised_schedule.forEach(day => {
        if (day.allocated_hours > maxDailyHours + 0.1) {
          result.errors.push(`Day ${day.day_number} allocated hours (${day.allocated_hours}) exceeds max daily cap (${maxDailyHours}).`);
        }
      });
    }
  }

  result.isValid = result.errors.length === 0;
  return result;
}
