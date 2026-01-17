import React, { useState, useEffect } from 'react';
import { Search, Send, X, Minimize2, Maximize2, RefreshCw, Globe, MessageSquare, CheckCircle2, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '../supabase-client';
import { insightEngine } from '../services/insight-engine';

type Recommendation = {
    airtable_id: string;
    customer_name: string;
    summary_cn?: string;
    categories?: string;
    airtable_last_modified?: string;
};

export function FloatingInterface() {
    const [isOpen, setIsOpen] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState('');
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'failed' | 'healthy'>('idle');
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPwd, setLoginPwd] = useState('');
    const [isSignUpMode, setIsSignUpMode] = useState(false);

    // Dragging state
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 24 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const initData = async () => {
        setIsLoading(true);
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                setUser(null);
                setIsLoading(false);
                return;
            }
            setUser(currentUser);

            const [recs, health] = await Promise.all([
                insightEngine.getTopRecommendations(),
                insightEngine.checkSyncHealth()
            ]);
            setRecommendations(recs as Recommendation[]);
            setSyncStatus(health as any);
        } catch (error) {
            console.error('Initialization failed:', error);
            setSyncStatus('failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) initData();
    }, [isOpen]);

    // Dragging handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMinimized) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            const maxX = window.innerWidth - 384;
            const maxY = window.innerHeight - (isMinimized ? 56 : 650);

            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, isMinimized]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPwd
        });

        if (error) {
            alert('登入失敗: ' + error.message);
        } else {
            setUser(data.user);
            initData();
        }
        setIsLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: loginEmail,
            password: loginPwd
        });

        if (error) {
            alert('註冊失敗: ' + error.message);
        } else {
            alert('註冊成功！');
            setUser(data.user);
            initData();
        }
        setIsLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const handleAIQuery = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        try {
            const response = await insightEngine.performAIQuery(query, country);
            setAiResponse(response);
        } catch (error) {
            console.error('AI query failed:', error);
            setAiResponse('查詢失敗，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 group"
                style={{ zIndex: 9999 }}
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-400 via-purple-400 to-pink-400 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-full shadow-2xl hover:shadow-violet-500/50 transition-all transform group-hover:scale-110">
                        <Sparkles size={28} className="animate-spin-slow" />
                    </div>
                </div>
            </button>
        );
    }

    return (
        <div
            className={`fixed inset-0 pointer-events-none z-[9999] overflow-hidden`}
        >
            <div
                className={`absolute w-96 backdrop-blur-xl bg-white/95 rounded-3xl shadow-2xl border border-white/20 flex flex-col transition-all overflow-hidden pointer-events-auto ${isMinimized ? 'h-16' : 'h-[680px]'} ${isDragging ? 'cursor-grabbing scale-105' : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    userSelect: isDragging ? 'none' : 'auto',
                    boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.1)'
                }}
            >
                {/* Modern Glassmorphic Header */}
                <div
                    className="relative p-5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white flex items-center justify-between cursor-grab active:cursor-grabbing overflow-hidden"
                    onMouseDown={handleMouseDown}
                    onClick={() => isMinimized && setIsMinimized(false)}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="relative flex items-center gap-3 z-10">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Sparkles size={20} className={isLoading ? 'animate-spin' : ''} />
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight">Gemini 業務助手</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className={`w-2 h-2 rounded-full ${syncStatus === 'healthy' ? 'bg-green-300' : 'bg-red-300'} animate-pulse shadow-lg`}></div>
                                <span className="text-xs text-white/80">AI 賦能中</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative flex items-center gap-2 z-10">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
                        >
                            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="p-2 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {!user ? (
                            <div className="p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 opacity-50"></div>
                                <div className="relative z-10 backdrop-blur-sm bg-white/80 p-8 rounded-3xl border border-white/50 shadow-xl">
                                    <div className="text-center mb-6">
                                        <div className="inline-flex p-4 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                                            <Globe size={32} className="text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                            {isSignUpMode ? '開始您的旅程' : '歡迎回來'}
                                        </h2>
                                        <p className="text-gray-500 text-sm">
                                            {isSignUpMode ? '創建帳號，解鎖 AI 洞察力' : '登入以存取智能分析'}
                                        </p>
                                    </div>
                                    <form onSubmit={isSignUpMode ? handleSignUp : handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider pl-1">Email</label>
                                            <input
                                                type="email"
                                                required
                                                className="w-full p-3.5 rounded-2xl border-2 border-gray-100 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none text-sm transition-all bg-white/50 backdrop-blur-sm"
                                                placeholder="your@email.com"
                                                value={loginEmail}
                                                onChange={e => setLoginEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider pl-1">密碼</label>
                                            <input
                                                type="password"
                                                required
                                                className="w-full p-3.5 rounded-2xl border-2 border-gray-100 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none text-sm transition-all bg-white/50 backdrop-blur-sm"
                                                placeholder="••••••••"
                                                value={loginPwd}
                                                onChange={e => setLoginPwd(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-violet-500/50 transition-all disabled:opacity-50 transform hover:scale-105"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <RefreshCw size={16} className="animate-spin" />
                                                    處理中...
                                                </span>
                                            ) : (
                                                isSignUpMode ? '立即註冊' : '立即登入'
                                            )}
                                        </button>
                                        <div className="text-center pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsSignUpMode(!isSignUpMode)}
                                                className="text-sm text-violet-600 hover:text-purple-600 font-medium transition-colors"
                                            >
                                                {isSignUpMode ? '← 已有帳號？返回登入' : '還沒有帳號？立即註冊 →'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Premium Search Section */}
                                <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100/50">
                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity blur-xl"></div>
                                            <input
                                                type="text"
                                                placeholder="🔍 客戶名稱 (例如: OLIC, Kubara)"
                                                className="relative w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none text-sm transition-all bg-white shadow-sm hover:shadow-md"
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="🌍 國家 (選填: Japan, Thailand)"
                                                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none text-sm transition-all bg-white shadow-sm hover:shadow-md"
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="💬 詢問 AI 任何問題..."
                                                className="w-full p-4 pr-14 rounded-2xl border-2 border-gray-100 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none text-sm transition-all bg-white shadow-sm hover:shadow-md"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAIQuery()}
                                            />
                                            <button
                                                onClick={handleAIQuery}
                                                disabled={isLoading}
                                                className="absolute right-2 top-2 p-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 transform hover:scale-110"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Response Area */}
                                {aiResponse && (
                                    <div className="px-5 pt-4">
                                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 p-5 border-2 border-violet-100 shadow-lg">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg">
                                                        <Sparkles size={16} className="text-white" />
                                                    </div>
                                                    <span className="text-sm font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">AI 智能分析</span>
                                                    <button onClick={() => setAiResponse(null)} className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors">✕ 清除</button>
                                                </div>
                                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {aiResponse}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Premium Recommendations List */}
                                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                                                <RefreshCw size={48} className="relative text-violet-500 animate-spin" />
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">載入智能推薦中...</p>
                                        </div>
                                    ) : recommendations.length === 0 ? (
                                        <div className="text-center py-16 space-y-3">
                                            <div className="inline-flex p-4 bg-gray-100 rounded-2xl">
                                                <Search size={32} className="text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-400">暫無推薦案件</p>
                                        </div>
                                    ) : (
                                        recommendations.map((rec, index) => (
                                            <div
                                                key={rec.airtable_id}
                                                onClick={() => {
                                                    setQuery(rec.customer_name);
                                                    // If there's a country, set it too
                                                    const countryMatch = rec.summary_cn?.match(/\(([^)]+)\)/);
                                                    if (countryMatch) setCountry(countryMatch[1]);
                                                }}
                                                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/50 transition-all p-5 cursor-pointer transform hover:-translate-y-1 active:scale-95"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-100/50 to-purple-100/50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="relative z-10">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl">
                                                                <TrendingUp size={16} className="text-violet-600" />
                                                            </div>
                                                            <span className="font-bold text-gray-800 text-base">{rec.customer_name}</span>
                                                        </div>
                                                        {rec.categories && (
                                                            <span className="px-3 py-1 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 rounded-full text-xs font-semibold">
                                                                {rec.categories}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {rec.summary_cn && (
                                                        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
                                                            {rec.summary_cn}
                                                        </p>
                                                    )}
                                                    {rec.airtable_last_modified && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <Clock size={12} />
                                                            <span>{new Date(rec.airtable_last_modified).toLocaleDateString('zh-TW')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Premium Footer */}
                                <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100/50 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                                        <span className="font-medium">{user.email?.split('@')[0]}</span>
                                        <button onClick={handleLogout} className="ml-1 text-violet-600 hover:text-purple-600 font-semibold transition-colors">登出</button>
                                    </div>
                                    <button
                                        onClick={initData}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-violet-50 text-violet-600 rounded-xl font-semibold transition-all border border-gray-100 hover:border-violet-200 hover:shadow-md"
                                    >
                                        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                                        重新載入
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
            </div>
        </div>
    );
}
