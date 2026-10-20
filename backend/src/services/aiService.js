// All AI features live here: tutor chat, quiz generation and subject (curriculum) generation.
//
// FREE-TIER FRIENDLY: the app can use several free LLM providers and automatically falls back
// to the next one when a free quota is exhausted:
//     Gemini (Google AI Studio)  ->  Groq (Llama)  ->  OpenRouter (free models)
// You only need ONE key to run the project; adding more keys makes it more reliable.
// We call every provider with plain fetch (Node 18+), so there is no SDK to install.
const AppError = require("../utils/AppError");

const MOCK = () => process.env.AI_MOCK === "true";
const list = (v, fallback) => (v || fallback).split(",").map((s) => s.trim()).filter(Boolean);
const TIMEOUT_MS = 45000;

// ---------------------------------------------------------------------------
// Providers. `messages` is always [{ role: "user" | "assistant", content }].
// Each adapter returns { ok: true, text } or { ok: false, status, detail }.
// ---------------------------------------------------------------------------
async function fetchJSON(url, options) {
  let res;
  try {
    res = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return { ok: false, status: 504, detail: "timeout / network error" };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, detail: data?.error?.message || data?.message || "" };
  return { ok: true, data };
}

// --- Google Gemini (free tier via Google AI Studio) ---
async function geminiAdapter(p, model, { system, messages, json, temperature }) {
  const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const body = {
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { temperature, maxOutputTokens: 8192, ...(json ? { responseMimeType: "application/json" } : {}) },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const r = await fetchJSON(`${base}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": p.key() },
    body: JSON.stringify(body),
  });
  if (!r.ok) return r;
  const text = (r.data?.candidates?.[0]?.content?.parts || []).map((x) => x.text || "").join("");
  return text.trim() ? { ok: true, text } : { ok: false, status: 502, detail: "empty answer" };
}

// --- OpenAI-compatible providers: Groq and OpenRouter (both have free tiers) ---
async function openAIAdapter(p, model, { system, messages, json, temperature }) {
  const send = (useJsonMode) =>
    fetchJSON(`${p.base()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key()}`, ...(p.headers ? p.headers() : {}) },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: 4096,
        messages: [...(system ? [{ role: "system", content: system }] : []), ...messages],
        ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

  let r = await send(json && p.jsonMode);
  if (!r.ok && r.status === 400 && json && p.jsonMode) r = await send(false); // model without JSON mode -> retry normally
  if (!r.ok) return r;
  const text = r.data?.choices?.[0]?.message?.content || "";
  return text.trim() ? { ok: true, text } : { ok: false, status: 502, detail: "empty answer" };
}

const PROVIDERS = {
  gemini: {
    name: "gemini", adapter: geminiAdapter,
    key: () => process.env.GEMINI_API_KEY,
    models: () => list(process.env.GEMINI_MODELS, "gemini-flash-latest,gemini-2.5-flash"),
  },
  groq: {
    name: "groq", adapter: openAIAdapter, jsonMode: true,
    key: () => process.env.GROQ_API_KEY,
    base: () => process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    models: () => list(process.env.GROQ_MODELS, "llama-3.3-70b-versatile,llama-3.1-8b-instant"),
  },
  openrouter: {
    name: "openrouter", adapter: openAIAdapter, jsonMode: false,
    key: () => process.env.OPENROUTER_API_KEY,
    base: () => process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    // "openrouter/free" automatically picks a currently-available free model. Model ids change often,
    // so keep this configurable.
    models: () => list(process.env.OPENROUTER_MODELS, "openrouter/free"),
    headers: () => ({ "HTTP-Referer": (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0], "X-Title": "DevRecall" }),
  },
};

const activeProviders = () =>
  list(process.env.AI_PROVIDERS, "gemini,groq,openrouter").map((n) => PROVIDERS[n]).filter((p) => p && p.key());

// ---------------------------------------------------------------------------
// callLLM: try every configured provider/model until one answers.
// ---------------------------------------------------------------------------
async function callLLM({ system, messages, json = false, temperature = 0.7 }) {
  const providers = activeProviders();
  if (!providers.length)
    throw new AppError(503, "AI is not configured yet. Add at least one free API key (GEMINI_API_KEY, GROQ_API_KEY or OPENROUTER_API_KEY) in backend/.env");

  let sawQuota = false, badKeys = 0, timeouts = 0;

  for (const p of providers) {
    for (const model of p.models()) {
      const r = await p.adapter(p, model, { system, messages, json, temperature });
      if (r.ok) {
        if (process.env.AI_DEBUG === "true") console.log(`🤖 AI answered via ${p.name}/${model}`);
        return r.text;
      }
      console.warn(`AI ${p.name}/${model} -> ${r.status} ${String(r.detail).slice(0, 110)}`);
      if (r.status === 401 || r.status === 403) { badKeys++; break; } // bad key: skip this provider's other models
      if (r.status === 429) sawQuota = true;
      if (r.status === 504) timeouts++;
      // 404 (model retired), 429 (quota), 5xx -> continue with next model / next provider
    }
  }

  if (badKeys === providers.length) throw new AppError(502, "Your AI API key is invalid or not allowed. Check the keys in backend/.env");
  if (sawQuota) throw new AppError(429, "The free AI quota is used up for now. Please wait a minute and try again.");
  if (timeouts) throw new AppError(504, "AI took too long to respond. Please try again.");
  throw new AppError(502, "AI service is unavailable right now. Please try again.");
}

function parseJSON(text) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new AppError(502, "AI sent an unreadable response. Please try again.");
  }
}

// Ask for JSON; free models sometimes wrap it in text, so we parse leniently and retry once.
async function askJSON({ system, prompt, temperature }) {
  const args = { system, messages: [{ role: "user", content: prompt }], json: true, temperature };
  try {
    return parseJSON(await callLLM(args));
  } catch (e) {
    if (e.status === 502 && /unreadable/.test(e.message)) return parseJSON(await callLLM(args));
    throw e;
  }
}

// ---------- helpers ----------
const topicContext = (subject, topic) =>
  `Subject: ${subject.name}\nTopic: ${topic.title}\nSummary: ${topic.summary}\nKey points:\n${topic.keyPoints.map((k) => `- ${k}`).join("\n")}`;

const subjectContext = (subject) =>
  `Subject: ${subject.name}\nTopics:\n${subject.topics.map((t) => `- ${t.title}: ${t.summary}`).join("\n")}`;

function shuffleOptions(q) {
  const correct = q.options[q.answerIndex];
  const opts = [...q.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { ...q, options: opts, answerIndex: opts.indexOf(correct) };
}

// ---------- 1) Tutor chat ----------
async function chatReply({ message, history = [], subject, topic }) {
  if (MOCK()) return `**[mock reply]** You asked: "${message}". Set AI_MOCK=false and add a free API key for real answers.`;

  let context = "";
  if (subject && topic) context = `\n\nThe student is currently studying:\n${topicContext(subject, topic)}`;
  else if (subject) context = `\n\nThe student is currently studying:\n${subjectContext(subject)}`;

  const system =
    "You are DevRecall AI Tutor, a friendly mentor for developers and computer science students preparing for exams and interviews. " +
    "Explain clearly with simple words and a short example or code block when useful. Keep answers under about 250 words unless the student asks for more. " +
    "Use Markdown. If the student writes in Hinglish (Hindi in English letters), reply in simple Hinglish; otherwise reply in simple English. " +
    "If the question is not related to programming, computer science or tech careers, politely steer the student back to studying." +
    context;

  const past = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (past.length && past[0].role !== "user") past.shift(); // conversations must start with the user

  return callLLM({ system, messages: [...past, { role: "user", content: message }], temperature: 0.6 });
}

// ---------- 2) Quiz generation ----------
async function generateQuiz({ subject, topic }) {
  const count = topic ? 5 : 8;

  if (MOCK()) {
    const base = topic ? topic.keyPoints : subject.topics.map((t) => t.title);
    return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
      question: `[mock] Which statement about "${topic ? topic.title : subject.name}" is correct? (#${i + 1})`,
      options: [base[i % base.length], "It is never used in practice", "It only works in Java", "None of the above"],
      answerIndex: 0,
      explanation: "Mock explanation.",
    })).map(shuffleOptions);
  }

  const prompt =
    `Create ${count} multiple-choice questions to test a student's understanding.\n\n` +
    (topic ? topicContext(subject, topic) : subjectContext(subject)) +
    `\n\nRules:\n- Mix conceptual questions with a few "what is the output / which is correct" questions.\n` +
    `- Exactly 4 options per question and exactly one correct option.\n- Keep each question under 40 words.\n` +
    `- Explanation: 1-2 sentences on why the answer is correct.\n` +
    `Return ONLY JSON in this shape:\n{"questions":[{"question":"...","options":["...","...","...","..."],"answerIndex":0,"explanation":"..."}]}`;

  const data = await askJSON({ system: "You are an exam setter for computer science courses. Output valid JSON only.", prompt, temperature: 0.8 });

  const valid = (Array.isArray(data.questions) ? data.questions : []).filter(
    (q) =>
      q && typeof q.question === "string" && Array.isArray(q.options) && q.options.length === 4 &&
      q.options.every((o) => typeof o === "string" && o.trim()) &&
      Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex <= 3
  );
  if (valid.length < 3) throw new AppError(502, "AI could not prepare a proper quiz. Please try again.");

  return valid.slice(0, count).map((q) => shuffleOptions({
    question: q.question.trim(), options: q.options.map((o) => o.trim()), answerIndex: q.answerIndex,
    explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
  }));
}

