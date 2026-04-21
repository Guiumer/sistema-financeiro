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
    current.forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + t.value; });
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
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 600, fontSize: 12 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, margin: '2px 0', fontSize: 12 }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-padding" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>Visão geral do mês atual</p>
        </div>
      </div>

      {/* Stat Cards — 2 cols on mobile, 4 on desktop */}
      <div className="stat-grid" style={{ display: 'grid', gap: 12 }}>
        <StatCard title="Saldo Atual"    value={formatCurrency(currentMonthStats.saldo)}    icon={<Wallet size={18}/>}     color={currentMonthStats.saldo >= 0 ? 'green' : 'red'} subtitle="Receitas − Despesas" />
        <StatCard title="Total Receitas" value={formatCurrency(currentMonthStats.receitas)} icon={<TrendingUp size={18}/>}  color="green"  subtitle="Mês atual" />
        <StatCard title="Total Despesas" value={formatCurrency(currentMonthStats.despesas)} icon={<TrendingDown size={18}/>} color="red"   subtitle="Mês atual" />
        {/* Goal card */}
        <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>Meta Mensal</span>
            <Target size={18} color="#60a5fa" />
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{goalPct.toFixed(0)}%</p>
          <div style={{ background: '#2a2d3e', borderRadius: 4, height: 5, margin: '8px 0 6px' }}>
            <div style={{ width: `${goalPct}%`, height: '100%', borderRadius: 4, transition: 'width 0.5s', background: goalPct >= 100 ? '#ef4444' : goalPct >= 80 ? '#f59e0b' : '#22c55e' }} />
          </div>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formatCurrency(currentMonthStats.despesas)} / {formatCurrency(settings.monthlyGoal)}
          </p>
        </div>
      </div>

      {/* Charts — side-by-side on desktop, stacked on mobile */}
      <div className="chart-grid" style={{ display: 'grid', gap: 12 }}>
        <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 16, minWidth: 0 }}>
          <h2 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, margin: '0 0 16px' }}>Receitas x Despesas (6 meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last6MonthsData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
              <Bar dataKey="receitas" fill="#22c55e" radius={[3, 3, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="#ef4444" radius={[3, 3, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 16, minWidth: 0 }}>
          <h2 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, margin: '0 0 12px' }}>Gastos por Categoria</h2>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(Number(v))} contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {categoryData.slice(0, 5).map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: '#94a3b8', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Sem despesas este mês</p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 16, minWidth: 0 }}>
        <h2 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, margin: '0 0 14px' }}>Últimas Transações</h2>
        <div>
          {recentTransactions.map((tx, idx) => (
            <div key={tx.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', gap: 10,
              borderBottom: idx < recentTransactions.length - 1 ? '1px solid #2a2d3e' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: tx.type === 'receita' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                }}>
                  {tx.type === 'receita' ? <ArrowUpRight size={15} color="#4ade80" /> : <ArrowDownRight size={15} color="#f87171" />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>
                  <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{tx.category} · {formatDate(tx.date)}</p>
                </div>
              </div>
              <span className="currency-value" style={{ color: tx.type === 'receita' ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: 14, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {tx.type === 'receita' ? '+' : '−'}{formatCurrency(tx.value)}
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
  const colors   = { green: '#22c55e', red: '#ef4444', blue: '#3b82f6' };
  const bgColors = { green: 'rgba(34,197,94,0.12)', red: 'rgba(239,68,68,0.12)', blue: 'rgba(59,130,246,0.12)' };
  return (
    <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{title}</span>
        <div style={{ background: bgColors[color], color: colors[color], borderRadius: 8, padding: 6, display: 'flex' }}>{icon}</div>
      </div>
      <p className="currency-value" style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{subtitle}</p>
    </div>
  );
}
