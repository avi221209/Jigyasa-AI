import React from 'react';

/**
 * ProviderBadge — Renders a prominent fallback warning banner ONLY when
 * fallback mode is active. When live API is connected, renders nothing to keep UI clean.
 */
export default function ProviderBadge({ isFallbackActive, fallbackReason }) {
  if (!isFallbackActive) return null;

  const formattedReason = fallbackReason
    ? (fallbackReason === 'heuristic-fallback' || fallbackReason.includes('Heuristic fallback')
        ? 'API key missing or request failed — using local rule-based heuristic'
        : fallbackReason)
    : '';

  return (
    <div className="mb-5">
      <div className="p-4 rounded-xl border border-[#f59e0b]/40 bg-[#fffbeb] text-[#b45309] flex items-start gap-3 shadow-sm">
        <span className="text-base shrink-0 leading-none mt-0.5">⚡</span>
        <div className="flex-1 text-xs leading-relaxed font-medium">
          <span className="font-bold text-[#92400e]">Running on local heuristic mode</span> — classification is rule-based, not live AI. Add an API key in <code className="font-mono bg-[#fef3c7] px-1.5 py-0.5 rounded text-[#78350f] border border-[#fde68a]">.env</code> for full AI-driven classification.
          {formattedReason && (
            <span className="block mt-1 text-[11px] text-[#b45309]/90 font-mono">
              Reason: {formattedReason}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
