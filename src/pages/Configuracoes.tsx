import { useState } from 'react';
import { Save, Download, Plus, X, Target, AlertTriangle, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

export default function Configuracoes() {
  const { settings, updateSettings, exportData } = useApp();
  const [monthlyGoal, setMonthlyGoal] = useState(String(settings.monthlyGoal));
  const [largeExpense, setLargeExpense] = useState(String(settings.largeExpenseThreshold));
  const [newCategory, setNewCategory] = useState('');

  function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    const goal = parseFloat(monthlyGoal.replace(',', '.'));
    const threshold = parseFloat(largeExpense.replace(',', '.'));
    if (!isNaN(goal) && goal > 0 && !isNaN(threshold) && threshold > 0) {
      updateSettings({ monthlyGoal: goal, largeExpenseThreshold: threshold });
    }
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (trimmed && !settings.customCategories.includes(trimmed)) {
      updateSettings({ customCategories: [...settings.customCategories, trimmed] });
      setNewCategory('');
    }
  }

  function removeCategory(cat: string) {
    updateSettings({ customCategories: settings.customCategories.filter(c => c !== cat) });
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configurações</h1>
        <p className="text-slate-400 text-sm mt-1">Personalize seu sistema financeiro</p>
      </div>

      {/* General Settings */}
      <Section title="Metas e Alertas" icon={<Target size={18} />}>
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm font-medium block mb-2">
              Meta de Gastos Mensal
            </label>
            <p className="text-slate-500 text-xs mb-2">
              Alerta quando gastos atingirem 80% deste valor. Atual: {formatCurrency(settings.monthlyGoal)}
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>R$</span>
              <input
                type="text"
                value={monthlyGoal}
                onChange={e => setMonthlyGoal(e.target.value)}
                placeholder="3000"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm font-medium block mb-2">
              Limite para Despesa Grande
            </label>
            <p className="text-slate-500 text-xs mb-2">
              Alerta ao registrar despesa acima deste valor. Atual: {formatCurrency(settings.largeExpenseThreshold)}
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>R$</span>
              <input
                type="text"
                value={largeExpense}
                onChange={e => setLargeExpense(e.target.value)}
                placeholder="500"
                style={inputStyle}
              />
            </div>
          </div>
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Save size={15} /> Salvar Configurações
          </button>
        </form>
      </Section>

      {/* Custom Categories */}
      <Section title="Categorias Personalizadas" icon={<Tag size={18} />}>
        <p className="text-slate-500 text-xs mb-4">
          Adicione categorias além das padrão (Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Salário, Outros).
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="Nova categoria..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={addCategory} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
            <Plus size={14} /> Adicionar
          </button>
        </div>
        {settings.customCategories.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>Nenhuma categoria personalizada criada.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {settings.customCategories.map(cat => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#252840', border: '1px solid #2a2d3e', borderRadius: 6, padding: '5px 10px' }}>
                <span style={{ color: '#e2e8f0', fontSize: 13 }}>{cat}</span>
                <button onClick={() => removeCategory(cat)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Export */}
      <Section title="Exportar Dados" icon={<Download size={18} />}>
        <p className="text-slate-400 text-sm mb-4">
          Exporte todos os seus dados (transações, anotações, notificações e configurações) em formato JSON.
        </p>
        <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <Download size={15} /> Exportar JSON
        </button>
      </Section>

      {/* Alert info */}
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12 }}>
        <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ color: '#fbbf24', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Sobre os dados</p>
          <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
            Todos os dados são armazenados localmente no seu navegador via LocalStorage. Limpar o cache do navegador irá remover todos os dados. Use a exportação JSON para fazer backups periódicos.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #2a2d3e' }}>
        <span style={{ color: '#60a5fa' }}>{icon}</span>
        <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, margin: 0 }}>{title}</h2>
      </div>
      {children}
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
