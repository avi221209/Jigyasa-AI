/**
 * RECURSION — Subject Data Module
 * ================================
 * 
 * ARCHITECTURE NOTE (intentional extensibility):
 * This file is the ONLY place where recursion-specific content lives:
 * problems, misconception categories, classification prompt templates,
 * stack trace steps, and heuristic keyword patterns.
 * 
 * The tutoring engine (App.jsx, components) is completely subject-agnostic.
 * It reads from whatever subject module is loaded, using the shape exported
 * below. To add a new DSA topic (trees, graphs, dynamic programming),
 * duplicate this file as e.g. /src/data/subjects/trees.js, populate it
 * with tree-specific problems and misconceptions, and swap the import
 * in App.jsx. No engine code changes required.
 * 
 * Exported shape:
 *   subjectMeta       – display name, slug, description
 *   categories        – misconception category definitions (id, label, color, tagline, icon)
 *   initialProblem    – the Round 1 diagnostic problem
 *   problemBank       – adaptive follow-up problems keyed by category id
 *   stackTraceSteps   – ordered call-stack frames for the visualizer
 *   buildClassificationPrompt(problem, answer, confidence) – prompt constructor
 *   heuristicClassify(text) – offline fallback classifier
 */

// ─── Subject Metadata ────────────────────────────────────────────────
export const subjectMeta = {
  slug: 'recursion',
  name: 'Recursion',
  domain: 'Data Structures & Algorithms',
  description: 'Call stack mechanics, base case termination, and stack frame unwinding in recursive functions.',
  examContext: 'DSA viva, technical interview whiteboard traces, competitive programming debugging.'
};

// ─── Misconception Categories ─────────────────────────────────────────
// Each category has a unique id, display label, hex color, short tagline
// for feedback, and a DSA-specific diagnostic description.
export const categories = {
  'no-base-case': {
    id: 'no-base-case',
    label: 'Missing Base Case',
    color: '#dc4a5e',
    tagline: 'Failed to identify the termination condition that prevents a stack overflow (RangeError: Maximum call stack size exceeded).',
    dsaNote: 'In a DSA viva or interview, an examiner will immediately ask "what stops this?" If you cannot point to the base case, the trace is incomplete.'
  },
  'iteration-confusion': {
    id: 'iteration-confusion',
    label: 'Loop Mental Model',
    color: '#d97b1e',
    tagline: 'Described execution as a sequential loop reusing one mutable variable, rather than independent stack frames each holding their own copy of parameters.',
    dsaNote: 'Interviewers test this directly: "Is `n` the same variable across calls, or does each call get its own?" The answer reveals whether you understand O(n) space on the call stack.'
  },
  'stack-blindness': {
    id: 'stack-blindness',
    label: 'Stack Frame Blindness',
    color: '#8b5cf6',
    tagline: 'Did not account for the call stack building up in memory or for parent frames waiting (frozen) until their child call returns.',
    dsaNote: 'Stack-blind answers collapse in tree/graph recursion where you must track multiple frames. This is the #1 reason students fail recursive DFS traces on exams.'
  },
  'correct-reasoning': {
    id: 'correct-reasoning',
    label: 'Correct Trace',
    color: '#16a34a',
    tagline: 'Accurately traced stack frame creation, base case trigger, and LIFO return-value unwinding.',
    dsaNote: 'Solid foundation. In an interview setting, you could extend this to analyze time complexity T(n) via recurrence relations and space complexity from maximum stack depth.'
  },
  'guessing': {
    id: 'guessing',
    label: 'Surface-Level Answer',
    color: '#ca8a04',
    tagline: 'Stated the output value without tracing the mechanism — equivalent to memorizing the answer without understanding the call graph.',
    dsaNote: 'An interviewer who hears "it returns 6" without a trace will follow up with "walk me through the stack." If you cannot, the question is marked incomplete.'
  }
};

