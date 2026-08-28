import React from 'react';

/**
 * PrerequisiteMap — Concept Prerequisite Diagram Component
 * Renders a 4-node progression chain:
 * Base Case → Stack Frames → Return Propagation → Recursion Mastery
 * Highlights the node corresponding to the student's current/persistent misconception.
 */
export default function PrerequisiteMap({ history = [] }) {
  // Determine focus node based on session history
  let activeIndex = 1; // Default to Stage 2 (Stack Frames) if unknown

  if (history && history.length > 0) {
    const lastCat = history[history.length - 1]?.analysis?.category;
    
    // Count frequencies
    const counts = {};
    history.forEach(h => {
      const cat = h.analysis?.category;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });

    // Find most frequent non-correct misconception
    let topCat = lastCat;
    let maxCount = 0;
    Object.keys(counts).forEach(cat => {
      if (cat !== 'correct-reasoning' && counts[cat] > maxCount) {
        maxCount = counts[cat];
        topCat = cat;
      }
    });

    switch (topCat) {
      case 'no-base-case':
      case 'off-by-one':
        activeIndex = 0;
        break;
      case 'stack-blindness':
      case 'iteration-confusion':
      case 'scope-confusion':
      case 'guessing':
        activeIndex = 1;
        break;
      case 'return-value-confusion':
        activeIndex = 2;
        break;
      case 'correct-reasoning':
        activeIndex = 3;
        break;
      default:
        activeIndex = 1;
    }
  }

  const nodes = [
    {
      step: 1,
      title: 'Base Case',
      sub: 'Exit condition & non-recursive termination',
      categoryKey: 'no-base-case'
    },
    {
      step: 2,
      title: 'Stack Frames',
      sub: 'Isolated frame allocation per call in memory',
      categoryKey: 'stack-blindness'
    },
    {
      step: 3,
      title: 'Return Propagation',
      sub: 'LIFO stack unwinding & value passback',
      categoryKey: 'return-value-confusion'
    },
    {
      step: 4,
      title: 'Recursion Mastery',
      sub: 'Full mental model of branching call trees',
      categoryKey: 'correct-reasoning'
    }
  ];

  return (
    <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#d8dae3] dark:border-[#2a3449] p-4 space-y-3 shadow-sm transition-colors">
      <div className="flex items-center justify-between border-b border-[#e8e9ef] dark:border-[#2a3449] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#3b5bdb] text-white">
            Pedagogy Map
          </span>
          <h3 className="font-display font-semibold text-xs text-[#1c1f2b] dark:text-[#f1f5f9] uppercase tracking-wider">
            Concept Prerequisite Hierarchy
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#8b90a0] dark:text-[#64748b]">
          Linear Learning Path
        </span>
      </div>

      <p className="text-[11px] text-[#555a6e] dark:text-[#94a3b8]">
        DSA recursion mastery builds sequentially. The highlighted step represents your primary diagnostic focus:
      </p>

      {/* Prerequisite Node Chain */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
        {nodes.map((node, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;

          return (
            <div
              key={node.step}
              className={`relative flex flex-col justify-between p-3 rounded-lg border text-xs transition-all ${
                isActive
                  ? 'bg-[#eef1fa] dark:bg-[#3b5bdb]/20 border-[#3b5bdb] shadow-sm ring-2 ring-[#3b5bdb]/40'
                  : isPassed
                  ? 'bg-[#f0fdf4] dark:bg-[#064e3b]/20 border-[#bbf7d0] dark:border-[#065f46] text-[#16a34a]'
                  : 'bg-[#f6f7f9] dark:bg-[#0b0f19] border-[#e8e9ef] dark:border-[#2a3449] text-[#8b90a0] opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-[#3b5bdb] text-white' :
                    isPassed ? 'bg-[#16a34a] text-white' :
                    'bg-[#d8dae3] dark:bg-[#2a3449] text-[#555a6e] dark:text-[#94a3b8]'
                  }`}>
                    Step {node.step}
                  </span>
                  {isActive && (
                    <span className="font-mono text-[9px] font-bold text-[#3b5bdb] dark:text-[#60a5fa] uppercase tracking-wider">
                      🎯 Focus
                    </span>
                  )}
                  {isPassed && (
                    <span className="font-mono text-[9px] text-[#16a34a] dark:text-[#34d399]">
                      ✓ Mastered
                    </span>
                  )}
                </div>
                <h4 className={`font-display font-semibold text-xs mt-1 ${
                  isActive ? 'text-[#1c1f2b] dark:text-white font-bold' :
                  isPassed ? 'text-[#15803d] dark:text-[#34d399]' :
                  'text-[#555a6e] dark:text-[#94a3b8]'
                }`}>
                  {node.title}
                </h4>
                <p className="text-[10px] text-[#555a6e] dark:text-[#94a3b8] mt-1 leading-snug">
                  {node.sub}
                </p>
              </div>

              {/* Step indicator arrow for desktop */}
              {idx < nodes.length - 1 && (
                <div className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-[#8b90a0]">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
