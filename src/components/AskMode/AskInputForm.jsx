import React, { useState } from 'react';
import { validateAskModeQuestion, validateStudentInput } from '../../lib/security';

/**
 * AskInputForm — Step 1 of Ask Mode
 * Allows students to submit any question/code snippet along with their reasoning
 * and confidence level for AI mental model diagnosis.
 */
export default function AskInputForm({
  initialQuestion = '',
  initialReasoning = '',
  initialConfidence = 'medium',
  onSubmit,
  isLoading
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [reasoning, setReasoning] = useState(initialReasoning);
  const [confidence, setConfidence] = useState(initialConfidence);

  const [questionError, setQuestionError] = useState('');
  const [reasoningError, setReasoningError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let hasError = false;

    const qVal = validateAskModeQuestion(question);
    if (!qVal.valid) {
      setQuestionError(qVal.error);
      hasError = true;
    } else {
      setQuestionError('');
    }

    const rVal = validateStudentInput(reasoning);
    if (!rVal.valid) {
      setReasoningError(rVal.error);
      hasError = true;
    } else {
      setReasoningError('');
    }

    if (hasError) return;

    onSubmit({
      question: qVal.sanitized,
      reasoning: rVal.sanitized,
      confidence
    });
  };

  const confidenceLevels = [
    { id: 'low', label: 'Low', sublabel: 'Unsure — guessing or confused', color: 'border-[#d97b1e] bg-[#fef7ed] text-[#b5680e] hover:bg-[#fdefd6]' },
    { id: 'medium', label: 'Medium', sublabel: 'Reasonable attempt — might have gaps', color: 'border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe]' },
    { id: 'high', label: 'High', sublabel: 'Confident — ready to defend', color: 'border-[#16a34a] bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7]' }
  ];

  return (
    <div className="bg-white rounded-xl border border-[#8b5cf6]/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e9ef] bg-[#f9f5ff]">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#8b5cf6] text-white">
            Ask Mode
          </span>
          <h2 className="font-display font-semibold text-sm text-[#1c1f2b]">
            Diagnose My Understanding
          </h2>
        </div>
        <span className="text-[10px] text-[#8b90a0] font-mono uppercase tracking-wider">
          Custom Question & Code Trace
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Field 1: Question or Code Snippet */}
        <div>
          <label htmlFor="user-question-input" className="block text-xs font-display font-semibold text-[#1c1f2b] mb-1">
            1. What concept or code are you confused about?
          </label>
          <p className="text-[11px] text-[#8b90a0] mb-2">
            Paste your question, a code snippet, or describe what concept you're stuck on.
          </p>
          <textarea
            id="user-question-input"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (e.target.value.trim()) setQuestionError('');
            }}
            disabled={isLoading}
            rows={6}
            placeholder="e.g. 'Why does this recursive function return undefined?' or 'I think recursion works like a loop — is that wrong?' or paste code directly."
            className="w-full rounded-lg border border-[#d8dae3] bg-[#f6f7f9] px-3.5 py-2.5 text-[13px] text-[#1c1f2b] placeholder-[#8b90a0] font-mono focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] transition-all"
          />
          {questionError && <p className="mt-1 text-xs text-[#dc4a5e] font-medium">{questionError}</p>}
        </div>

        {/* Field 2: Stated Reasoning */}
        <div>
          <label htmlFor="user-reasoning-input" className="block text-xs font-display font-semibold text-[#1c1f2b] mb-1">
            2. What do YOU think is happening? (Your reasoning — even if wrong):
          </label>
          <p className="text-[11px] text-[#8b90a0] mb-2">
            Mandatory step. Walk through what you believe is happening step by step.
          </p>
          <textarea
            id="user-reasoning-input"
            value={reasoning}
            onChange={(e) => {
              setReasoning(e.target.value);
              if (e.target.value.trim()) setReasoningError('');
            }}
            disabled={isLoading}
            rows={3}
            placeholder="Walk through what you believe is happening step by step."
            className="w-full rounded-lg border border-[#d8dae3] bg-[#f6f7f9] px-3.5 py-2.5 text-[13px] text-[#1c1f2b] placeholder-[#8b90a0] font-mono focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] transition-all"
          />
          {reasoningError && <p className="mt-1 text-xs text-[#dc4a5e] font-medium">{reasoningError}</p>}
        </div>

        {/* Field 3: Confidence Selector */}
        <div>
          <label className="block text-xs font-display font-semibold text-[#1c1f2b] mb-1">
            3. How confident are you in your reasoning?
          </label>
          <p className="text-[11px] text-[#8b90a0] mb-2.5">
            This calibration helps Jigyasa detect overconfidence vs underconfidence gaps.
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {confidenceLevels.map((level) => (
              <button
                type="button"
                key={level.id}
                onClick={() => setConfidence(level.id)}
                disabled={isLoading}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${confidence === level.id ? `${level.color} ring-2 ring-offset-1` : 'border-[#e8e9ef] bg-[#f6f7f9] text-[#555a6e] hover:bg-[#f0f1f5]'}
                `}
              >
                <span className="block font-display font-semibold text-xs">{level.label}</span>
                <span className="block text-[10px] opacity-75 mt-0.5 leading-tight">{level.sublabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || !question.trim() || !reasoning.trim()}
            className="px-6 py-2.5 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] active:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs shadow-md transition-all cursor-pointer"
          >
            {isLoading ? 'Analyzing your mental model...' : 'Analyze My Understanding →'}
          </button>
        </div>
      </form>
    </div>
  );
}
