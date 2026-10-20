import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 glass-panel rounded-3xl border border-red-200 dark:border-red-900 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
              Something went unexpected
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              ExploreMate encountered an issue loading this section.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-mustard-600 text-white text-sm font-medium hover:bg-mustard-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
