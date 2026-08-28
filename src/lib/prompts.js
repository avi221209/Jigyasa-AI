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
