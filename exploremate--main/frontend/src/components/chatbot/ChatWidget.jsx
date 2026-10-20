/**
 * ExploreMate Floating AI Travel Assistant
 * - Directly connected to Google Gemini Flash via src/services/gemini.js
 * - Injects full 43 places context from src/data/places.js, current itinerary, and budget
 * - Maintains 10-turn conversation history
 * - Shows typing indicator, friendly error handling, and language responsiveness
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, AlertCircle, RefreshCw, User } from 'lucide-react';
import { callGemini } from '../../services/gemini.js';
import { PLACES } from '../../data/places.js';
import { useApp } from '../../context/AppContext.jsx';

export default function ChatWidget({ activeTab, setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: "Bonjour & Vanakkam! I am your ExploreMate AI companion for Pondicherry. Ask me about heritage spots, visiting hours, fees, coastal walks, or your custom itinerary!"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const messagesEndRef = useRef(null);

  const { selectedPlaces, budgetConfig } = useApp();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const userText = inputVal.trim();
    if (!userText || loading) return;

    setErrorMsg(null);
    setInputVal('');

    // Append user message
    const updatedHistory = [...messages, { role: 'user', text: userText }];
    setMessages(updatedHistory);
    setLoading(true);

    // Keep last 10 turns
    const recentHistory = updatedHistory.slice(-10);

    // Prepare system instruction with verified places context
    const itinerarySummary = selectedPlaces.length > 0
      ? selectedPlaces.map(p => `${p.name} (${p.category}, Fee: ₹${p.entryFee})`).join('; ')
      : 'None selected yet';

    const placesContext = PLACES.map(p => 
      `- ${p.name} [${p.category}]: Fee: ${p.entryFee === 0 ? 'Free' : '₹' + p.entryFee} (${p.feeNote}). Hours: ${p.hoursNote}. Best time: ${p.bestTimeOfDay}. Visit duration: ~${p.avgVisitMinutes}m. Verified: ${p.verified ? 'Yes' : 'Not confirmed'}. Summary: ${p.description}`
    ).join('\n');

    const systemInstruction = `You are ExploreMate AI, the specialized travel assistant for Pondicherry (Puducherry), India.
You must follow these rules strictly:
1. Answer using ONLY the provided Pondicherry places data, the user's current itinerary, and their budget settings.
2. If you are not sure or if details are not confirmed in the data, honestly say: "Not confirmed, please verify on arrival". NEVER invent visiting hours, ticket fees, or historical claims.
3. Suggest eco-friendly transport: walking within White Town (<=2km), cycling (2-8km), or public PRTC buses / electric autos. Discourage unnecessary car trips.
4. Always respond in the language used by the user (Tamil, English, French, Hindi, Telugu, etc.).
5. Be concise, polite, helpful, and culturally respectful of Pondicherry's French-Tamil heritage.

--- CURRENT USER ITINERARY ---
Stops: ${itinerarySummary}
Budget: ₹${budgetConfig.totalBudget} for ${budgetConfig.days} day(s), ${budgetConfig.people} traveler(s), preferred mode: ${budgetConfig.travelMode}.

--- VERIFIED 43 PONDICHERRY DESTINATIONS DATABASE ---
${placesContext}`;

    // Format prompt incorporating history
    const conversationPrompt = recentHistory
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n\n') + '\n\nAssistant:';

    try {
      const response = await callGemini({
        prompt: conversationPrompt,
        systemInstruction,
        temperature: 0.2,
        timeoutMs: 40000
      });

      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.warn('Direct Gemini call error, attempting backend proxy failover...', err);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            itinerary: selectedPlaces,
            budget: budgetConfig
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
            return;
          }
        }
      } catch (backupErr) {
        console.warn('Backend proxy failover error:', backupErr);
      }

      let userFriendlyError = "I'm having trouble connecting to Gemini. Please try again in a moment.";
      if (err.message?.includes('rate limit')) {
        userFriendlyError = "AI rate limit reached. Please wait a few seconds and try again.";
      }
      setErrorMsg(userFriendlyError);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: `⚠️ ${userFriendlyError}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Travel Assistant"
        className="fixed bottom-20 md:bottom-6 right-6 z-[900] w-14 h-14 rounded-full bg-gradient-to-r from-mustard-500 to-amber-500 hover:from-mustard-600 hover:to-amber-600 text-slate-950 font-bold shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 border-white dark:border-slate-800"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-slate-950" />}
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-4 sm:right-6 z-[950] w-[92vw] sm:w-[420px] h-[550px] max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-mustard-500 to-amber-500 text-slate-950 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center font-bold">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">ExploreMate AI Guide</h3>
                <span className="text-[11px] font-medium text-slate-800 opacity-90 block">
                  Gemini Flash • Pondicherry Expert
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-black/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#FBF8F3]/50 dark:bg-slate-950/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'model' && (
                  <div className="w-6 h-6 rounded-lg bg-mustard-500/20 text-mustard-700 dark:text-mustard-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-mustard-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>

                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-300 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
                <div className="w-6 h-6 rounded-lg bg-mustard-500/20 text-mustard-600 flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span className="italic">ExploreMate is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Prompts */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            {[
              "Is the Ashram Samadhi open now?",
              "What are the boat timings to Paradise Beach?",
              "Recommend an eco-friendly 1-day route"
            ].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInputVal(q);
                }}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 whitespace-nowrap hover:border-mustard-500 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about Pondicherry places or your plan..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mustard-500"
            />
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-mustard-600 hover:bg-mustard-700 text-white font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
