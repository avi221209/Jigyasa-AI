import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { categories } from '../data/subjects/recursion';
import PrerequisiteMap from './PrerequisiteMap';

/**
 * MisconceptionMap — End-of-session diagnostic profile.
 *
 * Features:
 *   - Cross-round persistence: resolved / persistent / new labels
 *   - Confidence calibration: overconfidence and underconfidence signals
 *   - Session summary export (plain-text clipboard export)
 *   - DSA-framed copy
 *
 * Props:
 *   history   — [{ round, problem, studentAnswer, analysis, confidence, stackPredictions }]
 *   onRestart — () => void
 */
export default function MisconceptionMap({ history, onRestart }) {
  const [copied, setCopied] = useState(false);

  // ─── Aggregate misconception frequency ────────────────────────
  const catIds = Object.keys(categories);
  const catCounts = {};
  catIds.forEach(id => { catCounts[id] = 0; });
  history.forEach(h => {
    if (catCounts[h.analysis.category] !== undefined) catCounts[h.analysis.category]++;
  });

  const barData = catIds.map(id => ({
    name: categories[id].label,
    count: catCounts[id],
    fill: categories[id].color,
  }));

  const radarData = catIds.map(id => ({
    misconception: categories[id].label,
    frequency: catCounts[id] * 33.3,
    fullMark: 100,
  }));

  // ─── Cross-round persistence analysis ─────────────────────────
  // Track which categories appeared in which rounds.
  const categoryByRound = {};
  catIds.forEach(id => { categoryByRound[id] = new Set(); });
  history.forEach(h => {
    categoryByRound[h.analysis.category]?.add(h.round);
  });

  // Classification: resolved / persistent / new / absent
  const persistenceMap = {};
  catIds.forEach(id => {
    const rounds = categoryByRound[id];
    if (rounds.size === 0) {
      persistenceMap[id] = 'absent';
    } else if (rounds.size >= 2) {
      persistenceMap[id] = 'persistent';
    } else {
      const onlyRound = [...rounds][0];
      if (onlyRound <= 2 && !categoryByRound[id].has(3)) {
        persistenceMap[id] = 'resolved';
      } else if (onlyRound === 3) {
        persistenceMap[id] = 'new';
      } else {
        persistenceMap[id] = 'resolved';
      }
    }
  });

  const persistenceStyles = {
    resolved:   { label: 'Resolved', bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
    persistent: { label: 'Persistent', bg: '#fef2f2', text: '#dc4a5e', border: '#fecaca' },
    new:        { label: 'New in R3', bg: '#fef7ed', text: '#d97b1e', border: '#fed7aa' },
    absent:     { label: 'Not observed', bg: '#f0f1f5', text: '#8b90a0', border: '#d8dae3' },
  };

  // ─── Confidence calibration summary ───────────────────────────
  let overconfidentCount = 0;
  let underconfidentCount = 0;
  let calibratedCount = 0;

  history.forEach(h => {
    const isCorrect = h.analysis.category === 'correct-reasoning';
    if (h.confidence === 'high' && !isCorrect) overconfidentCount++;
    else if (h.confidence === 'low' && isCorrect) underconfidentCount++;
    else calibratedCount++;
  });

  const finalCategory = history[history.length - 1]?.analysis?.category;
  const isMastered = finalCategory === 'correct-reasoning';

  // ─── Stack prediction aggregate ───────────────────────────────
  let totalPreds = 0, correctPreds = 0;
  history.forEach(h => {
    if (h.stackPredictions) {
      totalPreds += h.stackPredictions.total;
      correctPreds += h.stackPredictions.correct;
    }
  });

  // ─── Session Summary Plain-Text Export ────────────────────────
  const handleCopySummary = async () => {
    const lines = [
      '=== JIGYASA AI — DIAGNOSTIC SESSION SUMMARY ===',
      'Subject: Recursion & Stack Frames',
      `Diagnostic Status: ${isMastered ? 'RECURSION MODEL VERIFIED' : 'GAPS REMAIN — REVIEW REQUIRED'}`,
      '',
      'ROUND-BY-ROUND ANALYSIS:'
    ];

    history.forEach(h => {
      const cat = categories[h.analysis.category] || {};
      lines.push(`- Round ${h.round}: ${cat.label || h.analysis.category} (Self-rated confidence: ${h.confidence || 'n/a'}) — Problem: "${h.problem.title}"`);
    });

    lines.push('');
    lines.push('CONFIDENCE CALIBRATION RESULTS:');
    lines.push(`- Overconfident (High confidence, incorrect trace): ${overconfidentCount}`);
    lines.push(`- Calibrated (Confidence matched reality): ${calibratedCount}`);
    lines.push(`- Underconfident (Low confidence, correct trace): ${underconfidentCount}`);

    lines.push('');
    lines.push('CROSS-ROUND PERSISTENCE SUMMARY:');
    const resolvedList = catIds.filter(id => persistenceMap[id] === 'resolved').map(id => categories[id].label);
    const persistentList = catIds.filter(id => persistenceMap[id] === 'persistent').map(id => categories[id].label);
    const newList = catIds.filter(id => persistenceMap[id] === 'new').map(id => categories[id].label);

    lines.push(`- Resolved Misconceptions: ${resolvedList.length > 0 ? resolvedList.join(', ') : 'None'}`);
    lines.push(`- Persistent Misconceptions: ${persistentList.length > 0 ? persistentList.join(', ') : 'None'}`);
    lines.push(`- New in Final Round: ${newList.length > 0 ? newList.join(', ') : 'None'}`);

    if (totalPreds > 0) {
      lines.push('');
      lines.push(`STACK PREDICTION ACCURACY: ${correctPreds}/${totalPreds} (${Math.round((correctPreds / totalPreds) * 100)}%)`);
    }

    lines.push('================================================');

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#d8dae3] dark:border-[#2a3449] shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg text-[#1c1f2b] dark:text-[#f1f5f9]">
              Misconception Map
            </h2>
            <p className="text-xs text-[#8b90a0] dark:text-[#94a3b8] mt-0.5">
              3-round diagnostic profile — the kind of self-assessment that separates exam prep from actual understanding.
            </p>
          </div>
          <span
            className="font-mono text-[10px] font-bold px-2.5 py-1 rounded"
            style={{
              backgroundColor: isMastered ? '#dcfce7' : '#fef7ed',
              color: isMastered ? '#16a34a' : '#d97b1e',
              border: `1px solid ${isMastered ? '#bbf7d0' : '#fed7aa'}`
            }}
          >
            {isMastered ? 'RECURSION MODEL VERIFIED' : 'GAPS REMAIN — REVIEW BELOW'}
          </span>
        </div>
      </div>

      {/* Prerequisite Hierarchy Diagram */}
      <PrerequisiteMap history={history} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm p-4">
          <h3 className="font-display text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-3">
            Category frequency (rounds 1–3)
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#8b90a0" fontSize={9} tickLine={false} interval={0} angle={-12} textAnchor="end" />
                <YAxis stroke="#8b90a0" fontSize={9} allowDecimals={false} domain={[0, 3]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#d8dae3', borderRadius: '8px', fontSize: '11px', color: '#1c1f2b', fontFamily: 'Inter' }}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm p-4">
          <h3 className="font-display text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-3">
            Misconception profile
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#d8dae3" />
                <PolarAngleAxis dataKey="misconception" stroke="#8b90a0" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#d8dae3" fontSize={8} />
                <Radar dataKey="frequency" stroke="#3b5bdb" fill="#3b5bdb" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cross-round persistence panel */}
      <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm p-5">
        <h3 className="font-display text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-3">
          Cross-round persistence
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {catIds.filter(id => persistenceMap[id] !== 'absent').map(id => {
            const p = persistenceStyles[persistenceMap[id]];
            return (
              <div
                key={id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs"
                style={{ backgroundColor: p.bg, borderColor: p.border, color: p.text }}
              >
                <span className="font-medium">{categories[id].label}</span>
                <span className="font-mono text-[10px] font-bold uppercase">{p.label}</span>
              </div>
            );
          })}
          {catIds.every(id => persistenceMap[id] === 'absent') && (
            <p className="text-xs text-[#8b90a0] col-span-full">No misconceptions detected across all 3 rounds.</p>
          )}
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-[#8b90a0] font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16a34a]"></span> Resolved = appeared early, gone by R3</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#dc4a5e]"></span> Persistent = recurred across rounds</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#d97b1e]"></span> New = first appeared in R3</span>
        </div>
      </div>

      {/* Confidence calibration panel */}
      <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm p-5">
        <h3 className="font-display text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-3">
          Confidence calibration
        </h3>
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="px-3 py-3 rounded-lg border" style={{ backgroundColor: overconfidentCount > 0 ? '#fef2f2' : '#f6f7f9', borderColor: overconfidentCount > 0 ? '#fecaca' : '#e8e9ef' }}>
            <div className="font-display font-bold text-xl" style={{ color: overconfidentCount > 0 ? '#dc4a5e' : '#8b90a0' }}>{overconfidentCount}</div>
            <div className="text-[10px] font-mono text-[#555a6e] uppercase mt-0.5">Overconfident</div>
            <div className="text-[10px] text-[#8b90a0] mt-1">High confidence, incorrect trace</div>
          </div>
          <div className="px-3 py-3 rounded-lg border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div className="font-display font-bold text-xl text-[#16a34a]">{calibratedCount}</div>
            <div className="text-[10px] font-mono text-[#555a6e] uppercase mt-0.5">Calibrated</div>
            <div className="text-[10px] text-[#8b90a0] mt-1">Confidence matched reality</div>
          </div>
          <div className="px-3 py-3 rounded-lg border" style={{ backgroundColor: underconfidentCount > 0 ? '#eff6ff' : '#f6f7f9', borderColor: underconfidentCount > 0 ? '#bfdbfe' : '#e8e9ef' }}>
            <div className="font-display font-bold text-xl" style={{ color: underconfidentCount > 0 ? '#3b82f6' : '#8b90a0' }}>{underconfidentCount}</div>
            <div className="text-[10px] font-mono text-[#555a6e] uppercase mt-0.5">Underconfident</div>
            <div className="text-[10px] text-[#8b90a0] mt-1">Low confidence, correct trace</div>
          </div>
        </div>
      </div>

      {/* Stack prediction summary */}
      {totalPreds > 0 && (
        <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm px-5 py-4">
          <h3 className="font-display text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-2">
            Predictive stack tracing
          </h3>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-lg text-[#1c1f2b]">
              {correctPreds}/{totalPreds}
            </span>
            <span className="text-xs text-[#555a6e]">
              push/pop operations predicted correctly across all rounds.
              {correctPreds === totalPreds
                ? ' You tracked every stack operation — strong mechanical understanding of LIFO execution.'
                : ` You missed ${totalPreds - correctPreds} operation(s). Review the unwinding phase — return values flow in reverse order.`}
            </span>
          </div>
        </div>
      )}

      {/* Round-by-round timeline */}
      <div className="bg-white rounded-xl border border-[#d8dae3] shadow-sm p-5">
        <h3 className="font-display text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-3">
          Round-by-round timeline
        </h3>
        <div className="space-y-3">
          {history.map((h, idx) => {
            const isSkipped = h.isSkipped || h.analysis?.category === 'skipped';
            const cat = isSkipped
              ? { label: 'Skipped', color: '#64748b' }
              : categories[h.analysis?.category] || { label: h.analysis?.category, color: '#8b90a0' };

            return (
              <div key={idx} className="flex gap-3 items-start p-3 rounded-lg border border-[#e8e9ef] dark:border-[#2a3449] bg-[#f6f7f9] dark:bg-[#0b0f19]">
                <div className="shrink-0">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#1c1f2b] dark:bg-[#2a3449] text-white">
                    R{h.round}
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: isSkipped ? '#f1f5f9' : `${cat.color}15`,
                        color: isSkipped ? '#475569' : cat.color,
                        border: `1px solid ${isSkipped ? '#cbd5e1' : `${cat.color}30`}`
                      }}
                    >
                      {cat.label}
                    </span>
                    {h.confidence && (
                      <span className="text-[10px] text-[#8b90a0] font-mono">
                        self-rated: {h.confidence}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#555a6e] dark:text-[#94a3b8] font-medium">{h.problem.title}</p>
                  <p className="text-[11px] text-[#8b90a0] italic truncate">
                    {isSkipped ? '[Skipped by student]' : `"${h.studentAnswer}"`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 pb-4">
        <button
          onClick={handleCopySummary}
          className="px-5 py-2.5 rounded-lg bg-[#3b5bdb] text-white text-xs font-semibold hover:bg-[#2f4ec4] transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
        >
          {copied ? '✓ Copied!' : '📋 Copy Session Summary'}
        </button>
        <button
          onClick={onRestart}
          className="px-5 py-2.5 rounded-lg bg-[#1c1f2b] text-white text-xs font-medium hover:bg-[#2d3145] transition-colors cursor-pointer"
        >
          ↺ Start new diagnostic session
        </button>
      </div>
    </div>
  );
}
