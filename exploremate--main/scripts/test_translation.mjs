/**
 * Automated test script to verify Gemini translation across required languages and phrases.
 * Languages: English, Tamil, Hindi, Telugu, Malayalam, Kannada, French
 * Phrases:
 * 1. "Where is the nearest bus stop?"
 * 2. "How much is the entry ticket?"
 * 3. "Is this place open today?"
 * 4. "Please take me to the beach"
 * 5. "I need help"
 */

import fs from 'fs';
import path from 'path';

// Read API key from frontend/.env
const envPath = path.resolve('frontend/.env');
let apiKey = '';
let model = 'gemini-3.8-flash';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    if (line.startsWith('VITE_GEMINI_API_KEY=')) {
      apiKey = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_GEMINI_MODEL=')) {
      model = line.split('=')[1].trim();
    }
  }
}

console.log(`Using model: ${model}, API Key present: ${Boolean(apiKey)}`);

const PHRASES = [
  "Where is the nearest bus stop?",
  "How much is the entry ticket?",
  "Is this place open today?",
  "Please take me to the beach",
  "I need help"
];

const TARGET_LANGUAGES = [
  { name: 'Tamil', code: 'ta' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Telugu', code: 'te' },
  { name: 'Malayalam', code: 'ml' },
  { name: 'Kannada', code: 'kn' },
  { name: 'French', code: 'fr' }
];

async function translateText(text, targetLang) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      role: 'user',
      parts: [{
        text: `Translate the following text strictly into ${targetLang}. Return ONLY the direct translation, with no explanation, no quotation marks, and no markdown:\n\n${text}`
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 200
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HTTP ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

async function runTests() {
  const results = [];
  console.log('--- Starting Translation Verification Tests ---');

  for (const phrase of PHRASES) {
    console.log(`\nOriginal: "${phrase}"`);
    const phraseResults = { original: phrase, translations: {} };

    for (const lang of TARGET_LANGUAGES) {
      try {
        const translated = await translateText(phrase, lang.name);
        console.log(`  [${lang.name}]: ${translated}`);
        phraseResults.translations[lang.name] = { success: true, text: translated };
      } catch (err) {
        console.error(`  [${lang.name}] Error: ${err.message}`);
        phraseResults.translations[lang.name] = { success: false, error: err.message };
      }
      // Small pause between requests to respect rate limits
      await new Promise(r => setTimeout(r, 600));
    }
    results.push(phraseResults);
  }

  fs.writeFileSync('translation_test_results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\n--- All translation tests completed and saved to translation_test_results.json! ---');
}

runTests();