// ─── Initial Diagnostic Problem (Round 1) ──────────────────────────────
export const initialProblem = {
  id: 'round1-factorial',
  title: 'Execution Trace: factorial(3)',
  code: `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// What does factorial(3) return?
let result = factorial(3);`,
  question: 'Trace the execution of factorial(3). For each recursive call, state what value of n enters the frame, what the frame is waiting for, and in what order the return values unwind back to the original caller. This is the kind of trace question that appears in a DSA viva or technical interview.',
  expectedTopic: 'Three stack frames created (n=3, n=2, n=1). Base case at n=1 returns 1. Frames unwind LIFO: 1→2*1=2→3*2=6.',
  stackTraceId: 'factorial-3'
};

// ─── Adaptive Problem Bank ─────────────────────────────────────────────
// Keyed by misconception category. Engine picks from here for rounds 2–3.
export const problemBank = {
  'stack-blindness': [
    {
      id: 'stack-reverse-str',
      title: 'Stack Unwinding: reverseString("cat")',
      code: `function reverseString(str) {
  if (str === "") return "";
  return reverseString(str.substr(1)) + str.charAt(0);
}

reverseString("cat");`,
      question: 'At the instant reverseString("") returns "", how many suspended frames are sitting on the call stack? List each frame and the character it is waiting to concatenate. This tests whether you can track O(n) space usage — a common follow-up in interviews after "what is the space complexity of this recursive solution?"',
      expectedTopic: 'Stack depth = 4 frames (including base). Unwind: "" → "t" → "ta" → "tac".',
      stackTraceId: 'reverse-cat'
    },
    {
      id: 'stack-sum-array',
      title: 'Pending Return Values: sumArray([5, 2])',
      code: `function sumArray(arr) {
  if (arr.length === 0) return 0;
  return arr[0] + sumArray(arr.slice(1));
}

sumArray([5, 2]);`,
      question: 'Explain why the expression `5 + sumArray([2])` cannot evaluate immediately. What concrete value is the parent frame blocked on, and what happens in memory while it waits? Interviewers use this pattern to verify you understand that recursive calls are not sequential statements — they are nested pending evaluations.',
      expectedTopic: 'Parent frame holds `5 + <pending>`. Child must resolve sumArray([2]) → sumArray([]) → 0, then unwind: 0→2→7.',
      stackTraceId: 'sum-array'
    }
  ],
  'no-base-case': [
    {
      id: 'base-countdown',
      title: 'Missing Termination: printCountdown(3)',
      code: `function printCountdown(n) {
  console.log(n);
  printCountdown(n - 1);
}

printCountdown(3);`,
      question: 'Run this code mentally. What happens after it prints 0? What specific runtime error will you see, and at approximately what stack depth? Then write the one-line fix. In a technical interview, forgetting the base case is the single most common recursion bug — and the easiest to spot if you trace systematically.',
      expectedTopic: 'Infinite recursion → RangeError: Maximum call stack size exceeded (typically ~10k frames in V8). Fix: add `if (n < 0) return;`.',
      stackTraceId: 'countdown-infinite'
    },
    {
      id: 'base-fibonacci-stop',
      title: 'Base Case Design: fib(n)',
      code: `function fib(n) {
  // What goes here?
  return fib(n - 1) + fib(n - 2);
}`,
      question: 'Without a base case, fib(5) generates infinite branching calls. Identify the exact condition(s) needed and explain why fib needs TWO base cases (n=0 and n=1), not just one. This is frequently tested in complexity analysis questions: the base cases define the leaves of the T(n) call tree.',
      expectedTopic: 'Need: if (n <= 0) return 0; if (n === 1) return 1; Two bases because fib subtracts both 1 and 2.',
      stackTraceId: 'fib-base'
    }
  ],
  'iteration-confusion': [
    {
      id: 'iter-power',
      title: 'Parameter Isolation: power(2, 3)',
      code: `function power(base, exp) {
  if (exp === 0) return 1;
  return base * power(base, exp - 1);
}

power(2, 3);`,
      question: 'A student writes: "exp starts at 3 and decreases to 0 in a loop." Identify the specific error in this mental model. How many distinct copies of `exp` exist simultaneously on the stack at maximum depth? What is the space complexity, and how does it differ from an iterative version using a single mutable counter?',
      expectedTopic: 'Four distinct frames on the stack (exp=3,2,1,0). Each has its own `exp` — not a shared counter. Space: O(n) recursive vs O(1) iterative.',
      stackTraceId: 'power-frames'
    },
    {
      id: 'iter-count-down-up',
      title: 'Post-Recursive Execution Order: count(2)',
      code: `function count(n) {
  if (n === 0) return;
  console.log("Before: " + n);
  count(n - 1);
  console.log("After: " + n);
}

count(2);`,
      question: 'Write the exact console output. Then explain why "After: 1" prints before "After: 2" even though there is no reverse loop. This LIFO execution order is identical to the pattern used in recursive DFS — understanding it here means understanding post-order traversal later.',
      expectedTopic: 'Output: Before:2, Before:1, After:1, After:2. The "After" lines execute during stack unwinding (LIFO).',
      stackTraceId: 'count-lifo'
    }
  ],
  'correct-reasoning': [
    {
      id: 'correct-tree-depth',
      title: 'Branching Recursion: maxDepth(tree)',
      code: `function maxDepth(node) {
  if (node === null) return 0;
  let leftDepth = maxDepth(node.left);
  let rightDepth = maxDepth(node.right);
  return 1 + Math.max(leftDepth, rightDepth);
}`,
      question: 'This function makes TWO recursive calls per frame. Trace a 3-node tree (root with left and right children). How does the call stack differ from linear recursion? What is the maximum stack depth vs total number of calls? This distinction between stack depth (space) and total calls (time) is critical for complexity analysis.',
      expectedTopic: 'Max depth = O(h) where h = tree height. Total calls = O(n) where n = nodes. Stack holds at most h+1 frames simultaneously.',
      stackTraceId: 'tree-depth'
    }
  ],
  'guessing': [
    {
      id: 'guessing-multiply',
      title: 'Mechanism Trace: multiply(4, 3)',
      code: `function multiply(a, b) {
  if (b === 0) return 0;
  return a + multiply(a, b - 1);
}

multiply(4, 3);`,
      question: 'You know the answer is 12. Now prove it: list every stack frame that is created, the return value of each, and the specific line where addition happens during unwinding. An interviewer who hears just "12" will immediately ask you to "show the work on the stack." This is that question.',
      expectedTopic: 'Frames: multiply(4,3)→multiply(4,2)→multiply(4,1)→multiply(4,0). Returns: 0→4→8→12. Each `a + <child return>` evaluates during unwind.',
      stackTraceId: 'multiply-trace'
    }
  ]
};

