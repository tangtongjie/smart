import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function StatsView({ user }: { user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  useEffect(() => {
    const start = period === 'month' ? startOfMonth(new Date()) : startOfYear(new Date());
    const end = period === 'month' ? endOfMonth(new Date()) : endOfYear(new Date());

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      where('date', '>=', start.toISOString()),
      where('date', '<=', end.toISOString())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(docs);
    });

    return () => unsubscribe();
  }, [user.uid, period]);

  const filteredData = transactions.filter(t => t.type === type);

  // Pie Chart Data
  const categoryData = filteredData.reduce((acc: any[], t) => {
    const existing = acc.find(item => item.name === t.category);
    if (existing) {
      existing.value += t.amount;
    } else {
      acc.push({ name: t.category, value: t.amount });
    }
    return acc;
  }, []);

  // Bar Chart Data (Daily Trend for current month)
  const days = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const trendData = days.map(day => {
    const dayTransactions = filteredData.filter(t => isSameDay(new Date(t.date), day));
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, 'dd'),
      amount: total
    };
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const totalAmount = filteredData.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">本月分析</h2>
        <p className="text-[13px] text-muted">
          {format(new Date(), 'yyyy年MM月', { locale: zhCN })}总{type === 'expense' ? '支出' : '收入'} ¥{totalAmount}
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        <button
          onClick={() => setType('expense')}
          className={cn(
            "flex-1 rounded-full py-2 text-[13px] font-semibold transition-all",
            type === 'expense' ? "bg-primary text-white" : "bg-transparent border border-border text-muted"
          )}
        >
          支出
        </button>
        <button
          onClick={() => setType('income')}
          className={cn(
            "flex-1 rounded-full py-2 text-[13px] font-semibold transition-all",
            type === 'income' ? "bg-primary text-white" : "bg-transparent border border-border text-muted"
          )}
        >
          收入
        </button>
      </div>

      <div className="space-y-8">
        {/* Pie Chart Card */}
        <div>
          <div className="label-title">分类占比</div>
          <div className="confirmation-card">
            {categoryData.length > 0 ? (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : index === 1 ? '#10B981' : '#F59E0B'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: index === 0 ? '#4F46E5' : index === 1 ? '#10B981' : '#F59E0B' }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold">{Math.round((item.value / totalAmount) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center text-muted">暂无数据</div>
            )}
          </div>
        </div>

        {/* Bar Chart Card */}
        <div>
          <div className="label-title">每日支出趋势</div>
          <div className="confirmation-card">
            {trendData.length > 0 ? (
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <Bar 
                      dataKey="amount" 
                      fill="#4F46E5" 
                      radius={[2, 2, 0, 0]}
                      background={{ fill: '#E5E7EB', radius: 2 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
