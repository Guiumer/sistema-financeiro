export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  type: TransactionType;
  value: number;
  category: string;
  description: string;
  date: string;
  tags: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  pinned: boolean;
  transactionId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'warning' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Settings {
  monthlyGoal: number;
  largeExpenseThreshold: number;
  customCategories: string[];
}

export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Salário',
  'Outros',
];

export const DEFAULT_SETTINGS: Settings = {
  monthlyGoal: 3000,
  largeExpenseThreshold: 500,
  customCategories: [],
};