// ─── Stack Trace Steps for Visualizer ──────────────────────────────────
// Each trace is an array of steps. Each step has: phase label, description,
// and an array of frames currently on the stack (top-of-stack first).
// The `predict` field on a step means the student will be asked to predict
// before this step is revealed.
export const stackTraces = {
  'factorial-3': [
    {
      phase: 'PUSH',
      label: 'Call factorial(3)',
      description: 'Execution begins. A new stack frame is allocated with n = 3. The frame cannot return yet — it needs the result of factorial(2).',
      predict: { type: 'push', expectedCall: 'factorial(3)', expectedValue: 'n = 3' },
      frames: [
        { call: 'factorial(3)', status: 'active', detail: 'n = 3 · waiting for factorial(2)' }
      ]
    },
    {
      phase: 'PUSH',
      label: 'Call factorial(2)',
      description: 'factorial(3) is now suspended. A second frame is pushed with n = 2. Two frames on the stack — O(2) space used.',
      predict: { type: 'push', expectedCall: 'factorial(2)', expectedValue: 'n = 2' },
      frames: [
        { call: 'factorial(2)', status: 'active', detail: 'n = 2 · waiting for factorial(1)' },
        { call: 'factorial(3)', status: 'suspended', detail: 'n = 3 · frozen, waiting' }
      ]
    },
    {
      phase: 'BASE',
      label: 'Base case: factorial(1)',
      description: 'n ≤ 1 is true. No further recursive call. This frame returns 1 immediately. Stack has reached maximum depth = 3.',
      predict: { type: 'push', expectedCall: 'factorial(1)', expectedValue: 'returns 1 (base case)' },
      frames: [
        { call: 'factorial(1)', status: 'base', detail: 'n = 1 → returns 1' },
        { call: 'factorial(2)', status: 'suspended', detail: 'n = 2 · waiting' },
        { call: 'factorial(3)', status: 'suspended', detail: 'n = 3 · waiting' }
      ]
    },
    {
      phase: 'POP',
      label: 'Pop factorial(1), resolve factorial(2)',
      description: 'factorial(1) is popped. Its return value (1) flows into factorial(2), which computes 2 × 1 = 2.',
      predict: { type: 'pop', expectedCall: 'factorial(1)', expectedValue: 'returns 1 → factorial(2) computes 2 × 1 = 2' },
      frames: [
        { call: 'factorial(2)', status: 'resolving', detail: '2 × 1 = 2 → returns 2' },
        { call: 'factorial(3)', status: 'suspended', detail: 'n = 3 · waiting' }
      ]
    },
    {
      phase: 'POP',
      label: 'Pop factorial(2), resolve factorial(3)',
      description: 'factorial(2) is popped returning 2. factorial(3) computes 3 × 2 = 6. Stack is empty. Final result: 6.',
      predict: { type: 'pop', expectedCall: 'factorial(2)', expectedValue: 'returns 2 → factorial(3) computes 3 × 2 = 6' },
      frames: [
        { call: 'factorial(3)', status: 'complete', detail: '3 × 2 = 6 → final result' }
      ]
    }
  ]
};

