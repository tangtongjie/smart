import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, Category } from '../types';
import TransactionInput from './TransactionInput';
import { cn, formatCurrency } from '../lib/utils';
import { Trash2, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function HomeView({ user }: { user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(docs);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(docs);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="mb-1 text-sm font-medium text-gray-500">智能记账</h2>
        <TransactionInput user={user} categories={categories} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">最近记录</h2>
          <span className="text-xs text-gray-400">最近 20 条</span>
        </div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {transactions.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative flex items-center justify-between rounded-2xl bg-surface p-4 border border-border transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                    t.type === 'expense' ? "bg-[#F3F4F6] text-primary" : "bg-[#EEF2FF] text-accent"
                  )}>
                    {t.category.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary">{t.category}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <span>{t.note || '无备注'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {format(new Date(t.date), 'MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-mono font-bold text-sm",
                    t.type === 'expense' ? "text-primary" : "text-success"
                  )}>
                    {t.type === 'expense' ? '-' : '+'}{t.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => t.id && handleDelete(t.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-muted hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <Plus size={32} />
              </div>
              <p>还没有记录，试着说句话记账吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
