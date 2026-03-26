import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Wifi } from 'lucide-react';
import KanbanPage from './pages/KanbanPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import WhatsAppConfigPage from './pages/WhatsAppConfigPage';
import MessageLogPage from './pages/MessageLogPage';

function Sidebar() {
  const location = useLocation();
  const links = [
    { to: '/kanban', icon: LayoutDashboard, label: 'Kanban' },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/messages', icon: MessageSquare, label: 'Mensagens' },
    { to: '/whatsapp', icon: Wifi, label: 'WhatsApp' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 shrink-0">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">LeadTrack Pro</h1>
        <p className="text-sm text-gray-500">Pipeline de Vendas</p>
      </div>
      <nav className="space-y-1">
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
    </aside>
  );
}

export default function App() {
  return (
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
        </Routes>
      </main>
    </div>
  );
}
