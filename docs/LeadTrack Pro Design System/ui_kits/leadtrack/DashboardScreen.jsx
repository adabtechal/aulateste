// DashboardScreen.jsx
function Sparkline({ points, color }) {
  const max = Math.max(...points), min = Math.min(...points);
  const w = 100, h = 40;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min || 1)) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 40 }}>
    <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

function BarChart() {
  const data = [38, 52, 44, 67, 71, 62, 84, 91, 76, 88, 102, 95];
  const labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const max = 110;
  return (
    <div className="ui-chart">
      <svg viewBox="0 0 600 220" preserveAspectRatio="none">
        {[0,1,2,3].map(i => (
          <line key={i} x1="0" x2="600" y1={30 + i*50} y2={30 + i*50} stroke="#eef0f4" strokeWidth="1"/>
        ))}
        {data.map((d, i) => {
          const x = 40 + i * 46;
          const barH = (d / max) * 170;
          const y = 200 - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width="28" height={barH} rx="3" fill={i === data.length-1 ? '#6d43f5' : '#e8e2ff'}/>
              <text x={x+14} y="215" fontSize="10" fill="#8d94a3" textAnchor="middle" fontFamily="Geist Mono">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DashboardScreen() {
  React.useEffect(() => { window.lucide?.createIcons(); });
  const kpis = [
    { label: 'Leads ativos', value: '1.248', delta: '+12,4%', trend: 'up', spark: [30,42,38,50,47,58,65,72], color: '#6d43f5' },
    { label: 'Conversão', value: '18,2%', delta: '+2,1pp', trend: 'up', spark: [12,14,13,15,16,17,17,18], color: '#16a365' },
    { label: 'Pipeline', value: 'R$ 482k', delta: '+8,6%', trend: 'up', spark: [280,310,340,390,410,432,450,482], color: '#2b6ef0' },
    { label: 'Ticket médio', value: 'R$ 18,4k', delta: '−3,8%', trend: 'down', spark: [22,21,20,19,19,18,19,18], color: '#f04e1a' },
  ];
  const activity = [
    { who: 'Mariana Costa', what: 'moveu para Qualificado', when: 'há 4 min', color: '#16a365' },
    { who: 'Automação', what: 'enviou follow-up 24h p/ Rafael Souza', when: 'há 12 min', color: '#6d43f5' },
    { who: 'João Pedro', what: 'fechou R$ 92.000 com Sofia Martins', when: 'há 1h', color: '#0f6f46' },
    { who: 'Camila Fernandes', what: 'respondeu no WhatsApp', when: 'há 2h', color: '#2b6ef0' },
    { who: 'Novo lead', what: 'Vinícius Gomes entrou no pipeline', when: 'há 3h', color: '#f04e1a' },
  ];
  return (
    <div>
      <div className="ui-page-head">
        <div>
          <div className="ui-page-kicker">Panorama</div>
          <h1 className="ui-page-title">Como vai o <em>mês</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ui-btn ui-btn-secondary"><i data-lucide="calendar"></i>Abril 2026</button>
          <button className="ui-btn ui-btn-secondary"><i data-lucide="download"></i>Exportar</button>
        </div>
      </div>
      <div className="ui-kpi-grid" style={{ marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} className="ui-kpi">
            <div className="ui-kpi-label">{k.label}</div>
            <div className="ui-kpi-value">{k.value}</div>
            <div className={'ui-kpi-delta' + (k.trend === 'down' ? ' down' : '')}>
              <i data-lucide={k.trend === 'down' ? 'trending-down' : 'trending-up'}></i>{k.delta}
            </div>
            <div style={{ marginTop: 8 }}><Sparkline points={k.spark} color={k.color}/></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="ui-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div className="ui-kpi-label">Receita mensal</div>
              <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>R$ 1,4M</div>
            </div>
            <div className="ui-badge ui-badge-qual"><span className="dot"></span>+24% YoY</div>
          </div>
          <BarChart/>
        </div>
        <div className="ui-card">
          <div className="ui-kpi-label" style={{ marginBottom: 14 }}>Atividade recente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingLeft: 10, borderLeft: `2px solid ${a.color}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12 }}><strong style={{ fontWeight: 600 }}>{a.who}</strong> {a.what}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
