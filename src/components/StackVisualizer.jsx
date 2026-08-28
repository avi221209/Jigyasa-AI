import React, { useState, useCallback } from 'react';
import { stackTraces } from '../data/subjects/recursion';

/**
 * StackVisualizer — the signature visual element of Misconception Mapper.
 *
 * Renders call stack frames as stacked blocks with depth-gradient coloring.
 * Supports predictive mode: student guesses the next operation (push/pop)
 * before each step is revealed.
 *
 * Props:
 *   traceId        — key into stackTraces (e.g. 'factorial-3')
 *   predictive     — if true, gates each step behind a student prediction
 *   onPredictions  — callback({ total, correct }) when trace completes
 */
export default function StackVisualizer({ traceId = 'factorial-3', predictive = false, onPredictions }) {
  const steps = stackTraces[traceId] || stackTraces['factorial-3'];
  const [step, setStep] = useState(0);
  const [predictions, setPredictions] = useState([]);  // { stepIdx, guess, correct }
  const [pendingGuess, setPendingGuess] = useState(null);
  const [guessResult, setGuessResult] = useState(null); // 'correct' | 'incorrect' | null

  const current = steps[step];
  const maxDepth = Math.max(...steps.map(s => s.frames.length));

  const depthColors = [
    'bg-[#eef1fa] border-[#c5cef0] text-[#2a44a8]',
    'bg-[#d6dcf5] border-[#adb8ea] text-[#2a44a8]',
    'bg-[#b8c4ef] border-[#8fa0e5] text-[#1c2d7a]',
    'bg-[#8fa0e5] border-[#6b80d9] text-white',
    'bg-[#3b5bdb] border-[#2f4ec4] text-white',
  ];

  const statusStyles = {
    active: 'ring-2 ring-[#3b5bdb] ring-offset-1 ring-offset-[#f6f7f9]',
    suspended: 'opacity-70',
    base: 'ring-2 ring-[#16a34a] ring-offset-1 ring-offset-[#f6f7f9]',
    resolving: 'ring-2 ring-[#d97b1e] ring-offset-1 ring-offset-[#f6f7f9]',
    complete: 'ring-2 ring-[#16a34a] ring-offset-1 ring-offset-[#f6f7f9]',
  };

  const phaseLabels = {
    PUSH: { text: 'PUSH ↓', style: 'bg-[#3b5bdb] text-white' },
    POP:  { text: 'POP ↑',  style: 'bg-[#d97b1e] text-white' },
    BASE: { text: 'BASE ■', style: 'bg-[#16a34a] text-white' },
  };

  const handlePredict = (guess) => {
    const expected = current.predict;
    const isCorrect = guess === expected.type;
    const entry = { stepIdx: step, guess, expected: expected.type, correct: isCorrect };
    const newPredictions = [...predictions, entry];
    setPredictions(newPredictions);
    setPendingGuess(guess);
    setGuessResult(isCorrect ? 'correct' : 'incorrect');
  };

  const advanceStep = useCallback(() => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
      setPendingGuess(null);
      setGuessResult(null);
    } else if (predictive && onPredictions) {
      const total = predictions.length;
      const correct = predictions.filter(p => p.correct).length;
      onPredictions({ total, correct, log: predictions });
    }
  }, [step, steps.length, predictive, predictions, onPredictions]);

  const needsPrediction = predictive && current.predict && pendingGuess === null;
  const phaseInfo = phaseLabels[current.phase] || phaseLabels.PUSH;

  const correctCount = predictions.filter(p => p.correct).length;

  return (
    <div className="rounded-xl border border-[#d8dae3] bg-white overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f0f1f5] border-b border-[#d8dae3]">
        <div className="flex items-center gap-2.5">
          <span className="font-display font-semibold text-sm text-[#1c1f2b]">
            Call Stack Trace
          </span>
          {predictive && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3b5bdb] text-white font-medium">
              PREDICT MODE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-[#555a6e] font-mono">
          {predictive && predictions.length > 0 && (
            <span>
              {correctCount}/{predictions.length} correct
            </span>
          )}
          <span>
            Step {step + 1}/{steps.length}
          </span>
        </div>
      </div>

      {/* Phase + description */}
      <div className="px-4 py-3 border-b border-[#e8e9ef]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${phaseInfo.style}`}>
            {phaseInfo.text}
          </span>
          <span className="font-display font-medium text-sm text-[#1c1f2b]">
            {current.label}
          </span>
        </div>
        <p className="text-xs text-[#555a6e] leading-relaxed">
          {current.description}
        </p>
      </div>

      {/* Stack frames — rendered bottom-up visually (deepest at bottom) */}
      <div className="px-4 py-4">
        {predictive && (
          <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-[#8b90a0] uppercase tracking-wider font-semibold">
            <span>Actual Call Stack State (Ground Truth)</span>
            <span>Frame Status</span>
          </div>
        )}
        <div className="flex flex-col-reverse gap-1.5">
          {current.frames.map((frame, idx) => {
            const depthIdx = Math.min(current.frames.length - 1 - idx, depthColors.length - 1);
            const colorClass = depthColors[depthIdx];
            const statusClass = statusStyles[frame.status] || '';
            const isTop = idx === 0;

            const formatFrameStatus = (st) => {
              switch (st) {
                case 'active': return 'Active';
                case 'suspended': return 'Suspended';
                case 'base': return 'Base Case';
                case 'resolving': return 'Unwinding';
                case 'complete': return 'Frame Resolved';
                default: return st;
              }
            };

            return (
              <div
                key={`${step}-${idx}`}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-lg border
                  font-mono text-xs transition-all
                  ${colorClass} ${statusClass}
                  ${isTop ? 'shadow-sm' : ''}
                `}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-[11px] shrink-0">
                    {frame.call}
                  </span>
                  <span className="text-[11px] opacity-80 truncate">
                    {frame.detail}
                  </span>
                </div>
                <span className={`
                  text-[9px] uppercase tracking-wider font-bold shrink-0 ml-2 px-1.5 py-0.5 rounded
                  ${frame.status === 'active' ? 'bg-[#3b5bdb] text-white' :
                    frame.status === 'base' || frame.status === 'complete' ? 'bg-[#16a34a] text-white' :
                    frame.status === 'resolving' ? 'bg-[#d97b1e] text-white' :
                    'bg-[#d8dae3] text-[#555a6e]'}
                `}>
                  {formatFrameStatus(frame.status)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Depth gauge */}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#8b90a0] font-mono">
          <span>stack depth:</span>
          {Array.from({ length: maxDepth }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-2 rounded-sm ${
                i < current.frames.length ? 'bg-[#3b5bdb]' : 'bg-[#e8e9ef]'
              }`}
            />
          ))}
          <span className="ml-1 font-semibold text-[#3b5bdb]">{current.frames.length}</span>
        </div>
      </div>

      {/* Prediction gate OR navigation controls */}
      <div className="px-4 py-3 border-t border-[#e8e9ef] bg-[#f6f7f9]">
        {needsPrediction ? (
          <div>
            <p className="text-xs font-medium text-[#1c1f2b] mb-2 font-display">
              Predict the next operation:
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePredict('push')}
                className="flex-1 py-2 rounded-lg bg-[#3b5bdb] text-white font-mono text-xs font-semibold hover:bg-[#2f4ec4] transition-colors cursor-pointer"
              >
                PUSH ↓ new frame
              </button>
              <button
                onClick={() => handlePredict('pop')}
                className="flex-1 py-2 rounded-lg bg-[#d97b1e] text-white font-mono text-xs font-semibold hover:bg-[#b5680e] transition-colors cursor-pointer"
              >
                POP ↑ return value
              </button>
            </div>
          </div>
        ) : guessResult ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`font-mono font-bold text-[11px] px-2.5 py-1 rounded ${
                guessResult === 'correct'
                  ? 'bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]'
                  : 'bg-[#fef2f2] text-[#dc4a5e] border border-[#fecaca]'
              }`}>
                {guessResult === 'correct' ? '✓ Correct Prediction' : '✗ Incorrect Prediction'}
              </span>
              <span className="text-[11px] text-[#555a6e]">
                {guessResult === 'correct' ? (
                  <span>
                    Your prediction matched! Actual step: <strong className="font-mono text-[#1c1f2b]">{current.predict?.type.toUpperCase()}</strong> ({current.predict?.expectedValue})
                  </span>
                ) : (
                  <span>
                    Your prediction: <strong className="font-mono text-[#dc4a5e] uppercase">{pendingGuess}</strong> · Actual step: <strong className="font-mono text-[#1c1f2b]">{current.predict?.type.toUpperCase()}</strong> ({current.predict?.expectedValue})
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={advanceStep}
              disabled={step >= steps.length - 1}
              className="px-4 py-1.5 rounded-lg bg-[#1c1f2b] text-white text-xs font-medium hover:bg-[#2d3145] disabled:opacity-40 transition-colors cursor-pointer ml-auto"
            >
              {step < steps.length - 1 ? 'Next step →' : 'Trace complete'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(0)}
              className="text-xs text-[#8b90a0] hover:text-[#555a6e] font-medium transition-colors cursor-pointer"
            >
              ↺ Reset
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="px-3 py-1.5 rounded-lg border border-[#d8dae3] bg-white text-[#555a6e] text-xs font-medium hover:bg-[#f0f1f5] disabled:opacity-40 transition-colors cursor-pointer"
              >
                ← Prev
              </button>
              <button
                onClick={advanceStep}
                disabled={step >= steps.length - 1}
                className="px-4 py-1.5 rounded-lg bg-[#1c1f2b] text-white text-xs font-medium hover:bg-[#2d3145] disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
