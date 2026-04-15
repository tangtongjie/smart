import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { Mic, Send, Loader2, Check, X, Plus, Trash2 } from 'lucide-react';
import { parseTransaction } from '../services/gemini';
import { ParsedTransaction, Category } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function TransactionInput({ user, categories }: { user: User, categories: Category[] }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [preview, setPreview] = useState<ParsedTransaction | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleParse(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleParse = async (text: string) => {
    if (!text.trim()) return;
    setIsParsing(true);
    const result = await parseTransaction(text);
    if (result) {
      setPreview(result);
    }
    setIsParsing(false);
    setInput('');
  };

  const handleConfirm = async () => {
    if (!preview) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...preview,
        date: new Date().toISOString(),
        uid: user.uid
      });
      setPreview(null);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !preview) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        type: preview.type,
        uid: user.uid
      });
      setPreview({ ...preview, category: newCategoryName.trim() });
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (error) {
      console.error("Add category failed:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      console.error("Delete category failed:", error);
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="ai-input-box"
          >
            <p className="mb-2 text-sm text-muted">您可以说：中午吃面15元</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParse(input)}
                placeholder="输入或点击麦克风记账..."
                className="flex-1 bg-transparent py-2 text-base font-medium outline-none placeholder:text-muted/50"
              />
              <button
                onClick={() => handleParse(input)}
                disabled={isParsing || !input.trim()}
                className="text-primary disabled:opacity-30"
              >
                {isParsing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            
            <button
              onClick={toggleListening}
              className={cn(
                "mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full transition-all shadow-lg",
                isListening ? "bg-red-500 text-white animate-pulse" : "bg-primary text-white"
              )}
            >
              <div className={cn(
                "h-6 w-6 rounded-full",
                isListening ? "bg-white" : "bg-[radial-gradient(circle,_#fff_30%,_#4F46E5_100%)]"
              )} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="label-title">AI 识别结果</div>
            <div className="confirmation-card">
              <div className="mb-6 flex flex-wrap gap-2">
                <div className="tag">¥ {preview.amount.toFixed(2)}</div>
                <div className="tag">
                  {preview.category}
                  <button 
                    onClick={() => setPreview({ ...preview, category: '' })}
                    className="ml-1 text-[10px] text-muted hover:text-accent"
                  >
                    ✕
                  </button>
                </div>
                <div className="tag">{preview.type === 'expense' ? '支出' : '收入'}</div>
                {preview.note && (
                  <div className="tag bg-[#F3F4F6] text-primary">备注: {preview.note}</div>
                )}
              </div>

              <div className="mb-6">
                <label className="label-title block !mb-2">切换分类</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.type === preview.type).map(c => (
                    <button
                      key={c.id}
                      onClick={() => setPreview({ ...preview, category: c.name })}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all",
                        preview.category === c.name 
                          ? "bg-accent text-white" 
                          : "bg-bg text-muted hover:bg-border"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-[13px] font-semibold text-muted hover:border-muted hover:text-primary"
                  >
                    <Plus size={14} />
                    新增
                  </button>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full rounded-xl bg-primary py-3 font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              >
                确认存入
              </button>
              
              <button
                onClick={() => setPreview(null)}
                className="mt-3 w-full rounded-xl py-2 text-sm font-medium text-muted hover:text-primary"
              >
                取消
              </button>
            </div>

            {showAddCategory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6 backdrop-blur-sm">
                <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl">
                  <h3 className="mb-4 text-lg font-bold">新增分类</h3>
                  <input
                    type="text"
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="分类名称"
                    className="mb-4 w-full rounded-xl bg-gray-50 px-4 py-3 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddCategory(false)}
                      className="flex-1 rounded-xl bg-gray-50 py-3 font-medium text-gray-600"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddCategory}
                      className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white shadow-lg shadow-blue-100"
                    >
                      确定
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
