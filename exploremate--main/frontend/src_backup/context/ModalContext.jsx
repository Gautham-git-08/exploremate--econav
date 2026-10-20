/**
 * ExploreMate Modal Context
 * Accessible modal system with showAlert and promise-based showConfirm.
 * Replaces window.alert() and window.confirm().
 */

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { X, AlertCircle, HelpCircle } from 'lucide-react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState(null);
  const confirmResolverRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dialogRef = useRef(null);

  const showAlert = ({ title = "Notice", message, confirmText = "OK" }) => {
    previousFocusRef.current = document.activeElement;
    setModalState({
      type: 'alert',
      title,
      message,
      confirmText
    });
  };

  const showConfirm = ({ title = "Confirm", message, confirmText = "Confirm", cancelText = "Cancel" }) => {
    previousFocusRef.current = document.activeElement;
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setModalState({
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText
      });
    });
  };

  const handleClose = (result = false) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
    setModalState(null);
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalState) {
        handleClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modalState && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => handleClose(false)}
        >
          <div 
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                {modalState.type === 'confirm' ? (
                  <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-mustard-600 dark:text-mustard-400" />
                )}
                <h3 id="modal-title" className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                  {modalState.title}
                </h3>
              </div>
              <button 
                onClick={() => handleClose(false)}
                aria-label="Close dialog"
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p id="modal-desc" className="py-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {modalState.message}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              {modalState.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => handleClose(true)}
                className="px-5 py-2 text-sm font-medium rounded-xl text-white bg-mustard-600 hover:bg-mustard-700 dark:bg-mustard-500 dark:hover:bg-mustard-600 shadow-md transition"
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
