import { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Wifi, LogOut, Loader2, UserPlus, Bot, KanbanSquare } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import KanbanPage from './pages/KanbanPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import WhatsAppConfigPage from './pages/WhatsAppConfigPage';
import MessageLogPage from './pages/MessageLogPage';
import UsersPage from './pages/UsersPage';
import BotConfigPage from './pages/BotConfigPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-75">
        <Loader2 className="animate-spin text-violet-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      window.location.assign('/login');
    }
  }

  const links = [
    { to: '/kanban', icon: KanbanSquare, label: 'Pipeline', count: null },
    { to: '/leads', icon: Users, label: 'Leads', count: null },
    { to: '/messages', icon: MessageSquare, label: 'Mensagens', count: null },
  ];

  const configLinks = [
    { to: '/whatsapp', icon: Wifi, label: 'WhatsApp' },
  ];

  if (profile?.role === 'superadmin' || profile?.role === 'tenant_admin') {
    configLinks.push({ to: '/bot-config', icon: Bot, label: 'Automacao' });
    configLinks.push({ to: '/users', icon: UserPlus, label: 'Usuarios' });
  }

  const roleLabels = {
    superadmin: 'Super Admin',
    tenant_admin: 'Administrador',
    tenant_user: 'Usuario',
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <aside className="w-[240px] bg-ink-0 border-r border-ink-150 min-h-screen p-[14px] shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-[10px] px-[10px] pb-5 pt-[6px]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-[14px] font-extrabold tracking-tighter shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">L</div>
        <span className="text-[15px] font-bold tracking-tight text-ink-900">leadtrack<span className="text-violet-500">.</span></span>
      </div>

      <nav className="flex-1 space-y-[2px]">
        {links.map(({ to, icon: Icon, label, count }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-[10px] px-[10px] py-2 rounded-lg text-[13px] font-medium transition-all duration-[120ms] ${
                active
                  ? 'bg-violet-50 text-violet-600 font-semibold'
                  : 'text-ink-600 hover:bg-ink-75 hover:text-ink-900'
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
              {count && (
                <span className={`ml-auto font-mono text-[10px] px-[6px] py-[1px] rounded-full ${active ? 'bg-violet-100 text-violet-700' : 'bg-ink-100 text-ink-500'}`}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500 px-[10px] pt-[14px] pb-1">Config</p>

        {configLinks.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-[10px] px-[10px] py-2 rounded-lg text-[13px] font-medium transition-all duration-[120ms] ${
                active
                  ? 'bg-violet-50 text-violet-600 font-semibold'
                  : 'text-ink-600 hover:bg-ink-75 hover:text-ink-900'
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="pt-[10px] border-t border-ink-100">
          <div className="flex items-center gap-[10px] px-[10px] py-[10px]">
            <div className="w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center text-[11px] font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-ink-900 truncate">{profile.full_name}</p>
              <p className="text-[10px] text-ink-500">{roleLabels[profile.role] || profile.role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-[10px] px-[10px] py-2 w-full text-[13px] text-danger-500 hover:bg-danger-50 rounded-lg transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} strokeWidth={1.75} />}
            {signingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      )}
    </aside>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-75">
        <Loader2 className="animate-spin text-violet-500" size={40} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/kanban" replace /> : <LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <div className="flex min-h-screen bg-ink-75">
              <Sidebar />
              <main className="flex-1 overflow-hidden min-w-0">
                <Routes>
                  <Route path="/" element={<Navigate to="/kanban" replace />} />
                  <Route path="/kanban" element={<KanbanPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/leads/:id" element={<LeadDetailPage />} />
                  <Route path="/messages" element={<MessageLogPage />} />
                  <Route path="/whatsapp" element={<WhatsAppConfigPage />} />
                  <Route path="/bot-config" element={<BotConfigPage />} />
                  <Route path="/users" element={<UsersPage />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
