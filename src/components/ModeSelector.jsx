import React, { useState } from 'react';

/**
 * ModeSelector — Home / Landing Screen Entry Cards
 * Renders Card 1 ("Practice Mode"), Card 2 ("Ask Mode — Diagnose My Understanding"),
 * and a collapsible "Why this works" design rationale panel.
 */
export default function ModeSelector({ onSelectPracticeMode, onSelectAskMode }) {
  const [isRationaleOpen, setIsRationaleOpen] = useState(false);

  return (
    <div className="space-y-6 py-2">
      {/* Hero Welcome */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1c1f2b]">
          Welcome to Jigyasa AI
        </h2>
        <p className="text-xs sm:text-sm text-[#555a6e] max-w-xl mx-auto leading-relaxed">
          An adaptive diagnostic engine for Computer Science & DSA students. Select how you would like to test your mental model:
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Practice Mode */}
        <div className="bg-white rounded-xl border-2 border-[#3b5bdb]/40 hover:border-[#3b5bdb] shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#eef1fa] text-[#3b5bdb] border border-[#d6dcf5]">
                Mode 1
              </span>
              <span className="text-[10px] text-[#8b90a0] font-mono">Guided Practice</span>
            </div>
            <h3 className="font-display font-bold text-base text-[#1c1f2b]">
              Practice Mode
            </h3>
            <p className="text-xs text-[#555a6e] leading-relaxed">
              Work through system-generated CS/DSA recursion trace problems. 3 adaptive rounds with interactive call stack memory tracing and progress tracking.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onSelectPracticeMode}
              className="w-full py-2.5 px-4 rounded-lg bg-[#3b5bdb] hover:bg-[#2f4ec4] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Start Practice Mode →
            </button>
          </div>
        </div>

        {/* Card 2: Ask Mode */}
        <div className="bg-white rounded-xl border-2 border-[#8b5cf6]/40 hover:border-[#8b5cf6] shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#f9f5ff] text-[#8b5cf6] border border-[#e9d5ff]">
                Mode 2
              </span>
              <span className="text-[10px] text-[#8b90a0] font-mono">Custom Input</span>
            </div>
            <h3 className="font-display font-bold text-base text-[#1c1f2b]">
              Ask Mode — Diagnose My Understanding
            </h3>
            <p className="text-xs text-[#555a6e] leading-relaxed">
              Paste any CS/DSA concept, code snippet, or question you're confused about. Jigyasa will analyze your mental model, identify exact gaps, and challenge you to prove your understanding.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onSelectAskMode}
              className="w-full py-2.5 px-4 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Diagnose My Question →
            </button>
          </div>
        </div>
      </div>

      {/* "WHY THIS WORKS" Collapsible Panel */}
      <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm p-4">
        <button
          onClick={() => setIsRationaleOpen(!isRationaleOpen)}
          className="w-full flex items-center justify-between text-xs font-display font-semibold text-[#1c1f2b] hover:text-[#3b5bdb] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#eef1fa] text-[#3b5bdb] border border-[#d6dcf5]">
              Pedagogy
            </span>
            <span>Why this works — Design Rationale</span>
          </div>
          <span className="text-[#8b90a0] font-mono">{isRationaleOpen ? 'Collapse ▴' : 'Expand ▾'}</span>
        </button>

        {isRationaleOpen && (
          <div className="mt-4 pt-3 border-t border-[#e8e9ef] space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 rounded-lg bg-[#f6f7f9] border border-[#e8e9ef]">
              <div className="text-[#dc4a5e] font-medium leading-relaxed">
                Traditional recursion teaching only checks if the final answer is right.
              </div>
              <div className="text-[#16a34a] font-medium leading-relaxed">
                Jigyasa AI classifies the reasoning that produced the answer, not just correctness.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 rounded-lg bg-[#f6f7f9] border border-[#e8e9ef]">
              <div className="text-[#dc4a5e] font-medium leading-relaxed">
                Students don't know what they don't understand.
              </div>
              <div className="text-[#16a34a] font-medium leading-relaxed">
                Confidence calibration surfaces overconfidence and underconfidence as diagnostic signals.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 rounded-lg bg-[#f6f7f9] border border-[#e8e9ef]">
              <div className="text-[#dc4a5e] font-medium leading-relaxed">
                One-time explanations don't confirm understanding stuck.
              </div>
              <div className="text-[#16a34a] font-medium leading-relaxed">
                Cross-round persistence tracking shows whether a misconception actually resolved or just seemed to.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