// ---------- 3) Subject / curriculum generation (any language or subject the user types) ----------
async function generateSubject(name, options = {}) {
  const count = Math.min(Math.max(Number(options.topicCount) || 15, 6), 25);
  const focus = options.focus || "Full Comprehensive Course (Beginner to Production Architecture)";

  if (MOCK()) {
    return {
      name, icon: "📘", description: `[mock] Comprehensive curriculum for ${name}`,
      topics: Array.from({ length: count }, (_, i) => ({
        title: `${name} Master Topic ${i + 1}`,
        summary: "Detailed mock summary explaining core mechanics.",
        keyPoints: ["Point A", "Point B", "Point C", "Point D"],
        example: null,
        interviewQuestions: [{ question: `What is ${name} Topic ${i + 1}?`, answer: "Mock answer" }],
        references: [{ title: `${name} Docs`, url: "https://example.com" }],
      })),
    };
  }

  const prompt =
    `You are a Principal Software Architect and Computer Science Dean designing a career-defining, placement-grade course.\n` +
    `Course Subject: "${name}".\n` +
    `Focus: ${focus}.\n` +
    `If this is NOT a valid computer science, software engineering, programming, or tech subject, return {"error":"not_technical"}.\n\n` +
    `Generate an exhaustive curriculum containing EXACTLY ${count} high-value topics ordered logically from essential fundamentals to advanced production patterns.\n` +
    `For each topic, provide:\n` +
    `- "title": string (clear, professional, e.g. "Virtual DOM & Fiber Reconciliation" or "B+ Tree Indexing Mechanics")\n` +
    `- "summary": string (3-4 sentences explaining what it is, how it functions internally, and why interviewers ask it)\n` +
    `- "keyPoints": array of 4-5 strings (crisp bullet points with concrete facts, edge cases, and algorithmic complexities)\n` +
    `- "example": {"language":"<code-lang>","code":"<clean, runnable snippet up to 12 lines>"} or null\n` +
    `- "interviewQuestions": array of 2 objects [{"question":"...","answer":"..."}] testing real interview depth\n` +
    `- "references": array of 2 objects [{"title":"...","url":"..."}] pointing to official documentation or resources\n\n` +
    `Also provide an appropriate emoji "icon" and a compelling "description" under 160 characters.\n` +
    `Return ONLY valid JSON in this exact structure:\n` +
    `{"name":"${name}","icon":"📘","description":"...","topics":[{"title":"...","summary":"...","keyPoints":["..."],"example":{"language":"...","code":"..."},"interviewQuestions":[{"question":"...","answer":"..."}],"references":[{"title":"...","url":"..."}]}]}`;

  const data = await askJSON({
    system: "You are a master technical curriculum architect. Output valid JSON only.",
    prompt,
    temperature: 0.4,
  });

  if (data.error === "not_technical") {
    throw new AppError(400, "Please enter a valid programming, IT, or computer science subject (e.g. Docker, React, Rust, Kubernetes, System Design).");
  }

  const topics = (Array.isArray(data.topics) ? data.topics : [])
    .filter((t) => t && typeof t.title === "string" && typeof t.summary === "string" && Array.isArray(t.keyPoints))
    .map((t) => ({
      title: t.title.trim(),
      summary: t.summary.trim(),
      keyPoints: t.keyPoints.filter((k) => typeof k === "string").slice(0, 6),
      example: t.example && typeof t.example.code === "string" ? { language: String(t.example.language || ""), code: t.example.code } : undefined,
      interviewQuestions: Array.isArray(t.interviewQuestions)
        ? t.interviewQuestions.filter((q) => q && q.question && q.answer).map((q) => ({ question: q.question.trim(), answer: q.answer.trim() }))
        : [],
      references: Array.isArray(t.references)
        ? t.references.filter((r) => r && r.title && r.url).map((r) => ({ title: r.title.trim(), url: r.url.trim() }))
        : [],
    }));

  if (topics.length < 3) throw new AppError(502, "AI could not generate enough course topics. Please try again.");

  return {
    name,
    icon: (typeof data.icon === "string" && data.icon.trim().slice(0, 4)) || "📘",
    description: String(data.description || "").slice(0, 160),
    topics: topics.slice(0, count + 2),
  };
}

