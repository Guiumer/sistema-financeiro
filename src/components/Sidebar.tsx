import { useState } from 'react';
import { LayoutDashboard, ArrowLeftRight, FileText, Bell, Settings, TrendingUp, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Page = 'dashboard' | 'transacoes' | 'anotacoes' | 'notificacoes' | 'configuracoes';

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'transacoes', label: 'Transações', icon: <ArrowLeftRight size={20} /> },
  { id: 'anotacoes', label: 'Anotações', icon: <FileText size={20} /> },
  { id: 'notificacoes', label: 'Notificações', icon: <Bell size={20} /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
];

interface SidebarProps {
  current: Page;
  onChange: (page: Page) => void;
}

export default function Sidebar({ current, onChange }: SidebarProps) {
  const { unreadCount } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(page: Page) {
    onChange(page);
    setMobileOpen(false);
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 12px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px', borderBottom: '1px solid #2a2d3e', marginBottom: 16 }}>
        <div style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={18} color="#fff" />
        </div>
        <div>
          <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.2 }}>FinanceApp</p>
          <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>Controle pessoal</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const isActive = current === item.id;
            const isBell = item.id === 'notificacoes';
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: isActive ? '#60a5fa' : '#94a3b8',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 14,
                    textAlign: 'left',
                    transition: 'background 0.15s, color 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#252840'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {isActive && (
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#3b82f6', borderRadius: '0 2px 2px 0' }} />
                  )}
                  <span style={{ position: 'relative' }}>
                    {item.icon}
                    {isBell && unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', borderRadius: 99, width: 14, height: 14, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div style={{ paddingTop: 16, borderTop: '1px solid #2a2d3e' }}>
        <p style={{ color: '#64748b', fontSize: 11, textAlign: 'center' }}>v1.0.0 · Dados locais</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        style={{
          display: 'none',
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 60,
          background: '#1e2130',
          border: '1px solid #2a2d3e',
          borderRadius: 8,
          padding: 8,
          color: '#94a3b8',
          cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          className="mobile-overlay"
        />
      )}

      {/* Desktop sidebar */}
      <aside
        style={{
          width: 220,
          minHeight: '100vh',
          background: '#1a1d27',
          borderRight: '1px solid #2a2d3e',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
        className="desktop-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: mobileOpen ? 0 : -240,
          top: 0,
          width: 240,
          height: '100vh',
          background: '#1a1d27',
          borderRight: '1px solid #2a2d3e',
          zIndex: 50,
          overflowY: 'auto',
          transition: 'left 0.25s ease',
        }}
        className="mobile-sidebar"
      >
        <SidebarContent />
      </aside>
    </>
  );
}

export type { Page };
