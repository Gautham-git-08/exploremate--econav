/**
 * ExploreMate Travel Translator Tab
 * - Powered by Gemini Flash via src/services/gemini.js
 * - Temperature 0.1, strict plain output without conversational filler
 * - Language auto-detection, swap button, copy, and SpeechSynthesis voice output
 * - Focused on Pondicherry multilingual interactions: Tamil, French, English, Hindi, Telugu, Malayalam, Kannada
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Mic, Volume2, Copy, Check, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { ALL_LANGUAGES, POPULAR_LANGUAGES } from '../config/languages.js';
import { translateWithGemini } from '../services/gemini.js';
import { useModal } from '../context/ModalContext.jsx';

export default function TranslateTab() {
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [fromLang, setFromLang] = useState('auto');
  const [toLang, setToLang] = useState('ta'); // Default Tamil
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [listening, setListening] = useState(false);

  const { showAlert } = useModal();

  const phraseChips = [
    "Where is the nearest bus stop?",
    "How much is the entry ticket?",
    "Is this place open today?",
    "Please take me to the beach",
    "I need help",
    "Where is Promenade Beach?",
    "How much for auto to White Town?"
  ];

  const handleTranslate = async (textToTranslate = text) => {
    const input = (textToTranslate || '').trim();
    if (!input) return;

    setLoading(true);
    setError(null);

    const fromObj = ALL_LANGUAGES.find(l => l.code === fromLang);
    const toObj = ALL_LANGUAGES.find(l => l.code === toLang) || { name: 'Tamil' };

    const sourceLangName = fromLang === 'auto' ? 'auto-detect' : (fromObj?.name || fromLang);
    const targetLangName = toObj.name;

    try {
      const result = await translateWithGemini({
        text: input,
        sourceLang: sourceLangName,
        targetLang: targetLangName
      });
      setTranslation(result);
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message || 'Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    if (fromLang === 'auto') return;
    const prevFrom = fromLang;
    const prevTo = toLang;
    setFromLang(prevTo);
    setToLang(prevFrom);

    const prevInput = text;
    const prevTrans = translation;
    setText(prevTrans);
    setTranslation(prevInput);
  };

  const handleCopy = () => {
    if (!translation) return;
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!translation || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translation);
    const targetObj = ALL_LANGUAGES.find(l => l.code === toLang);
    if (targetObj && targetObj.speechLocale) {
      utterance.lang = targetObj.speechLocale;
    }
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceInput = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showAlert({
        title: "Voice Input Notice",
        message: "Speech recognition is supported in Chrome/Edge browsers. You can type directly in the box."
      });
      return;
    }

    try {
      const recognition = new SpeechRec();
      const fromObj = ALL_LANGUAGES.find(l => l.code === fromLang);
      recognition.lang = fromObj?.speechLocale || 'en-IN';
      recognition.interimResults = false;

      setListening(true);
      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setText(spoken);
        setListening(false);
        handleTranslate(spoken);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognition.start();
    } catch (e) {
      setListening(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Pondicherry Travel Translator
          </h2>
          <p className="text-xs text-slate-500">
            Powered by Google Gemini Flash. Accurate local translations in Tamil, French, Hindi, Telugu, and 60+ languages.
          </p>
        </div>
      </div>

      {/* Language Selector Bar with Swap */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        {/* Source Language */}
        <div className="w-full sm:w-5/12">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            From
          </label>
          <select
            value={fromLang}
            onChange={(e) => setFromLang(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white"
          >
            <option value="auto">✨ Auto Detect Language</option>
            <optgroup label="Popular in Pondicherry">
              {POPULAR_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </optgroup>
            <optgroup label="All Languages">
              {ALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwap}
          disabled={fromLang === 'auto'}
          aria-label="Swap languages"
          title={fromLang === 'auto' ? 'Cannot swap with Auto Detect' : 'Swap languages'}
          className={`p-2.5 rounded-2xl border transition shrink-0 ${
            fromLang === 'auto'
              ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
              : 'hover:bg-mustard-500/10 border-slate-200 dark:border-slate-700 text-mustard-600 dark:text-mustard-400 hover:border-mustard-500'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        {/* Target Language */}
        <div className="w-full sm:w-5/12">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            To
          </label>
          <select
            value={toLang}
            onChange={(e) => setToLang(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white"
          >
            <optgroup label="Popular in Pondicherry">
              {POPULAR_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </optgroup>
            <optgroup label="All Languages">
              {ALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Translation Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Input Box */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 min-h-[260px] shadow-sm">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or speak a phrase (e.g. 'Where is the beach?', 'How much is the auto fare?')..."
            className="w-full flex-1 bg-transparent resize-none text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={startVoiceInput}
              aria-label="Voice input"
              className={`p-2 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold ${
                listening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{listening ? 'Listening...' : 'Voice'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTranslate()}
              disabled={loading || !text.trim()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow ${
                loading || !text.trim()
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-mustard-600 hover:bg-mustard-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Translate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Target Translation Output Box */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 min-h-[260px] bg-slate-50/50 dark:bg-slate-900/40 shadow-sm relative">
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
              <button
                type="button"
                onClick={() => handleTranslate()}
                className="text-xs px-3 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 font-semibold hover:underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-start">
              {loading ? (
                <div className="flex items-center space-x-2 text-slate-400 text-sm italic py-4 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-mustard-600" />
                  <span>Generating Gemini translation...</span>
                </div>
              ) : translation ? (
                <p className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap select-all">
                  {translation}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  Translation will appear here...
                </p>
              )}
            </div>
          )}

          {/* Action Buttons: Copy and Speak */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">
              Gemini Flash AI
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSpeak}
                disabled={!translation}
                aria-label="Speak translation"
                title="Listen to pronunciation"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!translation}
                aria-label="Copy translation"
                title="Copy to clipboard"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Traveler Phrases Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Frequent Pondicherry Travel Phrases
        </span>
        <div className="flex flex-wrap gap-2">
          {phraseChips.map((phrase, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setText(phrase);
                handleTranslate(phrase);
              }}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-mustard-50 dark:hover:bg-mustard-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-mustard-500 transition text-left"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