// Generate additional advanced topics to append to an existing subject
async function generateAdditionalTopics({ subjectName, existingTopicTitles = [], count = 5 }) {
  if (MOCK()) {
    return Array.from({ length: count }, (_, i) => ({
      title: `${subjectName} Advanced Topic ${existingTopicTitles.length + i + 1}`,
      summary: "Mock summary for newly appended topic.",
      keyPoints: ["Advanced concept", "Production optimization", "Edge case"],
      example: null,
      interviewQuestions: [{ question: "Mock question?", answer: "Mock answer" }],
      references: [{ title: "Official Docs", url: "https://example.com" }],
    }));
  }

  const prompt =
    `A student is taking an advanced course on "${subjectName}".\n` +
    `The course already has the following topics:\n${existingTopicTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n` +
    `Generate ${count} NEW, non-duplicate, advanced production-level topics that take this curriculum to the next level (covering advanced architecture, internals, scaling, security, or tricky edge cases).\n` +
    `For each topic, provide title, summary, keyPoints, example, interviewQuestions (2), and references (2).\n` +
    `Return ONLY valid JSON in this shape:\n` +
    `{"topics":[{"title":"...","summary":"...","keyPoints":["..."],"example":{"language":"...","code":"..."},"interviewQuestions":[{"question":"...","answer":"..."}],"references":[{"title":"...","url":"..."}]}]}`;

  const data = await askJSON({
    system: "You are a principal engineer creating advanced curricula. Output valid JSON only.",
    prompt,
    temperature: 0.5,
  });

  const topics = (Array.isArray(data.topics) ? data.topics : [])
    .filter((t) => t && typeof t.title === "string" && typeof t.summary === "string" && Array.isArray(t.keyPoints))
    .map((t) => ({
      title: t.title.trim(),
      summary: t.summary.trim(),
      keyPoints: t.keyPoints.filter((k) => typeof k === "string").slice(0, 6),
      example: t.example && typeof t.example.code === "string" ? { language: String(t.example.language || ""), code: t.example.code } : undefined,
      interviewQuestions: Array.isArray(t.interviewQuestions)
        ? t.interviewQuestions.filter((q) => q && q.question && q.answer).map((q) => ({ question: q.question.trim(), answer: q.answer.trim() }))
        : [],
      references: Array.isArray(t.references)
        ? t.references.filter((r) => r && r.title && r.url).map((r) => ({ title: r.title.trim(), url: r.url.trim() }))
        : [],
    }));

  return topics.slice(0, count);
}

