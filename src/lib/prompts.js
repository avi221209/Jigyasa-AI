/**
 * Prompt Utilities — Subject-Agnostic
 * ====================================
 * This file contains ONLY parsing and fallback-routing utilities.
 * All subject-specific content (problems, categories, prompts, heuristics)
 * lives in /src/data/subjects/<subject>.js.
 *
 * To add a new DSA topic, create a new subject module — this file stays
 * untouched.
 */

import { heuristicClassify } from '../data/subjects/recursion';

/**
 * Heuristic fallback entry point — called by llm.js when API keys are
 * absent or a network call fails. Extracts the student answer from the
 * prompt text and delegates to the subject-specific heuristic.
 */
export function runHeuristicFallback(prompt, reason = 'Fallback Mode Active') {
  console.log(`[HeuristicFallback] reason: ${reason}`);

  const match = prompt.match(/STUDENT'S ANSWER:\s*"([^"]+)"/s);
  const text = match ? match[1] : prompt;

  const result = heuristicClassify(text);

  return {
    text: JSON.stringify({
      ...result,
      explanation: result.explanation
    }),
    isFallback: true,
    provider: 'heuristic-fallback'
  };
}

/**
 * Prompt builder for Follow-Up challenge evaluation
 */
export function buildFollowUpPrompt(userQuestion, userReasoning, exactGap, followUpQuestion, followUpAnswer) {
  return `ORIGINAL QUESTION: "${userQuestion}"
STUDENT'S INITIAL REASONING: "${userReasoning}"
IDENTIFIED GAP: "${exactGap}"
FOLLOW-UP CHALLENGE ASKED: "${followUpQuestion}"
STUDENT'S FOLLOW-UP ANSWER: "${followUpAnswer}"

Evaluate if the student's new response corrects the previously identified gap. Be brief — 3 sentences max. Return JSON only:
{
  "corrected": true or false,
  "verdict": "2-3 sentences explaining if they demonstrated understanding and corrected the gap."
}`;
}

/**
 * Prompt builder for Explain It Back challenge evaluation
 */
export function buildExplainBackPrompt(conceptLabel, targetedRemediation, studentExplanation) {
  return `CONCEPT: "${conceptLabel}"
TARGETED REMEDIATION: "${targetedRemediation}"
STUDENT'S EXPLANATION TO A JUNIOR: "${studentExplanation}"

Evaluate if the student's explanation is clear, accurate, and easy for a beginner to understand. Return JSON only:
{
  "clarity": "Clear" | "Partially Clear" | "Unclear",
  "feedback": "One sentence explaining what was great or what key concept was missing."
}`;
}

/**
 * Heuristic fallback evaluator for Explain It Back challenge
 */
export function runExplainBackFallback(studentExplanation) {
  const text = (studentExplanation || '').toLowerCase();
  const isLongEnough = text.trim().length >= 35;
  const hasBase = /\b(base|if|stop|exit|terminat\w*)\b/i.test(text);
  const hasStack = /\b(stack|frame|memory|unwind|call|lifo|pause)\b/i.test(text);
  const hasReturn = /\b(return|value|result|pass)\b/i.test(text);

  const termCount = (hasBase ? 1 : 0) + (hasStack ? 1 : 0) + (hasReturn ? 1 : 0);

  if (isLongEnough && termCount >= 2) {
    return {
      clarity: 'Clear',
      feedback: 'Great explanation! You clearly articulated the core stack and termination mechanics for a beginner.'
    };
  } else if (isLongEnough || termCount >= 1) {
    return {
      clarity: 'Partially Clear',
      feedback: 'Good start! Try explicitly mentioning both the base case stopping condition and how return values flow back up the call stack.'
    };
  } else {
    return {
      clarity: 'Unclear',
      feedback: 'Your explanation is too brief. Try describing step-by-step how recursive calls stack up and how the base case stops them.'
    };
  }
}

/**
 * Parse JSON from LLM text output, handling Reasoning models (DeepSeek-R1 <think> tags),
 * markdown code fences, and embedded JSON objects.
 */
export function parseLLMJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from LLM');
  }

  try {
    let clean = rawText.trim();

    // 1. Strip reasoning thoughts if present (e.g. DeepSeek-R1 <think>...</think>)
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Strip markdown code blocks (```json ... ``` or ``` ... ```)
    if (clean.includes('```')) {
      clean = clean.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/gi, '$1').trim();
    }

    // 3. Attempt direct parse
    try {
      return JSON.parse(clean);
    } catch {
      // 4. Regex extraction for any JSON object structure { ... }
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON object pattern found in text');
    }
  } catch (err) {
    console.error('Failed to parse LLM JSON:', rawText, err);
    return {
      category: 'stack-blindness',
      confidence: 0.5,
      explanation: 'Classification completed with response format parsing fallback.',
      targetedRemediation: 'Focus on tracing each stack frame: what value enters, what expression the frame is blocked on, and in what order return values flow back.',
      nextFocusArea: 'Stack frame trace.'
    };
  }
}
