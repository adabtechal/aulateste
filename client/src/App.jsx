import { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Wifi, LogOut, Loader2, UserPlus, Bot } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
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
      // Fallback final: força ida para /login mesmo se algo deu errado.
      window.location.assign('/login');
    }
  }

  const links = [
    { to: '/kanban', icon: LayoutDashboard, label: 'Kanban' },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/messages', icon: MessageSquare, label: 'Mensagens' },
    { to: '/whatsapp', icon: Wifi, label: 'WhatsApp' },
  ];

  if (profile?.role === 'superadmin' || profile?.role === 'tenant_admin') {
    links.push({ to: '/bot-config', icon: Bot, label: 'Bot' });
    links.push({ to: '/users', icon: UserPlus, label: 'Usuários' });
  }

  const roleLabels = {
    superadmin: 'Super Admin',
    tenant_admin: 'Administrador',
    tenant_user: 'Usuário',
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 shrink-0 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">LeadTrack Pro</h1>
        <p className="text-sm text-gray-500">Pipeline de Vendas</p>
      </div>
      <nav className="space-y-1 flex-1">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="pt-4 border-t border-gray-200">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-gray-500">{roleLabels[profile.role] || profile.role}</p>
            {profile.tenant?.name && (
              <p className="text-xs text-gray-400 truncate">{profile.tenant.name}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-3 py-2 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
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
            <div className="flex min-h-screen bg-gray-50">
              <Sidebar />
              <main className="flex-1 overflow-hidden">
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
