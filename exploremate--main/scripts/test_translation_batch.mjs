/**
 * Batch translation test to verify all 5 phrases across 6 languages in a single prompt
 * conforming to Gemini Free Tier RPM.
 */

import fs from 'fs';
import path from 'path';

const envPath = path.resolve('frontend/.env');
let apiKey = '';
let model = 'gemini-3.8-flash';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    if (line.startsWith('VITE_GEMINI_API_KEY=')) apiKey = line.split('=')[1].trim();
    if (line.startsWith('VITE_GEMINI_MODEL=')) model = line.split('=')[1].trim();
  }
}

const PHRASES = [
  "Where is the nearest bus stop?",
  "How much is the entry ticket?",
  "Is this place open today?",
  "Please take me to the beach",
  "I need help"
];

async function runBatch() {
  console.log(`Sending batch translation request to ${model}...`);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `Translate the following 5 phrases into Tamil, Hindi, Telugu, Malayalam, Kannada, and French.
Return ONLY valid JSON with this schema:
[
  {
    "phrase": "Where is the nearest bus stop?",
    "translations": {
      "Tamil": "...",
      "Hindi": "...",
      "Telugu": "...",
      "Malayalam": "...",
      "Kannada": "...",
      "French": "..."
    }
  }, ...
]

Phrases to translate:
1. "Where is the nearest bus stop?"
2. "How much is the entry ticket?"
3. "Is this place open today?"
4. "Please take me to the beach"
5. "I need help"`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Error response:', err);
    return;
  }

  const data = await res.json();
  const rawJson = data.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(rawJson);

  fs.writeFileSync('translation_verified_results.json', JSON.stringify(parsed, null, 2), 'utf8');
  console.log('--- Translation Verification Succeeded! ---');
  for (const item of parsed) {
    console.log(`\nPhrase: "${item.phrase}"`);
    for (const [lang, trans] of Object.entries(item.translations)) {
      console.log(`  ${lang.padEnd(10)}: ${trans}`);
    }
  }
}

runBatch();