// ---------- 4) Generate More Interview Questions on-the-fly for any topic ----------
async function generateTopicQuestions({ subjectName, topicTitle, topicSummary }) {
  if (MOCK()) {
    return [
      { question: `Mock interview question about ${topicTitle}?`, answer: "Mock answer explanation for testing." },
      { question: `What is a common edge case in ${topicTitle}?`, answer: "Mock edge case explanation." },
    ];
  }

  const prompt =
    `You are a Senior Tech Lead conducting technical interviews for FAANG / top tech companies.\n` +
    `Generate 5 high-yield, frequently asked interview questions on "${topicTitle}" in the subject "${subjectName}".\n` +
    `Include a mix of:\n` +
    `1. Deep conceptual questions ("How does it work under the hood?")\n` +
    `2. Code analysis / output tracing or tricky edge cases\n` +
    `3. Real-world architecture trade-offs & performance gotchas\n\n` +
    `For each question, provide an authoritative, detailed answer (2-4 sentences) that an interviewer expects to hear.\n` +
    `Return ONLY valid JSON in this shape:\n` +
    `{"questions":[{"question":"...","answer":"..."}]}`;

  const data = await askJSON({
    system: "You are a principal staff engineer. Provide accurate technical interview questions. Output valid JSON only.",
    prompt,
    temperature: 0.6,
  });

  const valid = (Array.isArray(data.questions) ? data.questions : [])
    .filter((q) => q && typeof q.question === "string" && typeof q.answer === "string" && q.question.trim() && q.answer.trim())
    .map((q) => ({ question: q.question.trim(), answer: q.answer.trim() }));

  if (valid.length === 0) throw new AppError(502, "Could not generate interview questions. Please try again.");
  return valid;
}

