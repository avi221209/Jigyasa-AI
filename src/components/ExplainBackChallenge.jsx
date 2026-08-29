import React, { useState } from 'react';
import { callLLM } from '../lib/llm';
import { parseLLMJsonResponse, buildExplainBackPrompt, runExplainBackFallback } from '../lib/prompts';

/**
 * ExplainBackChallenge — Feynman Technique Challenge Component
 * Prompts the student to explain the concept in their own words to a junior student.
 * Evaluates clarity (Clear / Partially Clear / Unclear) with 1 sentence feedback.
 */
export default function ExplainBackChallenge({ conceptLabel, targetedRemediation }) {
  const [explanation, setExplanation] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!explanation.trim()) {
      setError('Please write a short explanation before submitting.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const prompt = buildExplainBackPrompt(conceptLabel, targetedRemediation, explanation.trim());
      const sysInst = 'You are a CS pedagogy evaluator. Evaluate the clarity of a student explanation. Respond in JSON only.';
      const res = await callLLM(prompt, sysInst);
      if (res.isFallback) {
        setResult(runExplainBackFallback(explanation.trim()));
      } else {
        const parsed = parseLLMJsonResponse(res.text);
        if (parsed && parsed.clarity) {
          setResult(parsed);
        } else {
          setResult(runExplainBackFallback(explanation.trim()));
        }
      }
    } catch (err) {
      setResult(runExplainBackFallback(explanation.trim()));
    } finally {
      setIsLoading(false);
    }
  };

  const clarityStyles = {
    'Clear': { bg: 'bg-[#f0fdf4]', border: 'border-[#bbf7d0]', text: 'text-[#16a34a]', label: '✓ Clear & Accurate' },
    'Partially Clear': { bg: 'bg-[#fef7ed]', border: 'border-[#fed7aa]', text: 'text-[#d97b1e]', label: '⚠ Partially Clear' },
    'Unclear': { bg: 'bg-[#fef2f2]', border: 'border-[#fecaca]', text: 'text-[#dc4a5e]', label: '✗ Needs More Depth' }
  };

  const style = result ? (clarityStyles[result.clarity] || clarityStyles['Partially Clear']) : null;

  return (
    <div className="bg-white rounded-xl border border-[#d8dae3] p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#e8e9ef] pb-2">
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#3b5bdb] text-white">
          Feynman Technique
        </span>
        <h3 className="font-display font-semibold text-xs text-[#1c1f2b] uppercase tracking-wider">
          💬 Explain It Back Challenge (Optional)
        </h3>
      </div>

      <p className="text-[12px] text-[#555a6e] leading-relaxed">
        Explain this concept in your own words, as if teaching a junior student who's never seen recursion:
      </p>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={explanation}
            onChange={(e) => {
              setExplanation(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            disabled={isLoading}
            rows={3}
            placeholder="Imagine you are explaining to a peer: 'Recursion works like a stack of plates where...'"
            className="w-full rounded-lg border border-[#d8dae3] bg-[#f6f7f9] px-3.5 py-2 text-[13px] text-[#1c1f2b] placeholder-[#8b90a0] font-mono focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb] transition-all"
          />
          {error && <p className="text-xs text-[#dc4a5e]">{error}</p>}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isLoading || !explanation.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#3b5bdb] hover:bg-[#2f4ec4] disabled:opacity-40 text-white text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]"
            >
              {isLoading ? 'Evaluating explanation...' : 'Submit Explanation →'}
            </button>
          </div>
        </form>
      ) : (
        <div className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${style.bg} ${style.border}`}>
          <div className="flex items-center justify-between">
            <span className={`font-display font-bold text-xs ${style.text}`}>
              {style.label}
            </span>
            <button
              onClick={() => setResult(null)}
              className="text-[10px] text-[#555a6e] hover:underline cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3b5bdb]"
            >
              Try Again ↺
            </button>
          </div>
          <p className="text-[12px] leading-relaxed text-[#1c1f2b]">
            {result.feedback}
          </p>
        </div>
      )}
    </div>
  );
}
