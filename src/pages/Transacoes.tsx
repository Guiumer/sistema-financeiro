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

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); }

  function openEdit(tx: Transaction) {
    setForm({ type: tx.type, value: String(tx.value), category: tx.category, description: tx.description, date: tx.date, tags: tx.tags.join(', ') });
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
    if (editingId) { updateTransaction(editingId, parsed); } else { addTransaction(parsed); }
    setShowModal(false);
  }

  const totalReceitas = filtered.filter(t => t.type === 'receita').reduce((s, t) => s + t.value, 0);
  const totalDespesas = filtered.filter(t => t.type === 'despesa').reduce((s, t) => s + t.value, 0);

  return (
    <div className="page-padding" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Transações</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>Gerencie suas receitas e despesas</p>
        </div>
        <button onClick={openAdd} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Plus size={15} /> Nova
        </button>
      </div>

      {/* Summary — 3 cols desktop, 2+1 mobile */}
      <div className="summary-grid" style={{ display: 'grid', gap: 10 }}>
        {[
          { label: 'Receitas', value: totalReceitas, color: '#4ade80' },
          { label: 'Despesas', value: totalDespesas, color: '#f87171' },
          { label: 'Saldo', value: totalReceitas - totalDespesas, color: totalReceitas - totalDespesas >= 0 ? '#4ade80' : '#f87171' },
        ].map((item, i) => (
          <div key={item.label} className={i === 2 ? 'col-span-full-mobile' : ''} style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
            <p className="currency-value" style={{ color: item.color, fontWeight: 700, fontSize: 17, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 10, padding: '12px 14px' }}>
        <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 180px', minWidth: 0 }}>
            <Search size={14} color="#64748b" style={{ flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar descrição..." style={{ ...inputStyle, flex: 1 }} />
          </div>
          <FilterSelect value={filterType}     onChange={v => setFilterType(v as any)}    options={[{ value: 'all', label: 'Todos os tipos' }, { value: 'receita', label: 'Receitas' }, { value: 'despesa', label: 'Despesas' }]} />
          <FilterSelect value={filterCategory} onChange={setFilterCategory} options={[{ value: 'all', label: 'Todas categorias' }, ...allCategories.map(c => ({ value: c, label: c }))]} />
          <FilterSelect value={filterMonth}    onChange={setFilterMonth}    options={[{ value: 'all', label: 'Todos os meses' }, ...months.map(m => ({ value: m, label: fmtMonth(m) }))]} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, overflow: 'hidden' }}>
        <div className="table-scroll-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d3e' }}>
                <Th>Tipo</Th>
                <Th>Descrição</Th>
                <Th className="col-hide-mobile">Categoria</Th>
                <Th className="col-hide-mobile">Data</Th>
                <Th className="col-hide-mobile">Tags</Th>
                <Th>Valor</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Nenhuma transação encontrada</td></tr>
              ) : filtered.map(tx => (
                <tr key={tx.id}
                  style={{ borderBottom: '1px solid #2a2d3e', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#252840')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: tx.type === 'receita' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
                        {tx.type === 'receita' ? <ArrowUpRight size={13} color="#4ade80" /> : <ArrowDownRight size={13} color="#f87171" />}
                      </div>
                      <span style={{ fontSize: 11, color: tx.type === 'receita' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                        {tx.type === 'receita' ? 'Rec.' : 'Desp.'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', maxWidth: 160 }}>
                    <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>
                    {/* Show category + date inline on mobile since those cols are hidden */}
                    <p className="col-show-mobile-only" style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{tx.category} · {formatDate(tx.date)}</p>
                  </td>
                  <td className="col-hide-mobile" style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#252840', color: '#94a3b8', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{tx.category}</span>
                  </td>
                  <td className="col-hide-mobile" style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                  <td className="col-hide-mobile" style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {tx.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 4, padding: '1px 5px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Tag size={8} />{tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span className="currency-value" style={{ color: tx.type === 'receita' ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: 14 }}>
                      {tx.type === 'receita' ? '+' : '−'}{formatCurrency(tx.value)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button onClick={() => openEdit(tx)} style={actionBtn('#60a5fa', 'rgba(59,130,246,0.15)')}><Pencil size={13} /></button>
                      <button onClick={() => setDeleteConfirm(tx.id)} style={actionBtn('#f87171', 'rgba(239,68,68,0.15)')}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 14px', color: '#64748b', fontSize: 11, borderTop: '1px solid #2a2d3e' }}>
          {filtered.length} transação(ões)
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editingId ? 'Editar Transação' : 'Nova Transação'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Tipo *</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['receita', 'despesa'] as const).map(t => (
                  <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ padding: '8px', borderRadius: 8, border: `2px solid ${form.type === t ? (t === 'receita' ? '#22c55e' : '#ef4444') : '#2a2d3e'}`, background: form.type === t ? (t === 'receita' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent', color: form.type === t ? (t === 'receita' ? '#4ade80' : '#f87171') : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FieldInput label="Valor (R$) *" value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} placeholder="0,00" />
              <FieldInput label="Data *" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            </div>
            <FieldInput label="Descrição *" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Descrição da transação" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <span style={labelStyle}>Categoria *</span>
                <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <FieldInput label="Tags (vírgula)" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="ex: fixo, mensal" />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
              <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>Cancelar</button>
              <button type="submit" style={submitBtn}>{editingId ? 'Atualizar' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: '#94a3b8', marginBottom: 16, fontSize: 14 }}>Tem certeza que deseja excluir esta transação?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteConfirm(null)} style={cancelBtn}>Cancelar</button>
            <button onClick={() => { deleteTransaction(deleteConfirm); setDeleteConfirm(null); }} style={{ ...submitBtn, background: '#ef4444' }}>Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={className} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = 'text', required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', flex: '1 1 130px' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 14, padding: 22, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex' }}><X size={17} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: '#252840', border: '1px solid #2a2d3e', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, width: '100%', outline: 'none' };
const labelStyle: React.CSSProperties = { color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 };
const cancelBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: '1px solid #2a2d3e', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 };
const submitBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const actionBtn = (color: string, bg: string): React.CSSProperties => ({ background: bg, border: 'none', borderRadius: 6, padding: '5px', cursor: 'pointer', color, display: 'flex' });

function fmtMonth(ym: string): string {
  const [year, month] = ym.split('-');
  return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(month) - 1] + ' ' + year;
}
