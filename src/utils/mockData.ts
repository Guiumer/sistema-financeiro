import type { Transaction, Note, Notification } from '../types';
import { subMonths, format, subDays } from 'date-fns';

const now = new Date();

function dateStr(monthsAgo: number, day: number): string {
  const d = subMonths(now, monthsAgo);
  d.setDate(day);
  return format(d, 'yyyy-MM-dd');
}

export const mockTransactions: Transaction[] = [
  // Mês atual
  { id: '1', type: 'receita', value: 5500, category: 'Salário', description: 'Salário mensal', date: dateStr(0, 5), tags: ['fixo'], createdAt: dateStr(0, 5) },
  { id: '2', type: 'despesa', value: 1200, category: 'Moradia', description: 'Aluguel', date: dateStr(0, 5), tags: ['fixo'], createdAt: dateStr(0, 5) },
  { id: '3', type: 'despesa', value: 380, category: 'Alimentação', description: 'Supermercado Extra', date: dateStr(0, 7), tags: ['compras'], createdAt: dateStr(0, 7) },
  { id: '4', type: 'despesa', value: 150, category: 'Transporte', description: 'Combustível', date: dateStr(0, 8), tags: [], createdAt: dateStr(0, 8) },
  { id: '5', type: 'despesa', value: 89.90, category: 'Saúde', description: 'Farmácia', date: dateStr(0, 10), tags: ['saúde'], createdAt: dateStr(0, 10) },
  { id: '6', type: 'despesa', value: 250, category: 'Lazer', description: 'Cinema e jantar', date: dateStr(0, 12), tags: ['lazer'], createdAt: dateStr(0, 12) },
  { id: '7', type: 'receita', value: 800, category: 'Outros', description: 'Freelance design', date: dateStr(0, 14), tags: ['extra'], createdAt: dateStr(0, 14) },
  { id: '8', type: 'despesa', value: 199, category: 'Educação', description: 'Curso online', date: dateStr(0, 15), tags: ['desenvolvimento'], createdAt: dateStr(0, 15) },
  { id: '9', type: 'despesa', value: 120, category: 'Alimentação', description: 'Restaurante semana', date: dateStr(0, 17), tags: [], createdAt: dateStr(0, 17) },
  { id: '10', type: 'despesa', value: 75, category: 'Saúde', description: 'Academia mensal', date: dateStr(0, 18), tags: ['saúde', 'fixo'], createdAt: dateStr(0, 18) },

  // Mês anterior
  { id: '11', type: 'receita', value: 5500, category: 'Salário', description: 'Salário mensal', date: dateStr(1, 5), tags: ['fixo'], createdAt: dateStr(1, 5) },
  { id: '12', type: 'despesa', value: 1200, category: 'Moradia', description: 'Aluguel', date: dateStr(1, 5), tags: ['fixo'], createdAt: dateStr(1, 5) },
  { id: '13', type: 'despesa', value: 410, category: 'Alimentação', description: 'Supermercado', date: dateStr(1, 8), tags: [], createdAt: dateStr(1, 8) },
  { id: '14', type: 'despesa', value: 160, category: 'Transporte', description: 'Combustível e pedágio', date: dateStr(1, 10), tags: [], createdAt: dateStr(1, 10) },
  { id: '15', type: 'despesa', value: 600, category: 'Saúde', description: 'Consulta médica especialista', date: dateStr(1, 12), tags: ['saúde'], createdAt: dateStr(1, 12) },
  { id: '16', type: 'despesa', value: 180, category: 'Lazer', description: 'Show de música', date: dateStr(1, 15), tags: ['lazer'], createdAt: dateStr(1, 15) },
  { id: '17', type: 'receita', value: 450, category: 'Outros', description: 'Venda de equipamento', date: dateStr(1, 18), tags: ['extra'], createdAt: dateStr(1, 18) },
  { id: '18', type: 'despesa', value: 290, category: 'Educação', description: 'Livros técnicos', date: dateStr(1, 20), tags: [], createdAt: dateStr(1, 20) },
  { id: '19', type: 'despesa', value: 75, category: 'Saúde', description: 'Academia mensal', date: dateStr(1, 5), tags: ['fixo'], createdAt: dateStr(1, 5) },
  { id: '20', type: 'despesa', value: 95, category: 'Alimentação', description: 'Delivery semana', date: dateStr(1, 22), tags: [], createdAt: dateStr(1, 22) },

  // 2 meses atrás
  { id: '21', type: 'receita', value: 5500, category: 'Salário', description: 'Salário mensal', date: dateStr(2, 5), tags: ['fixo'], createdAt: dateStr(2, 5) },
  { id: '22', type: 'despesa', value: 1200, category: 'Moradia', description: 'Aluguel', date: dateStr(2, 5), tags: ['fixo'], createdAt: dateStr(2, 5) },
  { id: '23', type: 'despesa', value: 350, category: 'Alimentação', description: 'Supermercado', date: dateStr(2, 7), tags: [], createdAt: dateStr(2, 7) },
  { id: '24', type: 'despesa', value: 140, category: 'Transporte', description: 'Combustível', date: dateStr(2, 9), tags: [], createdAt: dateStr(2, 9) },
  { id: '25', type: 'despesa', value: 110, category: 'Lazer', description: 'Streaming e jogos', date: dateStr(2, 11), tags: [], createdAt: dateStr(2, 11) },
  { id: '26', type: 'receita', value: 1200, category: 'Outros', description: 'Bônus trimestral', date: dateStr(2, 13), tags: ['extra', 'bônus'], createdAt: dateStr(2, 13) },
  { id: '27', type: 'despesa', value: 75, category: 'Saúde', description: 'Academia mensal', date: dateStr(2, 5), tags: ['fixo'], createdAt: dateStr(2, 5) },
  { id: '28', type: 'despesa', value: 220, category: 'Educação', description: 'Mensalidade curso', date: dateStr(2, 15), tags: [], createdAt: dateStr(2, 15) },
  { id: '29', type: 'despesa', value: 85, category: 'Alimentação', description: 'Restaurante', date: dateStr(2, 20), tags: [], createdAt: dateStr(2, 20) },
  { id: '30', type: 'despesa', value: 320, category: 'Moradia', description: 'Conta de luz e internet', date: dateStr(2, 18), tags: ['fixo'], createdAt: dateStr(2, 18) },
];

