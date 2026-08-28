import React, { useState, useCallback } from 'react';
import StackVisualizer from './StackVisualizer';
import ExplainBackChallenge from './ExplainBackChallenge';
import { categories } from '../data/subjects/recursion';

/**
 * FeedbackCard — AI classification result with targeted remediation
 * and predictive stack tracing.
 *
 * Props:
 *   round, totalRounds
 *   problem           — the current problem
 *   analysisResult    — { category, confidence, explanation, targetedRemediation }
 *   studentConfidence — 'low' | 'medium' | 'high'
 *   onNextRound       — (predictions?) => void
 */
export default function FeedbackCard({ round, totalRounds, problem, analysisResult, studentConfidence, onNextRound }) {
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [stackPredictions, setStackPredictions] = useState(null);

  const cat = categories[analysisResult.category] || categories['stack-blindness'];

  // Confidence calibration signal
  const isCorrect = analysisResult.category === 'correct-reasoning';
  let calibrationSignal = null;
  if (studentConfidence) {
    if (studentConfidence === 'high' && !isCorrect) {
      calibrationSignal = { type: 'overconfident', label: 'Overconfident', detail: 'You rated high confidence, but the trace has structural gaps. In an exam or interview, this kind of miscalibration is costly — you would move on without realizing the answer is incomplete.', color: '#dc4a5e' };
    } else if (studentConfidence === 'low' && isCorrect) {
      calibrationSignal = { type: 'underconfident', label: 'Underconfident', detail: 'You rated low confidence, but your trace was accurate. Recognizing what you actually know is a skill — trust your reasoning when the stack frames and return values check out.', color: '#3b82f6' };
    } else if (studentConfidence === 'low' && !isCorrect) {
      calibrationSignal = { type: 'calibrated-uncertain', label: 'Calibrated', detail: 'You flagged uncertainty and the trace does have gaps — that self-awareness is useful. Focus the next attempt on the specific gap identified below.', color: '#d97b1e' };
    } else if (studentConfidence === 'high' && isCorrect) {
      calibrationSignal = { type: 'calibrated-confident', label: 'Calibrated', detail: 'High confidence and an accurate trace. Your mental model of the call stack is solid for this pattern.', color: '#16a34a' };
    }
  }

  const handlePredictions = useCallback((preds) => {
    setStackPredictions(preds);
  }, []);

  const handleNext = () => {
    onNextRound(stackPredictions);
  };

  return (
    <div className="space-y-4">
      {/* Classification card */}
      <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e8e9ef]">
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ backgroundColor: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}
            >
              {cat.label}
            </span>
            {analysisResult.confidence && (
              <span className="text-[10px] text-[#8b90a0] font-mono">
                {Math.round(analysisResult.confidence * 100)}% match
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] text-[#8b90a0]">
            round {round}/{totalRounds}
          </span>
        </div>

        {/* Diagnostic explanation */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <h4 className="font-display text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-1">
              Diagnostic
            </h4>
            <p className="text-[13px] text-[#1c1f2b] leading-relaxed">
              {analysisResult.explanation}
            </p>
          </div>

          <div className="rounded-lg border border-[#d6dcf5] bg-[#eef1fa] px-4 py-3">
            <h4 className="font-display text-xs font-semibold text-[#2a44a8] uppercase tracking-wider mb-1">
              What to fix
            </h4>
            <p className="text-[13px] text-[#2a44a8] leading-relaxed">
              {analysisResult.targetedRemediation}
            </p>
          </div>

          {/* DSA context */}
          <p className="text-[11px] text-[#8b90a0] leading-relaxed italic">
            {cat.dsaNote}
          </p>
        </div>

        {/* Confidence calibration signal */}
        {calibrationSignal && (
          <div
            className="mx-5 mb-4 px-4 py-3 rounded-lg border text-[13px] leading-relaxed"
            style={{
              backgroundColor: `${calibrationSignal.color}08`,
              borderColor: `${calibrationSignal.color}25`,
              color: calibrationSignal.color
            }}
          >
            <span className="font-display font-semibold text-xs uppercase tracking-wider">
              Confidence calibration: {calibrationSignal.label}
            </span>
            <p className="mt-1 opacity-90" style={{ color: '#1c1f2b' }}>
              {calibrationSignal.detail}
            </p>
          </div>
        )}
      </div>

      {/* Feynman Technique — Explain It Back Challenge */}
      <ExplainBackChallenge
        conceptLabel={cat.label}
        targetedRemediation={analysisResult.targetedRemediation}
      />

      {/* Stack Visualizer — signature element, always shown */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-xs font-semibold text-[#555a6e] uppercase tracking-wider">
            Call Stack Trace {problem.stackTraceId ? '' : '(generic)'}
          </span>
          <button
            onClick={() => setShowVisualizer(!showVisualizer)}
            className="text-[11px] text-[#3b5bdb] font-medium hover:underline cursor-pointer"
          >
            {showVisualizer ? 'Collapse' : 'Expand trace'}
          </button>
        </div>
        {showVisualizer && (
          <StackVisualizer
            traceId={problem.stackTraceId || 'factorial-3'}
            predictive={analysisResult.category !== 'correct-reasoning'}
            onPredictions={handlePredictions}
          />
        )}

        {/* Prediction results summary */}
        {stackPredictions && (
          <div className="mt-2 flex items-center gap-2 text-xs font-mono">
            <span className={`px-2 py-0.5 rounded ${
              stackPredictions.correct === stackPredictions.total
                ? 'bg-[#dcfce7] text-[#16a34a]'
                : stackPredictions.correct >= stackPredictions.total / 2
                ? 'bg-[#fef7ed] text-[#d97b1e]'
                : 'bg-[#fef2f2] text-[#dc4a5e]'
            }`}>
              Stack predictions: {stackPredictions.correct}/{stackPredictions.total}
            </span>
            <span className="text-[#8b90a0]">
              {stackPredictions.correct === stackPredictions.total
                ? 'You tracked every push and pop correctly.'
                : `You missed ${stackPredictions.total - stackPredictions.correct} stack operation(s).`}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-5 py-2.5 rounded-lg bg-[#1c1f2b] text-white text-xs font-medium hover:bg-[#2d3145] transition-colors cursor-pointer"
        >
          {round < totalRounds
            ? `Continue to round ${round + 1} →`
            : 'View misconception map →'}
        </button>
      </div>
    </div>
  );
}
