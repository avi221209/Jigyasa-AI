import React, { useState } from 'react';
import AskInputForm from './AskInputForm';
import AskAnalysisView from './AskAnalysisView';
import {
  buildAskModePrompt,
  buildFollowUpPrompt,
  ASK_MODE_SYSTEM_INSTRUCTION,
  runAskModeFallback,
  ASK_MODE_CATEGORIES
} from '../../data/subjects/askModePrompts';
import { callLLM } from '../../lib/llm';
import { parseLLMJsonResponse } from '../../lib/prompts';
import { sanitizeUserErrorMessage } from '../../lib/security';

/**
 * AskModeFlow — Parent Container for Ask Mode
 * Manages Step 1 (Input) and Step 2 (Analysis & Challenge), API calls,
 * mode-specific fallback routing via callLLM, and state resets.
 */
export default function AskModeFlow({ onSwitchToPracticeMode, onUpdateFallbackInfo }) {
  const [step, setStep] = useState(1); // 1 = Input, 2 = Analysis

  const [userQuestion, setUserQuestion] = useState('');
  const [userReasoning, setUserReasoning] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('medium');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your mental model...');
  const [analysisResult, setAnalysisResult] = useState(null);

  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [followUpVerdict, setFollowUpVerdict] = useState(null);

  /**
   * Normalize LLM / Fallback JSON response to guarantee all expected fields exist
   */
  const normalizeAnalysisResponse = (parsed) => {
    if (!parsed || typeof parsed !== 'object') {
      parsed = {};
    }

    const categoryKey = parsed.misconceptionCategory || parsed.category || parsed.categoryKey || 'other';

    if (categoryKey === 'off-topic') {
      return {
        misconceptionCategory: 'off-topic',
        categoryLabel: parsed.categoryLabel || 'Off-Topic Question',
        whatStudentGotRight: '',
        exactGap: '',
        targetedRemediation: parsed.targetedRemediation || 'Jigyasa AI is focused specifically on recursion and call-stack mechanics. Try asking about a recursive function, base cases, or how the call stack works — for example: "why does my recursive function never stop?"',
        followUpQuestion: null,
        confidenceAssessment: 'n/a',
        confidenceNote: '',
        conceptTags: []
      };
    }

    const catMeta = ASK_MODE_CATEGORIES[categoryKey] || ASK_MODE_CATEGORIES['other'];

    return {
      misconceptionCategory: categoryKey,
      categoryLabel: parsed.categoryLabel || parsed.label || catMeta.label,
      whatStudentGotRight: parsed.whatStudentGotRight || parsed.gotRight || parsed.correctPart || 'You attempted to trace the problem systematically step by step.',
      exactGap: parsed.exactGap || parsed.gap || parsed.error || 'The trace does not fully account for how memory call frames pause and return values propagate in LIFO order.',
      targetedRemediation: parsed.targetedRemediation || parsed.remediation || parsed.explanation || 'Focus on tracing each stack frame: what value enters, what expression the frame is blocked on, and in what order returns unwind.',
      followUpQuestion: parsed.followUpQuestion || parsed.followUp || 'Explain how return values unwind back up the stack.',
      confidenceAssessment: (parsed.confidenceAssessment || parsed.calibration || 'calibrated').toLowerCase(),
      confidenceNote: parsed.confidenceNote || 'Your confidence rating was evaluated against your reasoning quality.',
      conceptTags: Array.isArray(parsed.conceptTags) && parsed.conceptTags.length > 0 ? parsed.conceptTags : ['recursion', 'call stack']
    };
  };

  /**
   * Submit main Ask Mode question + reasoning for AI diagnosis
   */
  const handleAskSubmit = async ({ question, reasoning, confidence }) => {
    setUserQuestion(question);
    setUserReasoning(reasoning);
    setConfidenceLevel(confidence);
    setIsLoading(true);
    setLoadingMessage('Analyzing your mental model...');

    const prompt = buildAskModePrompt(question, reasoning, confidence);

    // Mode-specific fallback function passed into callLLM
    const askFallbackFn = (_prompt, reason) => {
      console.log(`[AskModeFallback] reason: ${reason}`);
      const fallbackData = runAskModeFallback(question, reasoning, confidence);
      return {
        text: JSON.stringify({
          ...fallbackData,
          targetedRemediation: fallbackData.targetedRemediation
        }),
        isFallback: true,
        provider: 'heuristic-fallback'
      };
    };

    try {
      const response = await callLLM(prompt, ASK_MODE_SYSTEM_INSTRUCTION, askFallbackFn);
      
      if (onUpdateFallbackInfo) {
        onUpdateFallbackInfo(response.isFallback, response.isFallback ? `Heuristic fallback (${response.provider})` : '');
      }

      const parsed = parseLLMJsonResponse(response.text);
      const normalized = normalizeAnalysisResponse(parsed);
      setAnalysisResult(normalized);
      setStep(2);
    } catch (err) {
      console.error('[AskMode] LLM call failed:', err);
      const safeErrorMsg = sanitizeUserErrorMessage(err);
      if (onUpdateFallbackInfo) {
        onUpdateFallbackInfo(true, safeErrorMsg);
      }
      const fallbackResponse = askFallbackFn(prompt, safeErrorMsg);
      const parsed = parseLLMJsonResponse(fallbackResponse.text);
      setAnalysisResult(normalizeAnalysisResponse(parsed));
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submit follow-up challenge answer for evaluation
   */
  const handleFollowUpSubmit = async (followUpAnswer) => {
    setIsFollowUpLoading(true);
    const exactGap = analysisResult?.exactGap || 'conceptual error in recursive call stack trace';
    const followUpQ = analysisResult?.followUpQuestion || 'Explain how stack frames unwind.';

    const prompt = buildFollowUpPrompt(userQuestion, userReasoning, exactGap, followUpQ, followUpAnswer);
    const systemInstruction = `You are Jigyasa AI CS pedagogy evaluator. Respond in JSON only: { "corrected": boolean, "verdict": "string" }`;

    const followUpFallbackFn = (_prompt, reason) => {
      console.log(`[AskModeFollowUpFallback] reason: ${reason}`);
      return {
        text: JSON.stringify({
          corrected: true,
          verdict: 'Your follow-up answer demonstrates clear improvement in describing call stack mechanics.'
        }),
        isFallback: true,
        provider: 'heuristic-fallback'
      };
    };

    try {
      const response = await callLLM(prompt, systemInstruction, followUpFallbackFn);
      const parsed = parseLLMJsonResponse(response.text);

      const isCorrected = typeof parsed.corrected === 'boolean' ? parsed.corrected : true;
      const verdictText = parsed.verdict || parsed.explanation || 'Your follow-up answer addresses the core memory mechanics and clarifies the previous gap.';

      setFollowUpVerdict({
        corrected: isCorrected,
        verdict: verdictText
      });
    } catch (err) {
      console.error('[AskMode] Follow-up evaluation error:', err);
      const fallbackResponse = followUpFallbackFn(prompt, 'Error evaluating follow-up');
      const parsed = parseLLMJsonResponse(fallbackResponse.text);
      setFollowUpVerdict({
        corrected: parsed.corrected,
        verdict: parsed.verdict
      });
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  /**
   * Return to Step 1 while preserving inputs for editing
   */
  const handleEditInputs = () => {
    setStep(1);
  };

  /**
   * Full reset of Ask Mode state to start a new question
   */
  const handleResetAskMode = () => {
    setStep(1);
    setUserQuestion('');
    setUserReasoning('');
    setConfidenceLevel('medium');
    setAnalysisResult(null);
    setFollowUpVerdict(null);
  };

  return (
    <div>
      {/* Loading Overlay State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-[#8b5cf6]/30 shadow-sm p-8 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-3 border-[#8b5cf6] border-t-transparent animate-spin mx-auto"></div>
          <p className="font-display text-sm font-semibold text-[#1c1f2b]">
            {loadingMessage}
          </p>
          <p className="text-xs text-[#8b90a0]">
            Classifying your mental model against CS pedagogy patterns...
          </p>
        </div>
      )}

      {!isLoading && step === 1 && (
        <AskInputForm
          initialQuestion={userQuestion}
          initialReasoning={userReasoning}
          initialConfidence={confidenceLevel}
          onSubmit={handleAskSubmit}
          isLoading={isLoading}
        />
      )}

      {!isLoading && step === 2 && analysisResult && (
        <AskAnalysisView
          userQuestion={userQuestion}
          userReasoning={userReasoning}
          confidenceLevel={confidenceLevel}
          analysisResult={analysisResult}
          onFollowUpSubmit={handleFollowUpSubmit}
          followUpVerdict={followUpVerdict}
          isFollowUpLoading={isFollowUpLoading}
          onEditInputs={handleEditInputs}
          onResetAskMode={handleResetAskMode}
          onSwitchToPracticeMode={onSwitchToPracticeMode}
        />
      )}
    </div>
  );
}
