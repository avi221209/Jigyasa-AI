import React, { useState } from 'react';
import ModeSelector from './components/ModeSelector';
import QuestionCard from './components/QuestionCard';
import FeedbackCard from './components/FeedbackCard';
import MisconceptionMap from './components/MisconceptionMap';
import AskModeFlow from './components/AskMode/AskModeFlow';
import ProviderBadge from './components/ProviderBadge';

// Subject data — recursion content
import {
  subjectMeta,
  initialProblem,
  problemBank,
  buildClassificationPrompt,
} from './data/subjects/recursion';

// Subject-agnostic utilities
import { parseLLMJsonResponse } from './lib/prompts';
import { callLLM } from './lib/llm';
import { resetRateLimiter } from './lib/rateLimiter';
import { validateStudentInput, validateConfidenceLevel, sanitizeUserErrorMessage } from './lib/security';

const TOTAL_ROUNDS = 3;

export default function App() {
  // Mode selection: 'select' | 'practice' | 'ask'
  const [appMode, setAppMode] = useState('select');

  // Theme & Accessibility State
  const [theme, setTheme] = useState(() => localStorage.getItem('jigyasa_theme') || 'light');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('jigyasa_font_size') || 'md');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('jigyasa_theme', next);
  };

  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('jigyasa_font_size', size);
  };

  // Practice Mode state
  const [round, setRound] = useState(1);
  const [currentProblem, setCurrentProblem] = useState(initialProblem);
  const [history, setHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentConfidence, setCurrentConfidence] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Shared Provider Badge / Fallback Info
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');

  // ─── Mode Switching Helpers ────────────────────────────────
  const handleSelectPracticeMode = () => {
    handleRestartPracticeMode();
    setAppMode('practice');
  };

  const handleSelectAskMode = () => {
    setAppMode('ask');
  };

  const handleSelectHome = () => {
    setAppMode('select');
  };

  const handleUpdateFallbackInfo = (fallbackActive, reason) => {
    setIsFallbackActive(fallbackActive);
    setFallbackReason(reason);
  };

  // ─── Practice Mode Handlers ────────────────────────────────
  const handleAnswerSubmit = async (answer, confidence) => {
    const inputVal = validateStudentInput(answer);
    if (!inputVal.valid) {
      console.warn('[App] Rejected invalid input:', inputVal.error);
      return;
    }
    if (!validateConfidenceLevel(confidence)) {
      console.warn('[App] Invalid confidence level:', confidence);
      return;
    }

    const sanitizedAnswer = inputVal.sanitized;
    setCurrentAnswer(sanitizedAnswer);
    setCurrentConfidence(confidence);
    setIsLoading(true);

    const prompt = buildClassificationPrompt(currentProblem, sanitizedAnswer, confidence);
    const systemInstruction = `You are a DSA recursion diagnostic classifier for an engineering CS course. Classify student mental models into JSON. Be specific — reference exact phrases from the student's answer. Never use generic praise.`;

    try {
      const response = await callLLM(prompt, systemInstruction);
      setIsFallbackActive(response.isFallback);
      setFallbackReason(response.isFallback ? `Heuristic fallback (${response.provider})` : '');

      const parsed = parseLLMJsonResponse(response.text);
      setAnalysisResult(parsed);
    } catch (err) {
      const safeMsg = sanitizeUserErrorMessage(err);
      setAnalysisResult({
        category: 'stack-blindness',
        confidence: 0.7,
        explanation: 'The response did not clearly trace stack frame creation and LIFO unwinding. Classification fell back to stack-blindness as the default diagnostic.',
        targetedRemediation: 'Trace each frame explicitly: what value of n enters, what expression the frame is blocked on, and in what order return values flow back.',
        nextFocusArea: 'Stack frame trace with return values.'
      });
      setIsFallbackActive(true);
      setFallbackReason(safeMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextRound = (stackPredictions = null) => {
    const entry = {
      round,
      problem: currentProblem,
      studentAnswer: currentAnswer,
      confidence: currentConfidence,
      analysis: analysisResult,
      stackPredictions,
    };

    const newHistory = [...history, entry];
    setHistory(newHistory);

    if (round >= TOTAL_ROUNDS) {
      setIsCompleted(true);
      return;
    }

    const category = analysisResult?.category || 'stack-blindness';
    const bankProblems = problemBank[category] || problemBank['stack-blindness'];
    const nextIdx = (round - 1) % bankProblems.length;
    const nextProblem = bankProblems[nextIdx] || bankProblems[0];

    setRound(r => r + 1);
    setCurrentProblem(nextProblem);
    setAnalysisResult(null);
    setCurrentAnswer('');
    setCurrentConfidence(null);
  };

  const handleSkipProblem = () => {
    const skipEntry = {
      round,
      problem: currentProblem,
      studentAnswer: '[Skipped]',
      confidence: null,
      analysis: {
        category: 'skipped',
        confidence: 0,
        explanation: 'This problem was skipped by the student during the diagnostic input stage.',
        targetedRemediation: 'No misconception classified for skipped rounds.',
        nextFocusArea: 'Skipped'
      },
      isSkipped: true,
      stackPredictions: null
    };

    const newHistory = [...history, skipEntry];
    setHistory(newHistory);

    if (round >= TOTAL_ROUNDS) {
      setIsCompleted(true);
      return;
    }

    const defaultBank = problemBank['stack-blindness'];
    const nextIdx = (round - 1) % defaultBank.length;
    const nextProblem = defaultBank[nextIdx] || defaultBank[0];

    setRound(r => r + 1);
    setCurrentProblem(nextProblem);
    setAnalysisResult(null);
    setCurrentAnswer('');
    setCurrentConfidence(null);
  };

  const handleRestartPracticeMode = () => {
    resetRateLimiter();
    setRound(1);
    setCurrentProblem(initialProblem);
    setHistory([]);
    setAnalysisResult(null);
    setCurrentAnswer('');
    setCurrentConfidence(null);
    setIsCompleted(false);
    setIsFallbackActive(false);
    setFallbackReason('');
  };

  const fontScaleStyle = {
    fontSize: fontSize === 'sm' ? '14px' : fontSize === 'lg' ? '18px' : '16px'
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
        theme === 'dark' ? 'dark bg-[#0b0f19] text-[#f1f5f9]' : 'bg-[#f6f7f9] text-[#1c1f2b]'
      }`}
      style={fontScaleStyle}
    >
      {/* Header */}
      <header className="border-b border-[#e8e9ef] dark:border-[#2a3449] bg-white/80 dark:bg-[#151c2c]/80 backdrop-blur-sm sticky top-0 z-50 transition-colors">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectHome}
              className="font-display font-bold text-base text-[#1c1f2b] dark:text-[#f1f5f9] hover:opacity-80 transition-opacity flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]"
            >
              Jigyasa AI
              <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded bg-[#eef1fa] dark:bg-[#2a3449] text-[#3b5bdb] dark:text-[#60a5fa] border border-[#d6dcf5] dark:border-[#3b5bdb]/40">
                {subjectMeta.name}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Selector Navigation Pills */}
            <div className="flex items-center gap-1.5 bg-[#f0f1f5] dark:bg-[#0b0f19] p-1 rounded-lg border border-[#e8e9ef] dark:border-[#2a3449]">
              <button
                onClick={handleSelectHome}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b5bdb] ${
                  appMode === 'select'
                    ? 'bg-white dark:bg-[#2a3449] text-[#1c1f2b] dark:text-[#f1f5f9] shadow-sm font-semibold'
                    : 'text-[#555a6e] dark:text-[#94a3b8] hover:text-[#1c1f2b]'
                }`}
              >
                Home
              </button>
              <button
                onClick={handleSelectPracticeMode}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b5bdb] ${
                  appMode === 'practice'
                    ? 'bg-[#3b5bdb] text-white shadow-sm font-semibold'
                    : 'text-[#555a6e] dark:text-[#94a3b8] hover:text-[#1c1f2b]'
                }`}
              >
                Practice Mode
              </button>
              <button
                onClick={handleSelectAskMode}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b5bdb] ${
                  appMode === 'ask'
                    ? 'bg-[#8b5cf6] text-white shadow-sm font-semibold'
                    : 'text-[#555a6e] dark:text-[#94a3b8] hover:text-[#1c1f2b]'
                }`}
              >
                Ask Mode
              </button>
            </div>

            {/* Theme & Accessibility Controls */}
            <div className="flex items-center gap-1">
              {/* Font Size Controls */}
              <div className="flex items-center bg-[#f0f1f5] dark:bg-[#0b0f19] p-0.5 rounded-lg border border-[#e8e9ef] dark:border-[#2a3449] font-mono text-[10px]">
                <button
                  onClick={() => changeFontSize('sm')}
                  aria-label="Small Font Size"
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b5bdb] ${
                    fontSize === 'sm'
                      ? 'bg-white dark:bg-[#2a3449] font-bold shadow-xs text-[#1c1f2b] dark:text-[#f1f5f9]'
                      : 'text-[#8b90a0] dark:text-[#64748b] hover:text-[#1c1f2b]'
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => changeFontSize('md')}
                  aria-label="Medium Font Size"
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b5bdb] ${
                    fontSize === 'md'
                      ? 'bg-white dark:bg-[#2a3449] font-bold shadow-xs text-[#1c1f2b] dark:text-[#f1f5f9]'
                      : 'text-[#8b90a0] dark:text-[#64748b] hover:text-[#1c1f2b]'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => changeFontSize('lg')}
                  aria-label="Large Font Size"
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b5bdb] ${
                    fontSize === 'lg'
                      ? 'bg-white dark:bg-[#2a3449] font-bold shadow-xs text-[#1c1f2b] dark:text-[#f1f5f9]'
                      : 'text-[#8b90a0] dark:text-[#64748b] hover:text-[#1c1f2b]'
                  }`}
                >
                  A+
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Dark Mode"
                className="p-1.5 rounded-lg bg-[#f0f1f5] dark:bg-[#0b0f19] border border-[#e8e9ef] dark:border-[#2a3449] text-xs transition-colors hover:opacity-80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5">
        {/* Global Fallback Transparency & Provider Status */}
        <ProviderBadge isFallbackActive={isFallbackActive} fallbackReason={fallbackReason} />

        {/* View Routing */}
        {appMode === 'select' && (
          <ModeSelector
            onSelectPracticeMode={handleSelectPracticeMode}
            onSelectAskMode={handleSelectAskMode}
          />
        )}

        {appMode === 'ask' && (
          <AskModeFlow
            onSwitchToPracticeMode={handleSelectPracticeMode}
            onUpdateFallbackInfo={handleUpdateFallbackInfo}
          />
        )}

        {appMode === 'practice' && (
          <div>
            {isCompleted ? (
              <MisconceptionMap history={history} onRestart={handleRestartPracticeMode} />
            ) : !analysisResult ? (
              <QuestionCard
                round={round}
                totalRounds={TOTAL_ROUNDS}
                problem={currentProblem}
                onSubmitAnswer={handleAnswerSubmit}
                onSkipProblem={handleSkipProblem}
                isLoading={isLoading}
                subjectMeta={subjectMeta}
              />
            ) : (
              <FeedbackCard
                round={round}
                totalRounds={TOTAL_ROUNDS}
                problem={currentProblem}
                analysisResult={analysisResult}
                studentConfidence={currentConfidence}
                onNextRound={handleNextRound}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e9ef] py-3 text-center">
        <div className="max-w-3xl mx-auto px-4 flex justify-between text-[10px] text-[#8b90a0] font-mono">
          <span>jigyasa-ai v2</span>
          <span>{subjectMeta.domain} · {subjectMeta.name}</span>
        </div>
      </footer>
    </div>
  );
}
