// KanbanScreen.jsx
function colorInitial(name) {
  const colors = ['var(--violet-500)', 'var(--coral-500)', 'var(--ink-700)', '#2b6ef0', '#16a365'];
  const h = [...name].reduce((a,c)=>a+c.charCodeAt(0),0);
  return colors[h % colors.length];
}

function LeadCard({ lead, onClick }) {
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div className={'ui-lead-card' + (lead.hot ? ' hot' : '')} onClick={onClick}>
      <div className="ui-lead-head">
        <div>
          <div className="ui-lead-name">{lead.name}</div>
          <div className="ui-lead-phone">{lead.phone}</div>
        </div>
        <div className="ui-avatar" style={{ background: colorInitial(lead.name) }}>{lead.name[0]}</div>
      </div>
      <div className="ui-lead-value">{lead.value}</div>
      <div className="ui-lead-foot">
        <div className="ui-lead-tags">
          {lead.tags.map(t => <span key={t} className="ui-tag">{t}</span>)}
        </div>
        <div className="ui-lead-meta"><i data-lucide="clock"></i>{lead.when}</div>
      </div>
    </div>
  );
}

function KanbanScreen({ onLeadClick }) {
  const cols = [
    { id: 'new', name: 'Novo', color: '#6d43f5', value: 'R$ 28k', leads: [
      { name: 'Mariana Costa', phone: '+55 11 99123-4567', value: 'R$ 12.400', tags: ['enterprise','inbound'], when: 'há 2h', hot: true },
      { name: 'Rafael Souza', phone: '+55 21 98711-2233', value: 'R$ 4.800', tags: ['referral'], when: 'ontem' },
      { name: 'Júlia Pereira', phone: '+55 31 98444-5566', value: 'R$ 8.200', tags: ['site'], when: 'há 3 dias' },
    ]},
    { id: 'contact', name: 'Contato', color: '#2b6ef0', value: 'R$ 44k', leads: [
      { name: 'Henrique Lima', phone: '+55 11 94455-7788', value: 'R$ 18.000', tags: ['mid-market'], when: 'hoje', hot: true },
      { name: 'Paula Moreira', phone: '+55 51 98822-3344', value: 'R$ 6.400', tags: ['cold'], when: 'há 1d' },
      { name: 'Diego Alves', phone: '+55 85 99500-2211', value: 'R$ 19.600', tags: ['inbound'], when: 'há 2d' },
    ]},
    { id: 'qual', name: 'Qualificado', color: '#16a365', value: 'R$ 86k', leads: [
      { name: 'Camila Fernandes', phone: '+55 11 97711-8899', value: 'R$ 32.000', tags: ['enterprise'], when: 'há 4h' },
      { name: 'Bruno Teixeira', phone: '+55 11 98122-4411', value: 'R$ 24.500', tags: ['upsell'], when: 'ontem' },
      { name: 'Natália Ribeiro', phone: '+55 62 99344-7788', value: 'R$ 29.800', tags: ['renewal'], when: 'há 2d' },
    ]},
    { id: 'prop', name: 'Proposta', color: '#e09200', value: 'R$ 112k', leads: [
      { name: 'Vinícius Gomes', phone: '+55 11 98700-1199', value: 'R$ 58.000', tags: ['enterprise'], when: 'há 1h', hot: true },
      { name: 'Larissa Duarte', phone: '+55 48 99611-8822', value: 'R$ 54.200', tags: ['mid-market'], when: 'ontem' },
    ]},
    { id: 'neg', name: 'Negociação', color: '#f04e1a', value: 'R$ 74k', leads: [
      { name: 'Felipe Andrade', phone: '+55 21 99233-5511', value: 'R$ 74.300', tags: ['alta-prior.'], when: 'agora', hot: true },
    ]},
    { id: 'won', name: 'Ganho', color: '#0f6f46', value: 'R$ 140k', leads: [
      { name: 'Sofia Martins', phone: '+55 11 97333-2244', value: 'R$ 92.000', tags: ['fechado'], when: 'há 3d' },
      { name: 'Gustavo Pires', phone: '+55 31 99144-6677', value: 'R$ 48.000', tags: ['fechado'], when: 'semana passada' },
    ]},
  ];
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <div>
      <div className="ui-page-head">
        <div>
          <div className="ui-page-kicker">Pipeline</div>
          <h1 className="ui-page-title">Pipeline de <em>vendas</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ui-btn ui-btn-secondary"><i data-lucide="filter"></i>Filtrar</button>
          <button className="ui-btn ui-btn-secondary"><i data-lucide="settings-2"></i>Estágios</button>
          <button className="ui-btn ui-btn-primary"><i data-lucide="plus"></i>Novo lead</button>
        </div>
      </div>
      <div className="ui-kanban">
        {cols.map(c => (
          <div key={c.id} className="ui-col">
            <div className="ui-col-head">
              <span className="ui-col-dot" style={{ background: c.color }}></span>
              <span className="ui-col-name">{c.name}</span>
              <span className="ui-col-count">{c.leads.length}</span>
              <span className="ui-col-value">{c.value}</span>
            </div>
            {c.leads.map(l => <LeadCard key={l.name} lead={l} onClick={() => onLeadClick?.(l)} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

window.KanbanScreen = KanbanScreen;
