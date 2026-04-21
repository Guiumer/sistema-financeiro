import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, isSameMonth } from '../utils/format';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORY_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

export default function Dashboard() {
  const { transactions, settings } = useApp();

  const currentMonthStats = useMemo(() => {
    const current = transactions.filter(t => isSameMonth(t.date, 0));
    const receitas = current.filter(t => t.type === 'receita').reduce((s, t) => s + t.value, 0);
    const despesas = current.filter(t => t.type === 'despesa').reduce((s, t) => s + t.value, 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [transactions]);

  const last6MonthsData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const monthsAgo = 5 - i;
      const d = subMonths(new Date(), monthsAgo);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const monthTx = transactions.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        return y === year && m === month;
      });
      return {
        name: format(d, 'MMM', { locale: ptBR }),
        receitas: monthTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.value, 0),
        despesas: monthTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.value, 0),
      };
    });
  }, [transactions]);

  const categoryData = useMemo(() => {
    const current = transactions.filter(t => isSameMonth(t.date, 0) && t.type === 'despesa');
    const grouped: Record<string, number> = {};
    current.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.value;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const goalPct = Math.min((currentMonthStats.despesas / settings.monthlyGoal) * 100, 100);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Visão geral do mês atual</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Atual"
          value={formatCurrency(currentMonthStats.saldo)}
          icon={<Wallet size={20} />}
          color={currentMonthStats.saldo >= 0 ? 'green' : 'red'}
          subtitle="Receitas - Despesas"
        />
        <StatCard
          title="Total Receitas"
          value={formatCurrency(currentMonthStats.receitas)}
          icon={<TrendingUp size={20} />}
          color="green"
          subtitle="Mês atual"
        />
        <StatCard
          title="Total Despesas"
          value={formatCurrency(currentMonthStats.despesas)}
          icon={<TrendingDown size={20} />}
          color="red"
          subtitle="Mês atual"
        />
        <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 20 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Meta Mensal</span>
            <Target size={20} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{goalPct.toFixed(0)}%</p>
          <div style={{ background: '#2a2d3e', borderRadius: 4, height: 6, marginTop: 10, marginBottom: 6 }}>
            <div
              style={{
                width: `${goalPct}%`,
                height: '100%',
                borderRadius: 4,
                background: goalPct >= 100 ? '#ef4444' : goalPct >= 80 ? '#f59e0b' : '#22c55e',
                transition: 'width 0.5s',
              }}
            />
          </div>
          <p className="text-xs text-slate-400">{formatCurrency(currentMonthStats.despesas)} / {formatCurrency(settings.monthlyGoal)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 20 }} className="lg:col-span-2">
          <h2 className="text-slate-200 font-semibold mb-4">Receitas x Despesas (últimos 6 meses)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last6MonthsData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 20 }}>
          <h2 className="text-slate-200 font-semibold mb-4">Gastos por Categoria</h2>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {categoryData.slice(0, 5).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }} />
                      <span className="text-slate-400 text-xs">{item.name}</span>
                    </div>
                    <span className="text-slate-300 text-xs font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center mt-8">Sem despesas este mês</p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 20 }}>
        <h2 className="text-slate-200 font-semibold mb-4">Últimas Transações</h2>
        <div className="space-y-3">
          {recentTransactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #2a2d3e' }}>
              <div className="flex items-center gap-3">
                <div style={{
                  width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: tx.type === 'receita' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                }}>
                  {tx.type === 'receita'
                    ? <ArrowUpRight size={16} className="text-green-400" />
                    : <ArrowDownRight size={16} className="text-red-400" />
                  }
                </div>
                <div>
                  <p className="text-slate-200 text-sm font-medium">{tx.description}</p>
                  <p className="text-slate-500 text-xs">{tx.category} · {formatDate(tx.date)}</p>
                </div>
              </div>
              <span style={{ color: tx.type === 'receita' ? '#4ade80' : '#f87171', fontWeight: 600, fontSize: 15 }}>
                {tx.type === 'receita' ? '+' : '-'}{formatCurrency(tx.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }: {
  title: string; value: string; icon: React.ReactNode; color: 'green' | 'red' | 'blue'; subtitle: string;
}) {
  const colors = { green: '#22c55e', red: '#ef4444', blue: '#3b82f6' };
  const bgColors = { green: 'rgba(34,197,94,0.12)', red: 'rgba(239,68,68,0.12)', blue: 'rgba(59,130,246,0.12)' };
  return (
    <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 20 }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        <div style={{ background: bgColors[color], color: colors[color], borderRadius: 8, padding: '6px' }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}
