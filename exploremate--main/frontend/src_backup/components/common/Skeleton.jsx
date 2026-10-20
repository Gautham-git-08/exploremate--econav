import React from 'react';

export default function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl ${className}`} />
  );
}
