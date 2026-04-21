import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
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

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Seeds mock data the first time a user logs in (key does not exist yet)
function loadOrSeed<T>(key: string, seed: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    saveToStorage(key, seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

interface AppProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function AppProvider({ userId, children }: AppProviderProps) {
  const k = (name: string) => `sf_${name}_${userId}`;

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadOrSeed(k('transactions'), mockTransactions)
  );
  const [notes, setNotes] = useState<Note[]>(() =>
    loadOrSeed(k('notes'), mockNotes)
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadOrSeed(k('notifications'), mockNotifications)
  );
  const [settings, setSettings] = useState<Settings>(() =>
    loadFromStorage(k('settings'), DEFAULT_SETTINGS)
  );

  // Re-hydrate when user switches (e.g. logout → login as another user)
  useEffect(() => {
    setTransactions(loadOrSeed(k('transactions'), mockTransactions));
    setNotes(loadOrSeed(k('notes'), mockNotes));
    setNotifications(loadOrSeed(k('notifications'), mockNotifications));
    setSettings(loadFromStorage(k('settings'), DEFAULT_SETTINGS));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { saveToStorage(k('transactions'), transactions); }, [transactions]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { saveToStorage(k('notes'), notes); }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { saveToStorage(k('notifications'), notifications); }, [notifications]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { saveToStorage(k('settings'), settings); }, [settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const addSystemNotification = useCallback((notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const checkMonthlyGoal = useCallback((newTransactions: Transaction[], goal: number) => {
    const totalExpenses = newTransactions
      .filter(t => t.type === 'despesa' && isSameMonth(t.date, 0))
      .reduce((sum, t) => sum + t.value, 0);
    const pct = (totalExpenses / goal) * 100;
    if (pct >= 80 && pct < 100) {
      addSystemNotification({
        type: 'warning',
        title: 'Meta mensal em risco',
        message: `Seus gastos atingiram ${pct.toFixed(0)}% da meta mensal de ${formatCurrency(goal)}.`,
      });
    } else if (pct >= 100) {
      addSystemNotification({
        type: 'error',
        title: 'Meta mensal ultrapassada!',
        message: `Você ultrapassou a meta mensal. Total de gastos: ${formatCurrency(totalExpenses)}.`,
      });
    }
  }, [addSystemNotification]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: generateId(), createdAt: format(new Date(), 'yyyy-MM-dd') };
    setTransactions(prev => {
      const updated = [newT, ...prev];
      if (newT.type === 'despesa') {
        setSettings(currentSettings => {
          if (newT.value >= currentSettings.largeExpenseThreshold) {
            addSystemNotification({
              type: 'warning',
              title: 'Despesa grande detectada',
              message: `Uma despesa de ${formatCurrency(newT.value)} foi registrada em ${newT.category} (${newT.description}).`,
            });
          }
          checkMonthlyGoal(updated, currentSettings.monthlyGoal);
          return currentSettings;
        });
      }
      return updated;
    });
    toast.success('Transação adicionada!');
  }, [addSystemNotification, checkMonthlyGoal]);

  const updateTransaction = useCallback((id: string, t: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...t } : tx));
    toast.success('Transação atualizada!');
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    toast.success('Transação excluída!');
  }, []);

  const addNote = useCallback((n: Omit<Note, 'id' | 'createdAt'>) => {
    const newN: Note = { ...n, id: generateId(), createdAt: format(new Date(), 'yyyy-MM-dd') };
    setNotes(prev => [newN, ...prev]);
    toast.success('Anotação salva!');
  }, []);

  const updateNote = useCallback((id: string, n: Partial<Note>) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, ...n } : note));
    toast.success('Anotação atualizada!');
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    toast.success('Anotação excluída!');
  }, []);

  const togglePinNote = useCallback((id: string) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, pinned: !note.pinned } : note));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...s }));
    toast.success('Configurações salvas!');
  }, []);

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
