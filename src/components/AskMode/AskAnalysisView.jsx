import React, { useState } from 'react';
import { ASK_MODE_CATEGORIES } from '../../data/subjects/askModePrompts';

/**
 * AskAnalysisView — Step 2 of Ask Mode
 * Displays Sections A through G:
 * - Diagnostic Badge & Concept Tags (Section A)
 * - What You Got Right (Section B)
 * - Exact Misconception Gap (Section C)
 * - Targeted Remediation (Section D)
 * - Confidence Calibration (Section E)
 * - Follow-Up Challenge (Section F)
 * - Action Buttons Row (Section G)
 */
export default function AskAnalysisView({
  userQuestion,
  userReasoning,
  confidenceLevel,
  analysisResult,
  onFollowUpSubmit,
  followUpVerdict,
  isFollowUpLoading,
  onEditInputs,
  onResetAskMode,
  onSwitchToPracticeMode
}) {
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpError, setFollowUpError] = useState('');

  const catKey = analysisResult.misconceptionCategory || 'other';
  const catMeta = ASK_MODE_CATEGORIES[catKey] || ASK_MODE_CATEGORIES['other'];
  const catLabel = analysisResult.categoryLabel || catMeta.label;
  const catColor = catMeta.color;

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!followUpAnswer.trim()) {
      setFollowUpError('Please write your follow-up answer.');
      return;
    }
    setFollowUpError('');
    onFollowUpSubmit(followUpAnswer.trim());
  };

  // Calibration badge styles
  const calibrationStyles = {
    overconfident: { label: 'Overconfident', bg: '#fef2f2', text: '#dc4a5e', border: '#fecaca' },
    underconfident: { label: 'Underconfident', bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' },
    calibrated: { label: 'Calibrated', bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' }
  };

  const calAssessment = (analysisResult.confidenceAssessment || 'calibrated').toLowerCase();
  const calStyle = calibrationStyles[calAssessment] || calibrationStyles.calibrated;

  return (
    <div className="space-y-4">
      {/* Back to Edit Input Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onEditInputs}
          className="text-xs text-[#3b5bdb] hover:underline font-medium flex items-center gap-1 cursor-pointer"
        >
          ← Edit Question & Reasoning
        </button>
        <span className="font-mono text-[10px] text-[#8b90a0] uppercase tracking-wider">
          Diagnostic Report
        </span>
      </div>

      {/* User Submission Context Summary */}
      <div className="rounded-xl border border-[#e8e9ef] bg-[#f6f7f9] p-4 text-xs space-y-2">
        <div>
          <span className="font-mono text-[10px] text-[#8b90a0] uppercase font-bold">Your Question/Code:</span>
          <p className="font-mono text-[12px] text-[#1c1f2b] bg-white p-2.5 rounded border border-[#e8e9ef] mt-1 whitespace-pre-wrap">
            {userQuestion}
          </p>
        </div>
        <div>
          <span className="font-mono text-[10px] text-[#8b90a0] uppercase font-bold">Your Stated Reasoning:</span>
          <p className="text-[12px] text-[#555a6e] italic bg-white p-2.5 rounded border border-[#e8e9ef] mt-1">
            "{userReasoning}"
          </p>
        </div>
      </div>

      {/* SECTION A — Diagnostic Badge & Concept Tags */}
      <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e9ef] pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono text-[11px] font-bold px-2.5 py-1 rounded"
              style={{ backgroundColor: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
            >
              {catLabel}
            </span>
          </div>
          <span className="text-[10px] text-[#8b90a0] font-mono">
            Self-Rated Confidence: {confidenceLevel}
          </span>
        </div>

        {/* Concept Tag Pills */}
        {analysisResult.conceptTags && analysisResult.conceptTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-[#8b90a0] mr-1">Concepts:</span>
            {analysisResult.conceptTags.map((tag, idx) => (
              <span
                key={idx}
                className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#f0f1f5] text-[#555a6e] border border-[#e8e9ef]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SECTION B — What You Got Right */}
      {analysisResult.whatStudentGotRight && (
        <div className="bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] p-4">
          <h3 className="font-display text-xs font-semibold text-[#15803d] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            ✅ What You Got Right
          </h3>
          <p className="text-[13px] text-[#166534] leading-relaxed">
            {analysisResult.whatStudentGotRight}
          </p>
        </div>
      )}

      {/* SECTION C — Exact Misconception Gap */}
      {analysisResult.exactGap && (
        <div className="bg-[#fef2f2] rounded-xl border border-[#fecaca] p-4">
          <h3 className="font-display text-xs font-semibold text-[#dc4a5e] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            🎯 Your Exact Misconception
          </h3>
          <p className="text-[13px] text-[#9f1239] leading-relaxed font-medium">
            {analysisResult.exactGap}
          </p>
        </div>
      )}

      {/* SECTION D — Targeted Remediation */}
      {analysisResult.targetedRemediation && (
        <div className="bg-[#eff6ff] rounded-xl border border-[#bfdbfe] p-4">
          <h3 className="font-display text-xs font-semibold text-[#1d4ed8] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            📚 What To Fix
          </h3>
          <p className="text-[13px] text-[#1e40af] leading-relaxed">
            {analysisResult.targetedRemediation}
          </p>
        </div>
      )}

      {/* SECTION E — Confidence Calibration */}
      {analysisResult.confidenceAssessment && analysisResult.confidenceAssessment !== 'n/a' && catKey !== 'off-topic' && (
        <div
          className="rounded-xl border p-4 text-xs"
          style={{ backgroundColor: calStyle.bg, borderColor: calStyle.border, color: calStyle.text }}
        >
          <span className="font-display font-semibold uppercase tracking-wider block text-xs mb-1">
            Confidence Calibration: {calStyle.label}
          </span>
          <p className="text-[12px] opacity-90 leading-relaxed" style={{ color: '#1c1f2b' }}>
            {analysisResult.confidenceNote || `Your self-rated confidence was ${calStyle.label.toLowerCase()}.`}
          </p>
        </div>
      )}

      {/* SECTION F — Follow-Up Challenge */}
      {analysisResult.followUpQuestion && (
        <div className="bg-white rounded-xl border border-[#8b5cf6]/40 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#e8e9ef] pb-2">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#8b5cf6] text-white">
              Challenge
            </span>
            <h3 className="font-display font-semibold text-xs text-[#1c1f2b] uppercase tracking-wider">
              🔁 Prove You've Got It
            </h3>
          </div>

          <p className="text-[13px] text-[#2a44a8] font-medium bg-[#eef1fa] p-3 rounded-lg border border-[#d6dcf5] leading-relaxed">
            {analysisResult.followUpQuestion}
          </p>

          {!followUpVerdict ? (
            <form onSubmit={handleFollowUpSubmit} className="space-y-2 pt-1">
              <label htmlFor="follow-up-input" className="block text-xs font-medium text-[#555a6e]">
                Your answer:
              </label>
              <textarea
                id="follow-up-input"
                value={followUpAnswer}
                onChange={(e) => {
                  setFollowUpAnswer(e.target.value);
                  if (e.target.value.trim()) setFollowUpError('');
                }}
                disabled={isFollowUpLoading}
                rows={3}
                placeholder="Type your explanation to prove you corrected the gap..."
                className="w-full rounded-lg border border-[#d8dae3] bg-[#f6f7f9] px-3.5 py-2 text-[13px] text-[#1c1f2b] placeholder-[#8b90a0] font-mono focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] transition-all"
              />
              {followUpError && <p className="text-xs text-[#dc4a5e]">{followUpError}</p>}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isFollowUpLoading || !followUpAnswer.trim()}
                  className="px-5 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  {isFollowUpLoading ? 'Evaluating your follow-up...' : 'Check My Answer →'}
                </button>
              </div>
            </form>
          ) : (
            <div
              className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                followUpVerdict.corrected
                  ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
                  : 'bg-[#fef7ed] border-[#fed7aa] text-[#b5680e]'
              }`}
            >
              <span className="font-display font-bold text-xs block">
                {followUpVerdict.corrected ? '✓ Corrected — Excellent Progress!' : '⚠ Gap Still Present'}
              </span>
              <p className="text-[12px] leading-relaxed text-[#1c1f2b]">
                {followUpVerdict.verdict}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION G — Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e8e9ef]">
        <button
          onClick={onResetAskMode}
          className="px-4 py-2 rounded-lg border border-[#d8dae3] bg-white text-[#555a6e] hover:bg-[#f0f1f5] text-xs font-medium transition-colors cursor-pointer"
        >
          ↺ Ask Another Question
        </button>

        <button
          onClick={onSwitchToPracticeMode}
          className="px-5 py-2 rounded-lg bg-[#3b5bdb] hover:bg-[#2f4ec4] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
        >
          Switch to Practice Mode →
        </button>
      </div>
    </div>
  );
}
