import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Transaction, Note, Notification, Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { mockTransactions, mockNotes, mockNotifications } from '../utils/mockData';
import { generateId, isSameMonth, formatCurrency } from '../utils/format';
import { format } from 'date-fns';

interface AppContextType {
  transactions: Transaction[];
  notes: Note[];
  notifications: Notification[];
  settings: Settings;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addNote: (n: Omit<Note, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, n: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  exportData: () => void;
  unreadCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  userId: string;
  children: React.ReactNode;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function rowToTransaction(r: any): Transaction {
  return { id: r.id, type: r.type, value: r.value, category: r.category, description: r.description, date: r.date, tags: r.tags ?? [], createdAt: r.created_at };
}
function rowToNote(r: any): Note {
  return { id: r.id, title: r.title, content: r.content, date: r.date, pinned: r.pinned, transactionId: r.transaction_id ?? undefined, createdAt: r.created_at };
}
function rowToNotification(r: any): Notification {
  return { id: r.id, type: r.type, title: r.title, message: r.message, read: r.read, createdAt: r.created_at };
}
function rowToSettings(r: any): Settings {
  return { monthlyGoal: r.monthly_goal, largeExpenseThreshold: r.large_expense_threshold, customCategories: r.custom_categories ?? [] };
}

// ── provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ userId, children }: AppProviderProps) {
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [notes,         setNotes]         = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings,      setSettings]      = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded,        setLoaded]        = useState(false);

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // ── Load all user data on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [txRes, notesRes, notifsRes, settingsRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('settings').select('*').eq('user_id', userId).single(),
      ]);

      if (cancelled) return;

      const txData = txRes.data ?? [];

      // First time: seed demo data
      if (txData.length === 0 && !txRes.error) {
        await seedDemoData(userId);
        const seeded = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (!cancelled) setTransactions((seeded.data ?? []).map(rowToTransaction));
      } else {
        setTransactions(txData.map(rowToTransaction));
      }

      setNotes((notesRes.data ?? []).map(rowToNote));
      setNotifications((notifsRes.data ?? []).map(rowToNotification));

      if (settingsRes.data) {
        setSettings(rowToSettings(settingsRes.data));
      } else {
        // Insert default settings row for new user
        await supabase.from('settings').insert({ user_id: userId, monthly_goal: DEFAULT_SETTINGS.monthlyGoal, large_expense_threshold: DEFAULT_SETTINGS.largeExpenseThreshold, custom_categories: [] });
      }

      if (!cancelled) setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // ── System notifications ─────────────────────────────────────────────────
  const addSystemNotification = useCallback(async (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const row = { id: generateId(), user_id: userId, type: notif.type, title: notif.title, message: notif.message, read: false, created_at: new Date().toISOString() };
    await supabase.from('notifications').insert(row);
    setNotifications(prev => [rowToNotification(row), ...prev]);
  }, [userId]);

  const checkMonthlyGoal = useCallback((updatedTx: Transaction[], goal: number) => {
    const total = updatedTx.filter(t => t.type === 'despesa' && isSameMonth(t.date, 0)).reduce((s, t) => s + t.value, 0);
    const pct = (total / goal) * 100;
    if (pct >= 100) {
      addSystemNotification({ type: 'error', title: 'Meta mensal ultrapassada!', message: `Total de gastos: ${formatCurrency(total)}.` });
    } else if (pct >= 80) {
      addSystemNotification({ type: 'warning', title: 'Meta mensal em risco', message: `Seus gastos atingiram ${pct.toFixed(0)}% da meta de ${formatCurrency(goal)}.` });
    }
  }, [addSystemNotification]);

  // ── CRUD: Transactions ───────────────────────────────────────────────────
  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: generateId(), createdAt: format(new Date(), 'yyyy-MM-dd') };
    const row = { id: newT.id, user_id: userId, type: newT.type, value: newT.value, category: newT.category, description: newT.description, date: newT.date, tags: newT.tags, created_at: newT.createdAt };
    supabase.from('transactions').insert(row);
    setTransactions(prev => {
      const updated = [newT, ...prev];
      if (newT.type === 'despesa') {
        const { largeExpenseThreshold, monthlyGoal } = settingsRef.current;
        if (newT.value >= largeExpenseThreshold) {
          addSystemNotification({ type: 'warning', title: 'Despesa grande detectada', message: `${formatCurrency(newT.value)} em ${newT.category} (${newT.description}).` });
        }
        checkMonthlyGoal(updated, monthlyGoal);
      }
      return updated;
    });
    toast.success('Transação adicionada!');
  }, [userId, addSystemNotification, checkMonthlyGoal]);

  const updateTransaction = useCallback((id: string, t: Partial<Transaction>) => {
    supabase.from('transactions').update({ type: t.type, value: t.value, category: t.category, description: t.description, date: t.date, tags: t.tags }).eq('id', id).eq('user_id', userId);
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...t } : tx));
    toast.success('Transação atualizada!');
  }, [userId]);

  const deleteTransaction = useCallback((id: string) => {
    supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    toast.success('Transação excluída!');
  }, [userId]);

  // ── CRUD: Notes ──────────────────────────────────────────────────────────
  const addNote = useCallback((n: Omit<Note, 'id' | 'createdAt'>) => {
    const newN: Note = { ...n, id: generateId(), createdAt: format(new Date(), 'yyyy-MM-dd') };
    const row = { id: newN.id, user_id: userId, title: newN.title, content: newN.content, date: newN.date, pinned: newN.pinned, transaction_id: newN.transactionId ?? null, created_at: newN.createdAt };
    supabase.from('notes').insert(row);
    setNotes(prev => [newN, ...prev]);
    toast.success('Anotação salva!');
  }, [userId]);

  const updateNote = useCallback((id: string, n: Partial<Note>) => {
    supabase.from('notes').update({ title: n.title, content: n.content, date: n.date, pinned: n.pinned, transaction_id: n.transactionId ?? null }).eq('id', id).eq('user_id', userId);
    setNotes(prev => prev.map(note => note.id === id ? { ...note, ...n } : note));
    toast.success('Anotação atualizada!');
  }, [userId]);

  const deleteNote = useCallback((id: string) => {
    supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
    setNotes(prev => prev.filter(note => note.id !== id));
    toast.success('Anotação excluída!');
  }, [userId]);

  const togglePinNote = useCallback((id: string) => {
    setNotes(prev => {
      const updated = prev.map(note => note.id === id ? { ...note, pinned: !note.pinned } : note);
      const note = updated.find(n => n.id === id);
      if (note) supabase.from('notes').update({ pinned: note.pinned }).eq('id', id).eq('user_id', userId);
      return updated;
    });
  }, [userId]);

  // ── Notifications ────────────────────────────────────────────────────────
  const markNotificationRead = useCallback((id: string) => {
    supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [userId]);

  const markAllNotificationsRead = useCallback(() => {
    supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [userId]);

  // ── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...s };
      supabase.from('settings').update({ monthly_goal: next.monthlyGoal, large_expense_threshold: next.largeExpenseThreshold, custom_categories: next.customCategories }).eq('user_id', userId);
      return next;
    });
    toast.success('Configurações salvas!');
  }, [userId]);

  // ── Export ───────────────────────────────────────────────────────────────
  const exportData = useCallback(() => {
    const data = { transactions, notes, notifications, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados!');
  }, [transactions, notes, notifications, settings]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #2a2d3e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b', fontSize: 13 }}>Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      transactions, notes, notifications, settings,
      addTransaction, updateTransaction, deleteTransaction,
      addNote, updateNote, deleteNote, togglePinNote,
      markNotificationRead, markAllNotificationsRead,
      updateSettings, exportData, unreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ── Seed demo data for new users ─────────────────────────────────────────────
async function seedDemoData(userId: string) {
  const txRows = mockTransactions.map(t => ({ id: t.id + '_' + userId.slice(0, 8), user_id: userId, type: t.type, value: t.value, category: t.category, description: t.description, date: t.date, tags: t.tags, created_at: t.createdAt }));
  const noteRows = mockNotes.map(n => ({ id: n.id + '_' + userId.slice(0, 8), user_id: userId, title: n.title, content: n.content, date: n.date, pinned: n.pinned, transaction_id: null, created_at: n.createdAt }));
  const notifRows = mockNotifications.map(n => ({ id: n.id + '_' + userId.slice(0, 8), user_id: userId, type: n.type, title: n.title, message: n.message, read: n.read, created_at: n.createdAt }));
  await Promise.all([
    supabase.from('transactions').insert(txRows),
    supabase.from('notes').insert(noteRows),
    supabase.from('notifications').insert(notifRows),
  ]);
}
