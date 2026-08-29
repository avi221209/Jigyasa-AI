import React, { useState } from 'react';
import { validateStudentInput } from '../lib/security';

/**
 * QuestionCard — Diagnostic question with confidence calibration.
 *
 * Flow: student writes free-text answer → rates confidence (low/med/high) → submits.
 * Confidence is stored alongside the answer for overconfidence/underconfidence tracking.
 *
 * Props:
 *   round, totalRounds  — progress state
 *   problem             — { title, code, question }
 *   onSubmitAnswer      — (answer, confidence) => void
 *   isLoading           — boolean
 *   subjectMeta         — { name, examContext }
 */
export default function QuestionCard({ round, totalRounds, problem, onSubmitAnswer, onSkipProblem, isLoading, subjectMeta }) {
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState(null); // 'low' | 'medium' | 'high'
  const [phase, setPhase] = useState('answer'); // 'answer' | 'confidence'
  const [error, setError] = useState('');

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    const validation = validateStudentInput(answer);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError('');
    setPhase('confidence');
  };

  const handleConfidenceSelect = (level) => {
    const validation = validateStudentInput(answer);
    if (!validation.valid) {
      setError(validation.error);
      setPhase('answer');
      return;
    }
    setConfidence(level);
    onSubmitAnswer(validation.sanitized, level);
  };

  const confidenceLevels = [
    { id: 'low', label: 'Low', sublabel: 'Unsure — guessing or partially remembered', color: 'border-[#d97b1e] bg-[#fef7ed] text-[#b5680e] hover:bg-[#fdefd6]' },
    { id: 'medium', label: 'Medium', sublabel: 'Reasonable attempt — might have gaps', color: 'border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe]' },
    { id: 'high', label: 'High', sublabel: 'Confident — would defend this in a viva', color: 'border-[#16a34a] bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7]' },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e8e9ef]">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#1c1f2b] text-white">
            {round}/{totalRounds}
          </span>
          <h2 className="font-display font-semibold text-sm text-[#1c1f2b]">
            {problem.title}
          </h2>
        </div>
        <span className="text-[10px] text-[#8b90a0] font-mono uppercase tracking-wider">
          {round === 1 ? 'diagnostic' : 'adaptive'}
        </span>
      </div>

      {/* Code block */}
      <div className="mx-5 mt-4 rounded-lg border border-[#e8e9ef] bg-[#f6f7f9] overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#e8e9ef] bg-[#f0f1f5]">
          <div className="w-2 h-2 rounded-full bg-[#dc4a5e]"></div>
          <div className="w-2 h-2 rounded-full bg-[#d97b1e]"></div>
          <div className="w-2 h-2 rounded-full bg-[#16a34a]"></div>
          <span className="ml-2 text-[10px] text-[#8b90a0] font-mono">{subjectMeta?.name || 'Recursion'}</span>
        </div>
        <pre className="px-4 py-3 font-mono text-[13px] text-[#1c1f2b] overflow-x-auto leading-relaxed">
          <code>{problem.code}</code>
        </pre>
      </div>

      {/* Question prompt */}
      <div className="mx-5 mt-3 px-4 py-3 rounded-lg border border-[#d6dcf5] bg-[#eef1fa]">
        <p className="text-[13px] text-[#2a44a8] leading-relaxed">
          {problem.question}
        </p>
      </div>

      {/* Phase: answer input OR confidence rating */}
      <div className="px-5 py-4">
        {phase === 'answer' ? (
          <form onSubmit={handleAnswerSubmit}>
            <label htmlFor="reasoning-input" className="block text-xs font-medium text-[#555a6e] mb-1.5">
              Trace the execution — describe each stack frame, the base case trigger, and return-value unwinding:
            </label>
            <textarea
              id="reasoning-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isLoading}
              placeholder="factorial(3) pushes a frame with n=3, which calls factorial(2)…"
              rows={4}
              maxLength={2000}
              className="w-full rounded-lg border border-[#d8dae3] bg-[#f6f7f9] px-3.5 py-2.5 text-[13px] text-[#1c1f2b] placeholder-[#8b90a0] font-mono focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb] transition-all"
            />
            {error && <p className="mt-1 text-xs text-[#dc4a5e]">{error}</p>}

            <div className="flex items-center justify-between mt-3">
              {onSkipProblem ? (
                <button
                  type="button"
                  onClick={onSkipProblem}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg border border-[#d8dae3] dark:border-[#2a3449] text-[#555a6e] dark:text-[#94a3b8] hover:bg-[#f0f1f5] dark:hover:bg-[#2a3449] text-xs font-mono transition-colors cursor-pointer disabled:opacity-40"
                >
                  Skip this problem →
                </button>
              ) : <div></div>}
              <button
                type="submit"
                disabled={isLoading || !answer.trim()}
                className="px-5 py-2 rounded-lg bg-[#1c1f2b] text-white text-xs font-medium hover:bg-[#2d3145] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Continue to confidence rating →
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-xs font-display font-medium text-[#1c1f2b] mb-1">
              Before we analyze your answer — how confident are you?
            </p>
            <p className="text-[11px] text-[#8b90a0] mb-3">
              This calibration tracks whether you know what you know. Overconfidence on wrong answers is itself a diagnostic signal.
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {confidenceLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleConfidenceSelect(level.id)}
                  disabled={isLoading}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${level.color}
                  `}
                >
                  <span className="block font-display font-semibold text-sm">{level.label}</span>
                  <span className="block text-[10px] opacity-75 mt-0.5 leading-tight">{level.sublabel}</span>
                </button>
              ))}
            </div>
            {isLoading && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#555a6e]">
                <div className="w-3 h-3 rounded-full border-2 border-[#3b5bdb] border-t-transparent animate-spin"></div>
                <span className="font-mono">Classifying misconception…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
