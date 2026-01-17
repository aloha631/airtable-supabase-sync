import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingInterface } from './ui/FloatingInterface';
import './index.css';

// Main entry point
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div className="relative w-full h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-200/30 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AI Business Assistant Dashboard
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-lg mx-auto leading-relaxed">
            您的智能業務助手已準備就緒。請使用右下角的浮動視窗開始獲取客戶洞察。
          </p>
        </div>
      </div>

      <FloatingInterface />
    </div>
  </React.StrictMode>
);