// ─── Classification Prompt Builder ─────────────────────────────────────
// Subject-specific prompt template. The engine calls this with problem data
// and the student's free-text answer + self-rated confidence.
export function buildClassificationPrompt(problem, studentAnswer, selfConfidence = null) {
  const categoryList = Object.values(categories)
    .map((c, i) => `${i + 1}. "${c.id}" — ${c.tagline}`)
    .join('\n');

  const confidenceNote = selfConfidence
    ? `\nThe student self-rated their confidence as: "${selfConfidence}" (low/medium/high). Factor this into your explanation — note if their confidence appears calibrated or miscalibrated relative to their actual answer quality.`
    : '';

  return `You are a CS recursion diagnostic classifier for an engineering DSA course.

PROBLEM:
Title: ${problem.title}
\`\`\`javascript
${problem.code}
\`\`\`
Question: ${problem.question}
Expected trace concept: ${problem.expectedTopic}

STUDENT'S ANSWER:
"${studentAnswer}"
${confidenceNote}

CLASSIFICATION CATEGORIES:
${categoryList}

RULES:
- Classify into EXACTLY ONE category.
- Your explanation must be specific and diagnostic — reference exact phrases or omissions from the student's answer. Never use generic praise ("Good job", "Nice try", "Well done").
- Your targetedRemediation must tell them exactly what they missed, using precise CS terminology (stack frame, base case, LIFO unwinding, O(n) stack space, etc).
- If the student's answer is correct but shallow, classify as "guessing" not "correct-reasoning."

Respond with ONLY this JSON (no markdown fences):
{
  "category": "<category-id>",
  "confidence": <0.0-1.0>,
  "explanation": "<2-3 diagnostic sentences referencing their specific answer>",
  "targetedRemediation": "<2 sentences addressing their exact gap with CS terminology>",
  "nextFocusArea": "<what to probe next>"
}`;
}

