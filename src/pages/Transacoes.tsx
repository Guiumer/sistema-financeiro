import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, X, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Transaction } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { format } from 'date-fns';

const EMPTY_FORM = {
  type: 'despesa' as 'receita' | 'despesa',
  value: '',
  category: 'Alimentação',
  description: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  tags: '',
};

export default function Transacoes() {
  const { transactions, settings, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const allCategories = [...DEFAULT_CATEGORIES, ...settings.customCategories];

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const months = useMemo(() => {
    const seen = new Set<string>();
    transactions.forEach(t => {
      const [y, m] = t.date.split('-');
      seen.add(`${y}-${m}`);
    });
    return Array.from(seen).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterCategory === 'all' || t.category === filterCategory)
      .filter(t => {
        if (filterMonth === 'all') return true;
        const [y, m] = t.date.split('-');
        return `${y}-${m}` === filterMonth;
      })
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, filterMonth, search]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(tx: Transaction) {
    setForm({
      type: tx.type,
      value: String(tx.value),
      category: tx.category,
      description: tx.description,
      date: tx.date,
      tags: tx.tags.join(', '),
    });
    setEditingId(tx.id);
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = {
      type: form.type,
      value: parseFloat(form.value.replace(',', '.')),
      category: form.category,
      description: form.description,
      date: form.date,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    if (isNaN(parsed.value) || parsed.value <= 0) return;
    if (editingId) {
      updateTransaction(editingId, parsed);
    } else {
      addTransaction(parsed);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    deleteTransaction(id);
    setDeleteConfirm(null);
  }

  const totalReceitas = filtered.filter(t => t.type === 'receita').reduce((s, t) => s + t.value, 0);
  const totalDespesas = filtered.filter(t => t.type === 'despesa').reduce((s, t) => s + t.value, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transações</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie suas receitas e despesas</p>
        </div>
        <button onClick={openAdd} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Receitas filtradas', value: totalReceitas, color: '#4ade80' },
          { label: 'Despesas filtradas', value: totalDespesas, color: '#f87171' },
          { label: 'Saldo filtrado', value: totalReceitas - totalDespesas, color: totalReceitas - totalDespesas >= 0 ? '#4ade80' : '#f87171' },
        ].map(item => (
          <div key={item.label} style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 10, padding: '14px 18px' }}>
            <p className="text-slate-400 text-xs mb-1">{item.label}</p>
            <p style={{ color: item.color, fontWeight: 700, fontSize: 18 }}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 10, padding: '14px 18px' }}>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por descrição..."
              style={{ background: '#252840', border: '1px solid #2a2d3e', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13, width: '100%', outline: 'none' }}
            />
          </div>
          <FilterSelect value={filterType} onChange={v => setFilterType(v as any)} options={[{ value: 'all', label: 'Todos os tipos' }, { value: 'receita', label: 'Receitas' }, { value: 'despesa', label: 'Despesas' }]} />
          <FilterSelect value={filterCategory} onChange={setFilterCategory} options={[{ value: 'all', label: 'Todas categorias' }, ...allCategories.map(c => ({ value: c, label: c }))]} />
          <FilterSelect value={filterMonth} onChange={setFilterMonth} options={[{ value: 'all', label: 'Todos os meses' }, ...months.map(m => ({ value: m, label: formatMonthLabel(m) }))]} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d3e' }}>
                {['Tipo', 'Descrição', 'Categoria', 'Data', 'Tags', 'Valor', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Nenhuma transação encontrada</td></tr>
              ) : filtered.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #2a2d3e' }} onMouseEnter={e => (e.currentTarget.style.background = '#252840')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 'max-content' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tx.type === 'receita' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
                        {tx.type === 'receita' ? <ArrowUpRight size={14} color="#4ade80" /> : <ArrowDownRight size={14} color="#f87171" />}
                      </div>
                      <span style={{ fontSize: 12, color: tx.type === 'receita' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                        {tx.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: 14 }}>{tx.description}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#252840', color: '#94a3b8', borderRadius: 4, padding: '3px 8px', fontSize: 12 }}>{tx.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {tx.tags.map(tag => (
                        <span key={tag} style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 4, padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Tag size={9} />{tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', color: tx.type === 'receita' ? '#4ade80' : '#f87171' }}>
                    {tx.type === 'receita' ? '+' : '-'}{formatCurrency(tx.value)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(tx)} style={{ background: 'rgba(59,130,246,0.15)', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#60a5fa', display: 'flex' }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(tx.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#f87171', display: 'flex' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', color: '#64748b', fontSize: 12, borderTop: '1px solid #2a2d3e' }}>
          {filtered.length} transação(ões) encontrada(s)
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editingId ? 'Editar Transação' : 'Nova Transação'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block">
                <span className="text-slate-400 text-xs font-medium block mb-1">Tipo *</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['receita', 'despesa'] as const).map(t => (
                    <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      style={{ padding: '8px', borderRadius: 8, border: `2px solid ${form.type === t ? (t === 'receita' ? '#22c55e' : '#ef4444') : '#2a2d3e'}`, background: form.type === t ? (t === 'receita' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent', color: form.type === t ? (t === 'receita' ? '#4ade80' : '#f87171') : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-slate-400 text-xs font-medium block mb-1">Valor (R$) *</span>
                <input required value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00" type="text" style={inputStyle} />
              </label>
              <label className="block">
                <span className="text-slate-400 text-xs font-medium block mb-1">Data *</span>
                <input required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} type="date" style={inputStyle} />
              </label>
              <label className="block col-span-2">
                <span className="text-slate-400 text-xs font-medium block mb-1">Descrição *</span>
                <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição da transação" style={inputStyle} />
              </label>
              <label className="block">
                <span className="text-slate-400 text-xs font-medium block mb-1">Categoria *</span>
                <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-slate-400 text-xs font-medium block mb-1">Tags (separadas por vírgula)</span>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="ex: fixo, mensal" style={inputStyle} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2a2d3e', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                {editingId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-300 mb-4">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2a2d3e', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ background: '#252840', border: '1px solid #2a2d3e', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 13, cursor: 'pointer', outline: 'none' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 14, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#252840',
  border: '1px solid #2a2d3e',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#e2e8f0',
  fontSize: 13,
  width: '100%',
  outline: 'none',
};

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]} ${year}`;
}
