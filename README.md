# Jigyasa AI — Adaptive Recursion Tutor

An adaptive diagnostic tutor for CS/DSA students that uncovers, categorizes, and remediates mental model misconceptions in **Recursion** through a 3-round AI-powered tutoring flow and custom question diagnosis.

Built with React 18, Vite, Tailwind CSS v4, and Recharts with a provider-agnostic LLM abstraction.

---

## 🚀 Quick Start (ONE Command)

```bash
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 🎯 Application Modes

Jigyasa AI offers two complementary learning entry points:

### 1. 📘 Practice Mode (System-Guided Adaptive Flow)
- **3 Adaptive Diagnostic Rounds**: Works through system-generated recursion problems (`factorial(3)`, `reverseString("cat")`, `power(2,3)`).
- **Interactive Call Stack Visualizer**: Predict upcoming frame operations (**PUSH ↓** vs **POP ↑**) and observe LIFO unwinding.
- **Misconception Map**: View Bar & Radar charts, cross-round persistence tracking (*Resolved*, *Persistent*, *New*), and confidence calibration metrics.

### 2. ❓ Ask Mode — Diagnose My Understanding (User-Submitted Question Mode)
- **Custom Question & Reasoning**: Paste any CS/DSA code snippet, question, or concept you're confused about, along with what you think is happening.
- **7-Part Diagnostic Breakdown**:
  - **Section A**: Diagnostic Category Badge & Concept Tag Pills (`#recursion`, `#call stack`, `#base case`).
  - **Section B**: `✅ What You Got Right` (highlights precise accurate parts of your reasoning).
  - **Section C**: `🎯 Your Exact Misconception` (pinpoints the exact conceptual gap in CS terminology).
  - **Section D**: `📚 What To Fix` (3-5 sentence targeted remediation).
  - **Section E**: `Confidence Calibration` (*Overconfident*, *Calibrated*, *Underconfident*).
  - **Section F**: `🔁 Prove You've Got It` (interactive mini-round challenge with immediate verdict feedback).
  - **Section G**: Quick Action Buttons (`↺ Ask Another Question` & `Switch to Practice Mode →`).

---

## 🧠 Misconception Classification Concept

Instead of evaluating code for simple syntax correctness, **Jigyasa AI** evaluates the student's **underlying mental model** via free-text reasoning traces. The engine classifies responses into Computer Science pedagogy categories:

1. 🛑 `no-base-case`: Fails to identify the termination condition that prevents a stack overflow.
2. 🔄 `iteration-confusion`: Treats recursive frames like a sequential loop or shared mutable counter instead of isolated stack frames.
3. 🥞 `stack-blindness`: Overlooks how call stack frames pause in memory and unwind in LIFO order upon reaching the base case.
4. ↪️ `return-value-confusion`: Omits return statements in recursive branches, dropping intermediate values.
5. 🔍 `scope-confusion`: Confuses parameter isolation across distinct stack frames.
6. ✅ `correct-reasoning`: Accurately traces stack frame allocation, base case condition, and return value unwinding.
7. 🎯 `guessing`: Surface-level output value provided without explaining the recursive mechanics.

---

## 🛠️ LLM Configuration (`.env`)

Set `VITE_LLM_PROVIDER` to your preferred provider and add its matching API key in `.env`:

```env
# Supported options: "gemini" | "openai" | "anthropic" | "nvidia"
VITE_LLM_PROVIDER="gemini"

# 1. Google Gemini (Free key: https://aistudio.google.com/app/apikey)
VITE_GEMINI_KEY=""

# 2. OpenAI (https://platform.openai.com/api-keys)
VITE_OPENAI_KEY=""

# 3. Anthropic (https://console.anthropic.com/settings/keys)
VITE_ANTHROPIC_KEY=""

# 4. NVIDIA NIM (https://build.nvidia.com/)
VITE_NVIDIA_KEY=""
VITE_NVIDIA_MODEL="deepseek-ai/deepseek-r1"
```

> **Note**: If no API key is provided or if network calls fail, Jigyasa AI automatically runs in **Local Heuristic Fallback Mode** so the app remains 100% functional for offline testing and live presentations.

---

## Architecture

The engine is **subject-agnostic**. All recursion-specific content (problems, misconception categories, classification prompts, stack traces, heuristic classifiers) lives in dedicated data modules:

```
src/data/subjects/recursion.js      ← Practice Mode recursion content & prompts
src/data/subjects/askModePrompts.js  ← Ask Mode JSON prompts & local heuristic classifier
```

### Key Files & Components

| File | Role |
|---|---|
| `src/data/subjects/recursion.js` | Practice Mode problems, categories, prompts, stack traces, heuristics |
| `src/data/subjects/askModePrompts.js` | Ask Mode JSON schemas, prompt builders, and local heuristic fallback |
| `src/lib/llm.js` | Provider-agnostic `callLLM()` — routes to OpenAI / Gemini / Anthropic / NVIDIA NIM via env vars |
| `src/lib/prompts.js` | Parsing utilities (JSON extraction, fallback routing) |
| `src/components/ModeSelector.jsx` | Landing page cards for Practice Mode & Ask Mode |
| `src/components/AskMode/AskInputForm.jsx` | Step 1 custom question input form with validation |
| `src/components/AskMode/AskAnalysisView.jsx` | Step 2 diagnosis view (Sections A–G) with follow-up challenge |
| `src/components/AskMode/AskModeFlow.jsx` | Ask Mode parent state machine and API orchestration |

---

## 🌐 Netlify Deployment

Preconfigured via `netlify.toml`:

```bash
npx netlify-cli deploy --prod
```

Or connect the Git repository to Netlify:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Environment variables**: Add `VITE_LLM_PROVIDER` and your API key (e.g., `VITE_GEMINI_KEY`) in Netlify Site Settings.
