/**
 * Ask Mode Prompt Builders & Heuristic Fallback
 * ============================================
 * Provides structured JSON prompt templates and local heuristic fallbacks
 * for user-submitted questions and reasoning analysis in Ask Mode.
 */

export const ASK_MODE_CATEGORIES = {
  'no-base-case': { label: 'Missing Base Case', color: '#dc4a5e' },
  'iteration-confusion': { label: 'Loop Mental Model', color: '#d97b1e' },
  'stack-blindness': { label: 'Stack Frame Blindness', color: '#8b5cf6' },
  'correct-reasoning': { label: 'Correct Mental Model', color: '#16a34a' },
  'guessing': { label: 'Surface-Level / Guessing', color: '#ca8a04' },
  'scope-confusion': { label: 'Scope & Frame Isolation Error', color: '#06b6d4' },
  'return-value-confusion': { label: 'Return Value Propagation Gap', color: '#3b82f6' },
  'off-by-one': { label: 'Boundary / Off-by-One Error', color: '#f59e0b' },
  'other': { label: 'Conceptual Misconception', color: '#64748b' }
};

/**
 * System instruction for main Ask Mode LLM call
 */
export const ASK_MODE_SYSTEM_INSTRUCTION = `You are Jigyasa AI, a CS pedagogy diagnostic engine. Your job is to analyze a student's stated reasoning about a CS/DSA concept or code snippet and classify their mental model. Always respond in valid JSON only, no markdown codeblocks, no preamble.`;

/**
 * Prompt builder for main Ask Mode evaluation
 */
export function buildAskModePrompt(userQuestion, userReasoning, confidenceLevel) {
  return `Student's question or code: "${userQuestion}"
Student's stated reasoning: "${userReasoning}"
Student's self-confidence: "${confidenceLevel}"

Analyze the student's reasoning and respond with this exact JSON structure:
{
  "misconceptionCategory": "no-base-case" | "iteration-confusion" | "stack-blindness" | "correct-reasoning" | "guessing" | "scope-confusion" | "return-value-confusion" | "off-by-one" | "other",
  "categoryLabel": "human-readable label for the category",
  "whatStudentGotRight": "string — specific things in their reasoning that are correct (be precise, quote their words if relevant)",
  "exactGap": "string — the precise conceptual error or missing link in their reasoning, explained in CS terminology",
  "targetedRemediation": "string — a focused 3-5 sentence explanation that directly addresses the exact gap, using correct CS terminology (LIFO, stack frame, call graph, space complexity etc as relevant)",
  "followUpQuestion": "string — one targeted follow-up question designed to probe whether the student truly fixed the identified gap",
  "confidenceAssessment": "overconfident" | "calibrated" | "underconfident",
  "confidenceNote": "string — one sentence explaining why their confidence matched or mismatched their actual reasoning quality",
  "conceptTags": ["recursion", "call stack", "base case", "LIFO"]
}`;
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
 * Heuristic fallback classifier for Ask Mode when LLM calls fail or return invalid JSON
 */
export function runAskModeFallback(userQuestion, userReasoning, confidenceLevel = 'medium') {
  const q = (userQuestion || '').toLowerCase();
  const r = (userReasoning || '').toLowerCase();
  const combined = `${q} ${r}`;

  let category = 'other';
  let categoryLabel = 'Conceptual Misconception';
  let whatStudentGotRight = 'You attempted to trace the problem systematically step by step.';
  let exactGap = 'The trace does not fully account for how memory call frames pause and return values propagate in LIFO order.';
  let targetedRemediation = 'When functions call themselves recursively, parent frames freeze on the call stack until child calls complete. Each call frame maintains its own isolated variables. Return values flow back up the stack in Last-In-First-Out (LIFO) order.';
  let followUpQuestion = 'If you call a recursive function with depth N, how many frames sit on the stack when the base case is reached?';
  let conceptTags = ['recursion', 'call stack', 'memory frames'];

  if (combined.includes('loop') || combined.includes('for') || combined.includes('while') || combined.includes('counter')) {
    category = 'iteration-confusion';
    categoryLabel = 'Loop Mental Model';
    whatStudentGotRight = 'You correctly identified the sequential progression of steps.';
    exactGap = 'Confusing recursive call frames with sequential loop iteration variables.';
    targetedRemediation = 'Unlike a for-loop that reuses a single mutable counter, each recursive call allocates an entirely separate stack frame in memory. Parameters are isolated per frame rather than updated in place.';
    followUpQuestion = 'Why does each recursive call create a new set of local variables instead of overwriting existing ones?';
    conceptTags = ['recursion', 'call stack', 'stack frames', 'variables'];
  } else if (combined.includes('undefined') || combined.includes('return') || combined.includes('null')) {
    category = 'return-value-confusion';
    categoryLabel = 'Return Value Propagation Gap';
    whatStudentGotRight = 'You noticed that the function returns an unexpected result at runtime.';
    exactGap = 'Missing a return statement in the recursive branch, causing values to drop.';
    targetedRemediation = 'When a recursive call finishes, its return value must be explicitly passed back to the parent frame via `return func(...)`. Omitting `return` causes the parent call to receive `undefined`.';
    followUpQuestion = 'What happens to the return value of a recursive call if the parent frame forgets to include `return`?';
    conceptTags = ['return values', 'call stack', 'recursion'];
  } else if (!combined.includes('base') && !combined.includes('if') && !combined.includes('stop')) {
    category = 'no-base-case';
    categoryLabel = 'Missing Base Case';
    whatStudentGotRight = 'You recognized the recursive function calls.';
    exactGap = 'Omitted the base case condition required to terminate recursion.';
    targetedRemediation = 'Every recursive algorithm must have a base case—a non-recursive conditional check that stops further calls. Without a base case, recursion leads to infinite stack growth and a RangeError.';
    followUpQuestion = 'What condition must be met for a recursive function to safely stop calling itself?';
    conceptTags = ['base case', 'stack overflow', 'termination'];
  }

  // Assess confidence
  let confidenceAssessment = 'calibrated';
  let confidenceNote = 'Your confidence rating is reasonably aligned with the heuristic diagnostic analysis.';
  if (confidenceLevel === 'high' && category !== 'correct-reasoning') {
    confidenceAssessment = 'overconfident';
    confidenceNote = 'High confidence was expressed despite structural gaps in the trace mechanics.';
  } else if (confidenceLevel === 'low' && category === 'correct-reasoning') {
    confidenceAssessment = 'underconfident';
    confidenceNote = 'Low confidence was expressed despite demonstrating accurate core reasoning.';
  }

  return {
    misconceptionCategory: category,
    categoryLabel: categoryLabel,
    whatStudentGotRight: whatStudentGotRight,
    exactGap: exactGap,
    targetedRemediation: targetedRemediation,
    followUpQuestion: followUpQuestion,
    confidenceAssessment: confidenceAssessment,
    confidenceNote: confidenceNote,
    conceptTags: conceptTags
  };
}
