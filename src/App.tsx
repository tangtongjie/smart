/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginAnonymously, logout } from './lib/firebase';
import { Home, PieChart, LogOut, Plus, Wallet, ArrowRight } from 'lucide-react';
import HomeView from './components/HomeView';
import StatsView from './components/StatsView';
import { cn } from './lib/utils';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

const DEFAULT_CATEGORIES = [
  { name: '餐饮', type: 'expense' },
  { name: '交通', type: 'expense' },
  { name: '购物', type: 'expense' },
  { name: '娱乐', type: 'expense' },
  { name: '工资', type: 'income' },
  { name: '理财', type: 'income' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'stats'>('home');
  const [nickname, setNickname] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.uid);
      setUser(user);
      if (user) {
        // Seed categories if none exist
        try {
          const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            for (const cat of DEFAULT_CATEGORIES) {
              await addDoc(collection(db, 'categories'), { ...cat, uid: user.uid });
            }
          }
        } catch (e) {
          console.error("Seeding error:", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await loginAnonymously(nickname.trim());
    } catch (error: any) {
      console.error("Login failed:", error);
      setLoginError(error.message || "登录失败，请稍后重试");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg px-6 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white shadow-xl shadow-primary/10">
          <Wallet size={40} />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-primary">记账助手</h1>
        <p className="mb-10 text-muted">Smart Ledger - AI 驱动的极简记账应用</p>
        
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <div className="relative">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入您的昵称"
              className="w-full rounded-2xl border border-border bg-surface px-6 py-4 text-center text-lg font-medium outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/5"
              autoFocus
            />
          </div>
          {loginError && (
            <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              {loginError.includes("auth/admin-restricted-operation") 
                ? "请在 Firebase 控制台中启用匿名登录 (Anonymous Auth)" 
                : loginError}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoggingIn || !nickname.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {isLoggingIn ? "正在登录..." : "开始记账"}
            {!isLoggingIn && <ArrowRight size={20} />}
          </button>
        </form>
        <p className="mt-6 text-xs text-muted">无需注册，即刻开始您的理财之旅</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg font-sans text-primary">
      {/* Header */}
      <header className="bg-surface px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">记账助手</h1>
            <p className="text-[13px] text-muted">你好，{user.displayName || '记账家'}</p>
          </div>
          <button 
            onClick={logout}
            className="rounded-full p-2 text-muted hover:bg-bg hover:text-primary"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-[70px]">
        {activeTab === 'home' ? <HomeView user={user} /> : <StatsView user={user} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 flex h-[70px] items-center justify-around border-t border-border bg-surface px-6">
        <button
          onClick={() => setActiveTab('home')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'home' ? "text-primary" : "text-muted"
          )}
        >
          <Home size={20} />
          <span className="text-[11px] font-semibold">首页</span>
        </button>
        
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'stats' ? "text-primary" : "text-muted"
          )}
        >
          <PieChart size={20} />
          <span className="text-[11px] font-semibold">统计</span>
        </button>
      </nav>
    </div>
  );
}
