import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Grandmaster Guide</h1>
          <p className="text-xs text-slate-400">Interactive AI Chess Tutor</p>
        </div>
      </div>
      <div>
        <a 
          href="https://ai.google.dev/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Powered by Gemini
        </a>
      </div>
    </header>
  );
};
