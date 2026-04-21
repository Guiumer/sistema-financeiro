import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Sidebar, { type Page } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transacoes from './pages/Transacoes';
import Anotacoes from './pages/Anotacoes';
import Notificacoes from './pages/Notificacoes';
import Configuracoes from './pages/Configuracoes';

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard');

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    transacoes: <Transacoes />,
    anotacoes: <Anotacoes />,
    notificacoes: <Notificacoes />,
    configuracoes: <Configuracoes />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>
      <Sidebar current={page} onChange={setPage} />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {pages[page]}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e2130',
            color: '#e2e8f0',
            border: '1px solid #2a2d3e',
            fontSize: 13,
            borderRadius: 10,
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1e2130' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e2130' } },
        }}
      />
    </AppProvider>
  );
}
