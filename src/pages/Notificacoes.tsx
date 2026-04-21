import { CheckCheck, Bell, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Notification } from '../types';
import { formatDateTime } from '../utils/format';

export default function Notificacoes() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useApp();

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notificações</h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllNotificationsRead} style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <CheckCheck size={15} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
          <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(notif => (
            <NotificationCard key={notif.id} notif={notif} onRead={() => markNotificationRead(notif.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({ notif, onRead }: { notif: Notification; onRead: () => void }) {
  const config = {
    warning: { icon: <AlertTriangle size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
    error: { icon: <XCircle size={18} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
    success: { icon: <CheckCircle size={18} />, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
    info: { icon: <Info size={18} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  };

  const { icon, color, bg, border } = config[notif.type];

  return (
    <div
      style={{
        background: notif.read ? '#1e2130' : '#1e2130',
        border: `1px solid ${notif.read ? '#2a2d3e' : border}`,
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        opacity: notif.read ? 0.65 : 1,
      }}
    >
      <div style={{ background: bg, color, borderRadius: 8, padding: 8, flexShrink: 0, display: 'flex' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, margin: 0 }}>{notif.title}</p>
          {!notif.read && (
            <span style={{ background: color, borderRadius: 99, width: 8, height: 8, flexShrink: 0 }} />
          )}
        </div>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 8px' }}>{notif.message}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>{formatDateTime(notif.createdAt)}</span>
          {!notif.read && (
            <button onClick={onRead} style={{ background: 'transparent', border: '1px solid #2a2d3e', borderRadius: 5, padding: '3px 10px', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
              Marcar como lida
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
