/**
 * LLM Abstraction Layer for Jigyasa AI
 * ====================================
 * Single function callLLM(prompt, systemInstruction, fallbackFn) that dynamically targets:
 * - OpenAI (gpt-4o-mini)
 * - Gemini (gemini-3.6-flash)
 * - Anthropic (claude-3-5-haiku)
 * - NVIDIA NIM (OpenAI-compatible endpoints e.g. deepseek-ai/deepseek-r1)
 *
 * Integrated with:
 * - Client-side Rate Limiter & Exponential Backoff (src/lib/rateLimiter.js)
 * - Security Error Sanitizer (src/lib/security.js)
 * - Custom Fallback Routing per Mode / Subject
 */

import { runHeuristicFallback } from './prompts';
import { checkRateLimit, recordRequestSuccess, recordRequestFailure } from './rateLimiter';
import { sanitizeUserErrorMessage } from './security';

export async function callLLM(prompt, systemInstruction = '', fallbackFn = null) {
  const provider = (import.meta.env.VITE_LLM_PROVIDER || 'gemini').toLowerCase().trim();
  const openaiKey = import.meta.env.VITE_OPENAI_KEY || '';
  const geminiKey = import.meta.env.VITE_GEMINI_KEY || '';
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_KEY || '';
  const nvidiaKey = import.meta.env.VITE_NVIDIA_KEY || '';
  const nvidiaModel = import.meta.env.VITE_NVIDIA_MODEL || 'deepseek-ai/deepseek-r1';

  // Helper to execute mode-specific fallback or default to Practice Mode heuristic fallback
  const getFallback = (p, reason) => {
    if (typeof fallbackFn === 'function') {
      return fallbackFn(p, reason);
    }
    return runHeuristicFallback(p, reason);
  };

  // 1. Rate limiting check
  const rateLimitStatus = checkRateLimit();
  if (!rateLimitStatus.allowed) {
    console.warn(`[callLLM] Rate limit block: ${rateLimitStatus.reason}`);
    return getFallback(prompt, rateLimitStatus.reason);
  }

  console.log(`[callLLM] Dispatching request to provider: "${provider}"`);

  let result;
  try {
    if (provider === 'openai') {
      if (!openaiKey) {
        return getFallback(prompt, 'OpenAI key not configured in .env');
      }
      result = await callOpenAI(prompt, systemInstruction, openaiKey);
    } else if (provider === 'anthropic') {
      if (!anthropicKey) {
        return getFallback(prompt, 'Anthropic key not configured in .env');
      }
      result = await callAnthropic(prompt, systemInstruction, anthropicKey);
    } else if (provider === 'gemini') {
      if (!geminiKey) {
        return getFallback(prompt, 'Gemini key not configured in .env');
      }
      result = await callGemini(prompt, systemInstruction, geminiKey);
    } else if (provider === 'nvidia') {
      if (!nvidiaKey) {
        return getFallback(prompt, 'NVIDIA key not configured in .env');
      }
      result = await callNvidia(prompt, systemInstruction, nvidiaKey, nvidiaModel);
    } else {
      return getFallback(prompt, `Unknown provider: ${provider}`);
    }

    // Success -> record in rate limiter
    recordRequestSuccess();
    return result;
  } catch (error) {
    // Failure -> record exponential backoff, sanitize error, fallback
    recordRequestFailure();
    const safeErrorMsg = sanitizeUserErrorMessage(error);
    return getFallback(prompt, safeErrorMsg);
  }
}

/**
 * Call OpenAI Chat Completions API
 */
async function callOpenAI(prompt, systemInstruction, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemInstruction || 'You are an expert Computer Science recursion tutor.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API returned status ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return { text: content, isFallback: false, provider: 'openai' };
}

/**
 * Call NVIDIA NIM API (OpenAI-compatible chat/completions)
 */
async function callNvidia(prompt, systemInstruction, apiKey, modelName) {
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemInstruction || 'You are an expert Computer Science recursion tutor.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`NVIDIA NIM API returned status ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return { text: content, isFallback: false, provider: 'nvidia' };
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt, systemInstruction, apiKey) {
  const models = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errBody = await response.text();
        // If rate limited or model error, try next model candidate before failing
        lastError = new Error(`Gemini API (${model}) returned status ${response.status}: ${errBody}`);
        if (response.status === 429 || response.status === 404) {
          console.warn(`[callGemini] Model ${model} returned ${response.status}. Attempting fallback model...`);
          continue;
        }
        throw lastError;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { text: text, isFallback: false, provider: 'gemini' };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Gemini API call failed across all candidate models.');
}

/**
 * Call Anthropic Claude Messages API
 */
async function callAnthropic(prompt, systemInstruction, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      system: systemInstruction || 'You are an expert Computer Science recursion tutor.',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic API returned status ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  return { text: text, isFallback: false, provider: 'anthropic' };
}

/**
 * Get current provider info for UI display
 */
export function getProviderInfo() {
  const provider = (import.meta.env.VITE_LLM_PROVIDER || 'gemini').toLowerCase().trim();
  const openaiKey = import.meta.env.VITE_OPENAI_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_KEY;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_KEY;
  const nvidiaKey = import.meta.env.VITE_NVIDIA_KEY;
  const nvidiaModel = import.meta.env.VITE_NVIDIA_MODEL || 'deepseek-ai/deepseek-r1';

  let hasKey = false;
  let keyName = 'VITE_GEMINI_KEY';

  if (provider === 'openai') {
    hasKey = Boolean(openaiKey);
    keyName = 'VITE_OPENAI_KEY';
  } else if (provider === 'gemini') {
    hasKey = Boolean(geminiKey);
    keyName = 'VITE_GEMINI_KEY';
  } else if (provider === 'anthropic') {
    hasKey = Boolean(anthropicKey);
    keyName = 'VITE_ANTHROPIC_KEY';
  } else if (provider === 'nvidia') {
    hasKey = Boolean(nvidiaKey);
    keyName = 'VITE_NVIDIA_KEY';
  }

  return {
    provider,
    hasKey,
    keyName,
    nvidiaModel
  };
}