// ---------- 5) Generate Comprehensive Deep Dive Lecture Notes on-the-fly ----------
async function generateTopicDeepDive({ subjectName, topicTitle, topicSummary, keyPoints = [] }) {
  if (MOCK()) {
    return `### Comprehensive Guide: ${topicTitle}\n\n[Mock deep dive notes for offline testing.]`;
  }

  const prompt =
    `Write a comprehensive, in-depth technical study guide on "${topicTitle}" in "${subjectName}".\n` +
    `Summary context: ${topicSummary || ""}\n` +
    `Key points: ${keyPoints.join(", ")}\n\n` +
    `Structure the guide with the following Markdown sections:\n` +
    `1. ### 🔍 Core Mechanics & Under The Hood (How it actually works internally in memory / engine / kernel)\n` +
    `2. ### ⚡ Real-World Industry Application & Code Pattern\n` +
    `3. ### ⚠️ Critical Edge Cases, Traps & Common Anti-Patterns\n` +
    `4. ### 📊 Performance & Complexity Trade-offs\n` +
    `5. ### 🎯 Senior Interview Advice (What senior interviewers look for)\n\n` +
    `Write in clean, clear Markdown with code snippets where helpful. Be detailed, authoritative, and educational (approx 450-650 words).`;

  return callLLM({
    system: "You are a distinguished CS professor and tech author writing textbook-quality deep dive guides. Output clean Markdown only.",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
  });
}

// ---------- 6) Generate Market-Tested Interview Questions directly ----------
async function generateMarketQuestions({
  subjectName,
  topicTitle = "General Core & Advanced Concepts",
  role = "Fullstack / Backend SDE",
  company = "Tier-1 / FAANG / Product Companies",
  difficulty = "Senior / Placement Level",
  count = 5,
}) {
  if (MOCK()) {
    return [
      {
        question: `How does ${subjectName} optimize performance under high-concurrency workloads?`,
        answer: "By using non-blocking I/O, resource pooling, and efficient caching strategies.",
      },
      {
        question: `What are the most common memory leak scenarios in ${subjectName}?`,
        answer: "Retained closures, uncleaned global listeners, and circular object references.",
      },
    ];
  }

  const prompt =
    `You are a Lead Technical Interviewer and Hiring Bar Raiser at ${company} hiring for a ${role} (${difficulty}).\n` +
    `Generate ${count} real-world, high-frequency technical interview questions for "${subjectName}"` +
    (topicTitle ? ` focusing on "${topicTitle}".\n` : `.\n`) +
    `Requirements:\n` +
    `1. Focus on modern, practical industry interview questions (architecture internals, edge cases, system design traps, tricky output analysis).\n` +
    `2. Avoid generic textbook trivia. Ask what top companies actually ask candidates today.\n` +
    `3. For each question, provide an authoritative, comprehensive model answer (3-5 sentences) that demonstrates senior technical mastery.\n\n` +
    `Return ONLY a JSON object in this format:\n` +
    `{\n` +
    `  "questions": [\n` +
    `    {\n` +
    `      "question": "Exact interview question...",\n` +
    `      "answer": "Expected comprehensive technical answer...",\n` +
    `      "topicTitle": "${topicTitle || subjectName}"\n` +
    `    }\n` +
    `  ]\n` +
    `}`;

  const data = await askJSON({
    system: "You are an elite software engineering interviewer at top tech companies. Output valid JSON only.",
    prompt,
    temperature: 0.6,
  });

  const valid = (Array.isArray(data.questions) ? data.questions : [])
    .filter((q) => q && typeof q.question === "string" && typeof q.answer === "string" && q.question.trim() && q.answer.trim())
    .map((q) => ({
      question: q.question.trim(),
      answer: q.answer.trim(),
      topicTitle: q.topicTitle?.trim() || topicTitle || "Core Concepts",
    }));

  if (valid.length === 0) throw new AppError(502, "Could not generate interview questions. Please try again.");
  return valid;
}

module.exports = {
  chatReply,
  generateQuiz,
  generateSubject,
  generateTopicQuestions,
  generateTopicDeepDive,
  generateAdditionalTopics,
  generateMarketQuestions,
};