export const mockNotes: Note[] = [
  {
    id: 'n1',
    title: 'Planejamento financeiro 2025',
    content: 'Meta: economizar 20% do salário por mês.\n- Reduzir gastos com lazer\n- Investir em renda fixa\n- Criar reserva de emergência de 6 meses',
    date: format(subDays(now, 5), 'yyyy-MM-dd'),
    pinned: true,
    createdAt: format(subDays(now, 5), 'yyyy-MM-dd'),
  },
  {
    id: 'n2',
    title: 'Consulta médica cara',
    content: 'Gastei R$ 600 na consulta com especialista. Verificar reembolso pelo plano de saúde.',
    date: dateStr(1, 12),
    pinned: false,
    transactionId: '15',
    createdAt: dateStr(1, 12),
  },
  {
    id: 'n3',
    title: 'Ideias para renda extra',
    content: '1. Freelances de design\n2. Vender fotos no stock\n3. Consultoria\n4. Criar curso online',
    date: format(subDays(now, 10), 'yyyy-MM-dd'),
    pinned: true,
    createdAt: format(subDays(now, 10), 'yyyy-MM-dd'),
  },
  {
    id: 'n4',
    title: 'Revisão do mês passado',
    content: 'Gastei demais com saúde este mês (R$ 675). Preciso revisar os planos de saúde disponíveis.',
    date: dateStr(1, 28),
    pinned: false,
    createdAt: dateStr(1, 28),
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    type: 'warning',
    title: 'Meta mensal em risco',
    message: 'Seus gastos atingiram 82% da meta mensal de R$ 3.000,00.',
    read: false,
    createdAt: format(subDays(now, 1), 'yyyy-MM-dd\'T\'HH:mm:ss'),
  },
  {
    id: 'notif2',
    type: 'warning',
    title: 'Despesa grande detectada',
    message: 'Uma despesa de R$ 600,00 foi registrada em Saúde (Consulta médica especialista).',
    read: true,
    createdAt: dateStr(1, 12) + 'T10:30:00',
  },
  {
    id: 'notif3',
    type: 'success',
    title: 'Receita registrada',
    message: 'Bônus trimestral de R$ 1.200,00 registrado com sucesso.',
    read: true,
    createdAt: dateStr(2, 13) + 'T14:00:00',
  },
];