// ─── Heuristic Fallback Classifier ─────────────────────────────────────
// Used when no API key is configured. Keyword-based classification.
export function heuristicClassify(text) {
  const t = text.toLowerCase();

  const mentionsLoop = /\bloop\b|for\s*\(|while\b|iterat|counter\b|in-place|repeats/i.test(t);
  const mentionsBase = /base\s*case|stop|terminat|if\s*\(|n\s*[<=>]=?\s*[01]/i.test(t);
  const mentionsStack = /stack|unwind|frame|wait|return|memory|pop|push|suspend|frozen|lifo/i.test(t);
  const isShort = t.trim().length < 40;

  if (isShort && !mentionsStack && !mentionsBase) {
    return {
      category: 'guessing',
      confidence: 0.85,
      explanation: 'Response was under 40 characters with no reference to stack frames or base case mechanics — reads as a memorized answer without trace evidence.',
      targetedRemediation: 'An interviewer expects you to walk through each stack frame: what value of n enters, what the frame waits for, and in what order return values unwind. State the output AND the mechanism.',
      nextFocusArea: 'Full stack frame trace with return values.'
    };
  }
  if (mentionsLoop && !mentionsStack) {
    return {
      category: 'iteration-confusion',
      confidence: 0.82,
      explanation: 'Used loop/iteration terminology without referencing independent stack frames. This suggests a mental model where `n` is a single mutable variable being decremented in place.',
      targetedRemediation: 'Each recursive call allocates a separate stack frame with its own copy of all parameters. Unlike a for-loop counter, these copies coexist in memory simultaneously — that is where O(n) space complexity comes from.',
      nextFocusArea: 'Parameter isolation across stack frames.'
    };
  }
  if (!mentionsBase && mentionsStack) {
    return {
      category: 'no-base-case',
      confidence: 0.80,
      explanation: 'Described stack frame mechanics but did not identify the termination condition. Without specifying what stops the recursion, the trace is unbounded.',
      targetedRemediation: 'Every recursive function requires a base case — a condition checked at the top of each call that returns without recursing further. Without it, you get infinite stack growth and a stack overflow.',
      nextFocusArea: 'Identifying and articulating the base case condition.'
    };
  }
  if (!mentionsStack && mentionsBase) {
    return {
      category: 'stack-blindness',
      confidence: 0.80,
      explanation: 'Identified the stopping condition but did not describe how intermediate frames remain on the stack waiting for child returns. The trace skipped the unwinding phase entirely.',
      targetedRemediation: 'When factorial(3) calls factorial(2), the factorial(3) frame is not gone — it is suspended on the call stack, holding n=3, waiting for a return value. This waiting-and-unwinding is what distinguishes recursion from iteration.',
      nextFocusArea: 'Stack frame suspension and LIFO unwinding.'
    };
  }
  if (mentionsStack && mentionsBase) {
    return {
      category: 'correct-reasoning',
      confidence: 0.78,
      explanation: 'Referenced both the base case termination and stack frame mechanics including unwinding. The mental model appears structurally sound.',
      targetedRemediation: 'Your trace covers the core mechanics. To strengthen this for interviews, practice stating the space complexity (max stack depth) and time complexity (total frames created) for each recursive function you encounter.',
      nextFocusArea: 'Complexity analysis of recursive call trees.'
    };
  }
  return {
    category: 'stack-blindness',
    confidence: 0.65,
    explanation: 'The response did not clearly reference call stack frame creation, suspension, or LIFO unwinding. The trace appears incomplete.',
    targetedRemediation: 'Focus on the call stack as a physical data structure: each call pushes a frame, the frame holds local variables, and frames pop in reverse order (LIFO) as return values flow back up.',
    nextFocusArea: 'Call stack as a data structure.'
  };
}
