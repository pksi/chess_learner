import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  messages: ChatMessage[];
  isThinking: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, isThinking }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
      <div className="p-4 bg-slate-900/50 border-b border-slate-700">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          Tutor Analysis
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-10 p-4">
            <p>Start the game by making a move as White.</p>
            <p className="text-sm mt-2">I will analyze your moves and play as Black.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.sender === 'user' ? 'bg-slate-600' : 'bg-indigo-600'
              }`}
            >
              {msg.sender === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-700 text-slate-100 rounded-tr-none'
                  : 'bg-slate-700/50 text-slate-200 border border-slate-600/50 rounded-tl-none'
              }`}
            >
              {msg.sender === 'tutor' ? (
                 <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
             </div>
             <div className="bg-slate-700/50 border border-slate-600/50 p-3 rounded-lg rounded-tl-none flex items-center gap-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
