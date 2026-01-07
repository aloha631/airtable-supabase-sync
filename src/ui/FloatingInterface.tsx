import React, { useState, useEffect } from 'react';
import { Search, Globe, Send, X, Minimize2, Maximize2, RefreshCw, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { insightEngine } from '../services/insight-engine';
import { supabase } from '../supabase-client';

interface Recommendation {
    airtable_id: string;
    customer_name: string;
    country: string;
    reason: string;
    summary: string;
    status: 'processed' | 'unprocessed';
}

export const FloatingInterface: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRecommendations([]);
    };

    const handleAIQuery = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setAiResponse(null);
        try {
            const response = await insightEngine.performAIQuery(query, country);
            setAiResponse(response);
        } catch (error) {
            setAiResponse("AI 查詢發生錯誤，請稍後再試。");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAction = async (rec: Recommendation) => {
        const success = await insightEngine.markActionAsDone(rec.airtable_id, rec.customer_name, rec.reason);
        if (success) {
            setRecommendations(prev => prev.filter(r => r.airtable_id !== rec.airtable_id));
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center animate-bounce z-50"
                id="ai-toggle-btn"
            >
                <Search size={24} />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-premium border border-gray-100 flex flex-col transition-all overflow-hidden z-50 ${isMinimized ? 'h-14' : 'h-[650px]'}`}>
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
                <div className="flex items-center gap-2">
                    <Globe size={18} className={isLoading ? 'animate-spin' : 'animate-spin-slow'} />
                    <span className="font-bold">Gemini 業務助手</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:bg-indigo-500 p-1 rounded">
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:bg-indigo-500 p-1 rounded">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {!user ? (
                        <div className="p-8 flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
                            <h2 className="text-xl font-bold text-gray-800 mb-2 font-inter">歡迎回來</h2>
                            <p className="text-gray-500 text-xs mb-6">請登入以存取 Gemini AI 業務洞察</p>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                        placeholder="admin@example.com"
                                        value={loginEmail}
                                        onChange={e => setLoginEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">密碼</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full mt-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                        placeholder="••••••••"
                                        value={loginPwd}
                                        onChange={e => setLoginPwd(e.target.value)}
                                    />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100">
                                    {isLoading ? '登入中...' : '立即登入'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {syncStatus === 'failed' && (
                                <div className="bg-red-50 p-2 flex items-center justify-between text-[10px] text-red-600 px-4 border-b border-red-100">
                                    <div className="flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        <span>資料可能非最新！同步發生錯誤。</span>
                                    </div>
                                    <button className="underline font-bold" onClick={initData}>重試</button>
                                </div>
                            )}

                            {/* Search Section - Refined 3-Input Layout */}
                            <div className="p-4 space-y-3 bg-gray-50 border-b">
                                <div className="space-y-2">
                                    {/* (1) Customer Name Input */}
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="客戶名稱 (例如: OLIC)"
                                            className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                                            value={query} // Previously mixed query, now focusing on customer/intent
                                            onChange={(e) => setQuery(e.target.value)}
                                        />
                                    </div>

                                    {/* (2) Country Input (Optional) */}
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="國家 (選填)"
                                            className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                        />
                                    </div>

                                    {/* (3) AI Question Input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="想詢問 AI 的事情..."
                                            className="w-full p-2.5 pr-10 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAIQuery();
                                                    // Note: We might need a separate state for the actual question versus customer name
                                                    // For now, we reuse 'query' as primary filter. 
                                                    // TODO: In next iteration, separate 'customerName' state from 'userQuestion' state.
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleAIQuery}
                                            disabled={isLoading}
                                            className="absolute right-1.5 top-1.5 bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
                                {aiResponse ? (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare size={14} className="text-indigo-600" />
                                            <span className="text-xs font-bold text-gray-500 italic">AI 分析結果</span>
                                            <button onClick={() => setAiResponse(null)} className="ml-auto text-[10px] text-gray-400">清除</button>
                                        </div>
                                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-sm text-gray-700 whitespace-pre-wrap">
                                            {aiResponse}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Globe size={10} /> 今日建議聯繫 (BEYOND DATA)
                                        </h3>

                                        {isLoading && recommendations.length === 0 ? (
                                            <div className="text-center py-10 text-gray-400">分析中...</div>
                                        ) : recommendations.length === 0 ? (
                                            <div className="text-center py-10 text-gray-300 text-xs">目前沒有案件</div>
                                        ) : (
                                            recommendations.map((rec) => (
                                                <div key={rec.airtable_id} className="p-3.5 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all group relative">
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <span className="font-bold text-gray-800 text-sm">{rec.customer_name}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">"{rec.summary}"</p>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                                        <AlertCircle size={12} />
                                                        <span>{rec.reason}</span>
                                                    </div>
                                                    <button onClick={() => handleMarkAction(rec)} className="absolute right-3 top-3 p-2 rounded-xl bg-white border opacity-0 group-hover:opacity-100 hover:text-green-600 transition-all text-[10px] flex items-center gap-1 font-bold">
                                                        <CheckCircle2 size={14} /> 完成聯繫
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="p-3 border-t bg-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    <span>已登入: {user.email?.split('@')[0]}</span>
                                    <button onClick={handleLogout} className="ml-1 underline font-bold">登出</button>
                                </div>
                                <button onClick={initData} className="flex items-center gap-1 hover:text-indigo-600 font-bold">
                                    <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
                                    重新加載
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};
