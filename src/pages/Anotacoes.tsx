import { useState, useMemo } from 'react';
import { Plus, Pin, Trash2, Pencil, Link } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Note } from '../types';
import { formatDate } from '../utils/format';
import { Modal } from './Transacoes';
import { format } from 'date-fns';

const EMPTY_FORM = {
  title: '',
  content: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  pinned: false,
  transactionId: '',
};

export default function Anotacoes() {
  const { notes, transactions, addNote, updateNote, deleteNote, togglePinNote } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    return [...notes]
      .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [notes, search]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(note: Note) {
    setForm({
      title: note.title,
      content: note.content,
      date: note.date,
      pinned: note.pinned,
      transactionId: note.transactionId || '',
    });
    setEditingId(note.id);
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      title: form.title,
      content: form.content,
      date: form.date,
      pinned: form.pinned,
      transactionId: form.transactionId || undefined,
    };
    if (editingId) {
      updateNote(editingId, data);
    } else {
      addNote(data);
    }
    setShowModal(false);
  }

  const getLinkedTransaction = (txId?: string) => {
    return txId ? transactions.find(t => t.id === txId) : undefined;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Anotações</h1>
          <p className="text-slate-400 text-sm mt-1">Bloco de notas financeiras</p>
        </div>
        <button onClick={openAdd} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          <Plus size={16} /> Nova Anotação
        </button>
      </div>

      <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 14px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar anotações..."
          style={{ background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: 13, width: '100%', outline: 'none' }}
        />
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <p>Nenhuma anotação encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(note => {
            const linked = getLinkedTransaction(note.transactionId);
            return (
              <div key={note.id} style={{ background: '#1e2130', border: `1px solid ${note.pinned ? '#3b82f6' : '#2a2d3e'}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                {note.pinned && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <Pin size={14} color="#60a5fa" fill="#60a5fa" />
                  </div>
                )}
                <div>
                  <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, margin: 0, paddingRight: 20 }}>{note.title}</h3>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{formatDate(note.date)}</p>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{note.content}</p>
                {linked && (
                  <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link size={12} color="#60a5fa" />
                    <span style={{ color: '#60a5fa', fontSize: 12 }}>{linked.description} · R$ {linked.value.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px solid #2a2d3e' }}>
                  <button onClick={() => togglePinNote(note.id)} title={note.pinned ? 'Desafixar' : 'Fixar'} style={{ background: note.pinned ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.1)', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: note.pinned ? '#60a5fa' : '#64748b', display: 'flex' }}>
                    <Pin size={14} />
                  </button>
                  <button onClick={() => openEdit(note)} style={{ background: 'rgba(59,130,246,0.15)', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#60a5fa', display: 'flex' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteConfirm(note.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', color: '#f87171', display: 'flex' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? 'Editar Anotação' : 'Nova Anotação'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-slate-400 text-xs font-medium block mb-1">Título *</span>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título da anotação" style={inputStyle} />
            </label>
            <label className="block">
              <span className="text-slate-400 text-xs font-medium block mb-1">Conteúdo *</span>
              <textarea required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Escreva sua anotação..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-slate-400 text-xs font-medium block mb-1">Data *</span>
                <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </label>
              <label className="block">
                <span className="text-slate-400 text-xs font-medium block mb-1">Vincular transação</span>
                <select value={form.transactionId} onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Nenhuma</option>
                  {transactions.slice(0, 30).map(t => (
                    <option key={t.id} value={t.id}>{t.description} (R$ {t.value.toFixed(2)})</option>
                  ))}
                </select>
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <span className="text-slate-400 text-sm">Fixar anotação</span>
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2a2d3e', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                {editingId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteConfirm(null)}>
          <p className="text-slate-300 mb-4">Tem certeza que deseja excluir esta anotação?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2a2d3e', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            <button onClick={() => { deleteNote(deleteConfirm); setDeleteConfirm(null); }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Excluir</button>
          </div>
        </Modal>
      )}
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
