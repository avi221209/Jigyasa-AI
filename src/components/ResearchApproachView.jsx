import React from 'react';

/**
 * ResearchApproachView — Pedagogy & Research Foundation Reference Page
 *
 * Outlines the pedagogical rationale, theoretical background, five core research citations,
 * and future roadmap for Jigyasa AI.
 */
export default function ResearchApproachView({ onStartPractice, onStartAsk }) {
  const citations = [
    {
      id: 'dann-2001',
      authors: 'Dann, Cooper & Pausch',
      title: 'Using Visualization to Teach Novices Recursion',
      venue: 'ITiCSE (ACM Conference on Innovation and Technology in Computer Science Education)',
      url: 'https://cse.unl.edu/~scooper/alice/p109-dann.pdf',
      connection: 'Establishes recursion as one of the hardest concepts to teach novices, motivating a visualization-based approach that makes execution state explicit. This research directly inspires Jigyasa AI\'s step-by-step Call Stack Visualizer.'
    },
    {
      id: 'chao-2016',
      authors: 'Chao, Feldon & Cohoon',
      title: 'Phenomenological primitives in CS students\' understanding of recursion',
      venue: 'AERA (American Educational Research Association)',
      url: 'https://digitalcommons.usu.edu/itls_facpub/388',
      connection: 'Demonstrates that student understanding fluctuates based on how a problem is framed (e.g., base cases vs. accumulator passes). This finding underpins Jigyasa AI\'s multi-pattern problem bank covering base cases, parameter isolation, tree depth, and tail recursion.'
    },
    {
      id: 'icer-2025',
      authors: 'ICER 2025 Research Team',
      title: 'Misconceptions in Programming: Intuitive Reasoning and Tracing Task Performance Across Experience Levels',
      venue: 'ACM International Computing Education Research Conference (ICER 2025)',
      url: 'https://icer2025.acm.org/details/icer-2025-papers/8/Misconceptions-in-Programming-Intuitive-Reasoning-and-Tracing-Task-Performance-Acros',
      connection: 'Shows that tracing tasks reveal misconceptions directly from student reasoning, and that some misconceptions persist even in experienced students. This supports Jigyasa AI\'s predictive stack tracing and cross-round persistence tracking.'
    },
    {
      id: 'callender-2019',
      authors: 'Callender, Franco-Watkins & Roberts',
      title: 'Improving metacognition in the classroom through instruction, training, and feedback',
      venue: 'Metacognition and Learning',
      url: 'https://scholars.uky.edu/en/publications/improving-metacognition-in-the-classroom-through-instruction-trai/',
      connection: 'Confirms that lower performers tend toward overconfidence while higher performers exhibit underconfidence, and that feedback improves calibration. This directly validates Jigyasa AI\'s self-rated confidence calibration feature.'
    },
    {
      id: 'henley-2021',
      authors: 'Henley et al.',
      title: 'An Inquisitive Code Editor for Addressing Novice Programmers\' Misconceptions',
      venue: 'University of Tennessee / NSF Public Access',
      url: 'https://par.nsf.gov/servlets/purl/10288958',
      connection: 'Proposes prompting students with inquisitive questions about their code\'s runtime behavior to surface hidden misconceptions. This closely parallels Jigyasa AI\'s diagnostic evaluation and "Prove You\'ve Got It" follow-up prompts.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#d8dae3] dark:border-[#2a3449] shadow-sm p-5 space-y-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#059669] text-white">
            Pedagogy & Foundations
          </span>
          <span className="font-mono text-[10px] text-[#8b90a0] dark:text-[#64748b]">
            Reference Guide
          </span>
        </div>
        <h1 className="font-display font-bold text-xl text-[#1c1f2b] dark:text-[#f1f5f9]">
          Research & Pedagogical Approach
        </h1>
        <p className="text-xs text-[#555a6e] dark:text-[#94a3b8] leading-relaxed">
          The learning design behind Jigyasa AI — why we focus on mental model diagnosis over syntax checking, and how computing education research shapes every component.
        </p>
      </div>

      {/* 1. What is Jigyasa AI */}
      <section className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#d8dae3] dark:border-[#2a3449] shadow-sm p-5 space-y-2 transition-colors">
        <h2 className="font-display font-semibold text-sm text-[#1c1f2b] dark:text-[#f1f5f9] flex items-center gap-2">
          <span>🧠</span> What is Jigyasa AI?
        </h2>
        <p className="text-[13px] text-[#555a6e] dark:text-[#94a3b8] leading-relaxed">
          Jigyasa AI is an adaptive CS pedagogy diagnostic engine designed to help novice programmers master recursion and call-stack mechanics. Rather than simply evaluating code output for binary correctness, Jigyasa AI diagnoses the underlying mental model and reasoning behind a student's answer. When a conceptual gap is detected, the tutor automatically adapts its targeted remediation, stack visualizer, and problem progression to address that specific misconception.
        </p>
      </section>

      {/* 2. The Problem */}
      <section className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#d8dae3] dark:border-[#2a3449] shadow-sm p-5 space-y-2 transition-colors">
        <h2 className="font-display font-semibold text-sm text-[#1c1f2b] dark:text-[#f1f5f9] flex items-center gap-2">
          <span>⚠️</span> The Problem in Computing Education
        </h2>
        <p className="text-[13px] text-[#555a6e] dark:text-[#94a3b8] leading-relaxed">
          Recursion is widely recognized as one of the hardest concepts to teach in introductory computer science. Novice programmers frequently display inconsistent mental models, performing accurately on simple linear problems while failing when given branching or accumulator-based problems. Because surface-level correct answers can mask deep conceptual gaps, a single static explanation or isolated practice problem fails to reveal or resolve a student's true learning barrier.
        </p>
      </section>

      {/* 3. Grounded in Research */}
      <section className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#d8dae3] dark:border-[#2a3449] shadow-sm p-5 space-y-4 transition-colors">
        <div>
          <h2 className="font-display font-semibold text-sm text-[#1c1f2b] dark:text-[#f1f5f9] flex items-center gap-2 mb-1">
            <span>📚</span> Grounded in Computing Education Research
          </h2>
          <p className="text-xs text-[#555a6e] dark:text-[#94a3b8]">
            Each architectural component in Jigyasa AI directly maps to findings from peer-reviewed CS education literature:
          </p>
        </div>

        <div className="space-y-3">
          {citations.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg border border-[#e8e9ef] dark:border-[#2a3449] bg-[#f6f7f9] dark:bg-[#0b0f19] space-y-1.5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-bold text-[#059669]">
                  [{idx + 1}] {item.authors}
                </span>
                <span className="font-mono text-[10px] text-[#8b90a0] dark:text-[#64748b]">
                  {item.venue}
                </span>
              </div>
              <h3 className="font-display font-semibold text-[#1c1f2b] dark:text-[#f1f5f9] text-[13px]">
                "{item.title}"
              </h3>
              <p className="text-[12px] text-[#555a6e] dark:text-[#94a3b8] leading-relaxed">
                <strong className="text-[#3b5bdb] dark:text-[#60a5fa]">Feature Connection:</strong> {item.connection}
              </p>
              <div className="pt-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-[#3b5bdb] dark:text-[#60a5fa] hover:underline"
                >
                  🔗 Read Original Paper ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. What's Next */}
      <section className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#d8dae3] dark:border-[#2a3449] shadow-sm p-5 space-y-3 transition-colors">
        <h2 className="font-display font-semibold text-sm text-[#1c1f2b] dark:text-[#f1f5f9] flex items-center gap-2">
          <span>🚀</span> What's Next (Future Roadmap)
        </h2>
        <ul className="space-y-2 text-[12px] text-[#555a6e] dark:text-[#94a3b8] leading-relaxed font-mono">
          <li className="flex items-start gap-2">
            <span className="text-[#059669] font-bold">✓</span>
            <span><strong>Extended Subject Coverage:</strong> Extending Jigyasa AI's subject-agnostic diagnostic architecture to additional DSA domains including Tree Traversals (DFS/BFS), Graph Algorithms, and Dynamic Programming.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#059669] font-bold">✓</span>
            <span><strong>Cross-Session Persistence:</strong> Long-term student progress tracking across sessions with persistent diagnostic profiles and historical misconception decay curves.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#059669] font-bold">✓</span>
            <span><strong>Teacher-Facing Analytics Dashboard:</strong> Instructor portal for classroom-wide misconception aggregation, surfacing common cohort gaps to inform lecture focus areas.</span>
          </li>
        </ul>
      </section>

      {/* Academic References Section */}
      <section className="bg-[#f0f1f5] dark:bg-[#0b0f19] rounded-xl border border-[#d8dae3] dark:border-[#2a3449] p-5 space-y-3 transition-colors">
        <h2 className="font-display font-semibold text-xs text-[#1c1f2b] dark:text-[#f1f5f9] uppercase tracking-wider">
          Academic References
        </h2>
        <ol className="space-y-2.5 font-mono text-[11px] text-[#555a6e] dark:text-[#94a3b8]">
          {citations.map((item, idx) => (
            <li key={item.id} className="leading-relaxed border-b border-[#e8e9ef] dark:border-[#2a3449] pb-2 last:border-0 last:pb-0">
              [{idx + 1}] {item.authors}. ({item.title}). <em>{item.venue}</em>.{' '}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3b5bdb] dark:text-[#60a5fa] hover:underline break-all"
              >
                {item.url}
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* Quick Action Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={onStartPractice}
          className="px-5 py-2.5 rounded-lg bg-[#3b5bdb] hover:bg-[#2f4ec4] text-white text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]"
        >
          Start Practice Mode →
        </button>
        <button
          onClick={onStartAsk}
          className="px-5 py-2.5 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
        >
          Ask a Question →
        </button>
      </div>
    </div>
  );
}
