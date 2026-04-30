// Sidebar.jsx
const { useState } = React;

function Sidebar({ current, onNav }) {
  const links = [
    { id: 'pipeline', icon: 'kanban-square', label: 'Pipeline', count: '28' },
    { id: 'leads', icon: 'users', label: 'Leads', count: '1.2k' },
    { id: 'messages', icon: 'message-circle', label: 'Mensagens', count: null },
    { id: 'automation', icon: 'bot', label: 'Automação', count: null },
  ];
  const config = [
    { id: 'whatsapp', icon: 'smartphone', label: 'WhatsApp' },
    { id: 'settings', icon: 'settings', label: 'Preferências' },
  ];
  return (
    <aside className="ui-sidebar">
      <div className="ui-brand">
        <div className="ui-brand-mark">L</div>
        <div className="ui-brand-wm">leadtrack<span className="d">.</span></div>
      </div>
      <nav className="ui-nav">
        {links.map(l => (
          <a key={l.id} className={current === l.id ? 'active' : ''} onClick={() => onNav(l.id)}>
            <i data-lucide={l.icon}></i>{l.label}
            {l.count && <span className="count">{l.count}</span>}
          </a>
        ))}
        <div className="ui-section-label">Config</div>
        {config.map(l => (
          <a key={l.id} className={current === l.id ? 'active' : ''} onClick={() => onNav(l.id)}>
            <i data-lucide={l.icon}></i>{l.label}
          </a>
        ))}
      </nav>
      <div className="ui-user">
        <div className="ui-user-avatar">JP</div>
        <div>
          <div className="ui-user-name">João Pedro</div>
          <div className="ui-user-role">Administrador</div>
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
