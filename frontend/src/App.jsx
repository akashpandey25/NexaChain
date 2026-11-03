import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            NexaChain
          </h1>
          <p className="mt-2 text-slate-400">
            Investment & Referral Management Platform
          </p>
        </div>

        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 text-left space-y-2 text-sm">
          <div className="flex items-center justify-between text-slate-300">
            <span>Environment:</span>
            <span className="font-mono text-emerald-400">Development</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Frontend:</span>
            <span className="font-mono text-indigo-400">Vite + React + Tailwind</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Status:</span>
            <span className="font-mono text-amber-400">Initialized</span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Project structure initialized. Ready for feature implementation.
        </p>
      </div>
    </div>
  );
}

export default App;

