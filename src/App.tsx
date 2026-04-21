import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Sidebar, { type Page } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transacoes from './pages/Transacoes';
import Anotacoes from './pages/Anotacoes';
import Notificacoes from './pages/Notificacoes';
import Configuracoes from './pages/Configuracoes';
import AuthPage from './pages/Login';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2a2d3e', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b', fontSize: 14 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    transacoes: <Transacoes />,
    anotacoes: <Anotacoes />,
    notificacoes: <Notificacoes />,
    configuracoes: <Configuracoes />,
  };

  return (
    // key={user.id} ensures AppProvider fully remounts on user change
    <AppProvider key={user.id} userId={user.id}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>
        <Sidebar current={page} onChange={setPage} />
        <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden', overflowY: 'auto' }}>
          {pages[page]}
        </main>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1e2130', color: '#e2e8f0', border: '1px solid #2a2d3e', fontSize: 13, borderRadius: 10 },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1e2130' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e2130' } },
        }}
      />
    </AuthProvider>
  );
}
