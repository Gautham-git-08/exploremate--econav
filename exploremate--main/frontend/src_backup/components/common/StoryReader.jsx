import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Volume2, VolumeX, Pause, Play, Square, Sun, Moon, 
  Clock, BookOpen, MapPin, Award, CheckCircle2, ChevronLeft 
} from 'lucide-react';

export default function StoryReader({ story, onClose }) {
  const [readerDark, setReaderDark] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const contentRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Scroll progress listener
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const total = scrollHeight - clientHeight;
      if (total > 0) {
        setScrollProgress(Math.min(100, Math.round((scrollTop / total) * 100)));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Speech synthesis cleanup
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [story]);

  // Handle Play / Resume
  const handlePlayVoice = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    synthRef.current.cancel();
    const textToRead = story.audioText || story.content;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick English voice if available
    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  // Handle Pause
  const handlePauseVoice = () => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  // Handle Stop
  const handleStopVoice = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div 
        className={`w-full max-w-4xl h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300 relative border ${
          readerDark 
            ? 'bg-slate-950 text-slate-100 border-slate-800' 
            : 'bg-amber-50/70 text-slate-900 border-amber-200/80 dark:bg-slate-900 dark:text-white dark:border-slate-800'
        }`}
      >
        {/* Scroll Progress Bar at very top */}
        <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-800 relative z-30">
          <div 
            className="h-full bg-gradient-to-r from-mustard-500 via-teal-500 to-emerald-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-800 shrink-0 backdrop-blur-sm z-20">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-bold text-mustard-600 uppercase tracking-wider hidden sm:inline">
              Pondicherry Eco Lore
            </span>
          </div>

          {/* Voice Narration & Dark/Light Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Audio Voice Player Controls */}
            <div className="flex items-center space-x-1 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
              <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 mr-1 hidden sm:inline">
                {isSpeaking ? 'Narrating...' : isPaused ? 'Paused' : 'Listen'}
              </span>

              {!isSpeaking ? (
                <button
                  type="button"
                  onClick={handlePlayVoice}
                  className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                  title="Play narration"
                >
                  <Play className="w-4 h-4 fill-emerald-600" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseVoice}
                  className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                  title="Pause narration"
                >
                  <Pause className="w-4 h-4 fill-amber-600" />
                </button>
              )}

              {(isSpeaking || isPaused) && (
                <button
                  type="button"
                  onClick={handleStopVoice}
                  className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Stop narration"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-600" />
                </button>
              )}
            </div>

            {/* Reading Mode Theme Toggle */}
            <button
              type="button"
              onClick={() => setReaderDark(!readerDark)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title={readerDark ? "Switch to daylight reading" : "Switch to nighttime reading"}
            >
              {readerDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Story Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 space-y-8"
        >
          {/* Hero Image */}
          <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden shadow-lg">
            <img 
              src={story.heroImage} 
              alt={story.heroAlt}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/neutral_placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
              <span className="text-[11px] font-bold uppercase tracking-widest text-mustard-300 block mb-1">
                {story.subtitle}
              </span>
              <h1 className="font-serif text-2xl sm:text-4xl font-bold leading-tight">
                {story.title}
              </h1>
            </div>
          </div>

          {/* Meta Details Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-mustard-600" />
                <span>{story.readingTimeMinutes} min read ({story.wordCount} words)</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>{story.location}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <Award className="w-4 h-4" />
              <span>Badge Award: {story.badgeAward}</span>
            </div>
          </div>

          {/* Story Body with Drop-Cap Styling */}
          <div className="max-w-2xl mx-auto space-y-6">
            <p className="font-serif text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-200 first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-mustard-600 whitespace-pre-line">
              {story.content}
            </p>
          </div>

          {/* Ecological Takeaway Card */}
          <div className="max-w-2xl mx-auto p-5 sm:p-6 rounded-3xl bg-teal-500/10 border border-teal-500/30 text-teal-950 dark:text-teal-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 block">
              The Ecological Lesson
            </span>
            <p className="text-xs sm:text-sm leading-relaxed">
              {story.summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
