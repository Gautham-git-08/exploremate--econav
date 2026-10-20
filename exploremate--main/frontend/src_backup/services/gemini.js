/**
 * Google Gemini Service
 * Single place that calls Gemini using import.meta.env.VITE_GEMINI_API_KEY
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Call Gemini API with timeout, proper system instruction / prompt, and friendly error handling.
 */
export async function callGemini({ prompt, systemInstruction = '', temperature = 0.2, timeoutMs = 15000 }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing. Please configure VITE_GEMINI_API_KEY in frontend/.env.');
  }

  const endpoint = `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }]
    }
  ];

  const payload = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 800
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      if (response.status === 429) {
        throw new Error('Gemini rate limit exceeded. Please wait a moment before trying again.');
      } else if (response.status === 400 || response.status === 403) {
        throw new Error(`Gemini authentication / request error: ${errMsg}`);
      }
      throw new Error(`Gemini service error: ${errMsg}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text === undefined || text === null) {
      throw new Error('No response text returned by Gemini.');
    }
    return text.trim();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Gemini request timed out after 15 seconds. Please check your internet connection.');
    }
    throw err;
  }
}

/**
 * Specialised translator helper using Gemini
 */
export async function translateWithGemini({ text, sourceLang = 'auto', targetLang = 'Tamil' }) {
  const systemInstruction = 
    "You are a professional, accurate translator. " +
    "Translate the given text strictly into the target language. " +
    "Return ONLY the plain translated text without any explanation, markdown, prefixes, quotes, or notes. " +
    "Preserve proper nouns, place names, and numerical values accurately.";

  const prompt = `Source language: ${sourceLang}\nTarget language: ${targetLang}\nText to translate:\n${text}`;

  return await callGemini({
    prompt,
    systemInstruction,
    temperature: 0.1,
    timeoutMs: 12000
  });
}
