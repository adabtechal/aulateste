import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Pause, Play, Clock, ArrowRight, MessageSquare, User, Calendar, Save, X, Phone, Mail, Building, FileText, Hash } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import MessageBubble from '../components/messages/MessageBubble';
import MessageComposer from '../components/messages/MessageComposer';
import { TagPill } from '../components/tags/TagManager';
import TagPicker from '../components/tags/TagPicker';
import { useRealtimeLeads, useRealtimeLeadMessages } from '../hooks/useRealtime';
import * as api from '../services/api';

function TabButton({ active, icon: Icon, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-[7px] px-4 py-[10px] text-[13px] font-medium border-b-2 transition-all ${
        active
          ? 'border-violet-500 text-violet-600'
          : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-200'
      }`}
    >
      <Icon size={15} strokeWidth={1.75} />
      {label}
      {count > 0 && (
        <span className={`text-[10px] font-bold px-[6px] py-[1px] rounded-full ${active ? 'bg-violet-100 text-violet-700' : 'bg-ink-100 text-ink-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function FieldRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-ink-100 last:border-b-0">
      <div className="flex items-center gap-2 w-[120px] shrink-0 pt-[2px]">
        <Icon size={14} className="text-ink-400" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function DadosTab({ lead, tagColorMap, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const startEdit = () => {
    setForm({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      company: lead.company || '',
      tags: lead.tags || [],
      notes: lead.notes || '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    onUpdate(form);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-ink-900">Editar informacoes</h3>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-[7px] text-[12px] font-medium text-ink-600 bg-ink-0 border border-ink-200 rounded-md hover:bg-ink-75 transition-colors">
              <X size={13} /> Cancelar
            </button>
            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-[7px] text-[12px] font-medium text-white bg-violet-500 rounded-md hover:bg-violet-600 shadow-violet transition-all">
              <Save size={13} /> Salvar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-ink-600 mb-[4px]">Nome *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-ink-200 rounded-md bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.12)]" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-ink-600 mb-[4px]">Telefone *</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border border-ink-200 rounded-md bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 font-mono outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.12)]" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-ink-600 mb-[4px]">Email</label>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full border border-ink-200 rounded-md bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.12)]" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-ink-600 mb-[4px]">Empresa</label>
            <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full border border-ink-200 rounded-md bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.12)]" />
          </div>
          <div className="col-span-2">
            <label className="block text-[12px] font-semibold text-ink-600 mb-[4px]">Tags</label>
            <TagPicker value={form.tags} onChange={tags => setForm({ ...form, tags })} />
          </div>
          <div className="col-span-2">
            <label className="block text-[12px] font-semibold text-ink-600 mb-[4px]">Notas</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} className="w-full border border-ink-200 rounded-md bg-ink-0 px-3 py-[9px] text-[13px] text-ink-900 outline-none resize-y transition focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(90,74,156,0.12)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-ink-900">Informacoes do lead</h3>
        <button onClick={startEdit} className="flex items-center gap-[5px] px-3 py-[7px] text-[12px] font-medium text-violet-600 bg-violet-50 border border-violet-100 rounded-md hover:bg-violet-100 transition-colors">
          <Edit size={13} /> Editar
        </button>
      </div>

      <div className="bg-ink-0 border border-ink-150 rounded-lg px-5">
        <FieldRow icon={User} label="Nome">
          <p className="text-[14px] font-semibold text-ink-900">{lead.name}</p>
        </FieldRow>
        <FieldRow icon={Phone} label="Telefone">
          <p className="text-[14px] font-mono text-ink-800">{lead.phone}</p>
        </FieldRow>
        <FieldRow icon={Mail} label="Email">
          <p className="text-[14px] text-ink-800">{lead.email || <span className="text-ink-400 italic">Nao informado</span>}</p>
        </FieldRow>
        <FieldRow icon={Building} label="Empresa">
          <p className="text-[14px] text-ink-800">{lead.company || <span className="text-ink-400 italic">Nao informado</span>}</p>
        </FieldRow>
        <FieldRow icon={Hash} label="Tags">
          <div className="flex flex-wrap gap-1">
            {lead.tags?.length > 0
              ? lead.tags.map(t => <TagPill key={t} name={t} color={tagColorMap[t] || '#5a4a9c'} size="md" />)
              : <span className="text-ink-400 italic text-[13px]">Sem tags</span>
            }
          </div>
        </FieldRow>
        <FieldRow icon={FileText} label="Notas">
          <p className="text-[13px] text-ink-700 whitespace-pre-wrap">{lead.notes || <span className="text-ink-400 italic">Sem notas</span>}</p>
        </FieldRow>
        <FieldRow icon={Clock} label="Criado em">
          <p className="text-[13px] font-mono text-ink-600">{format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}</p>
        </FieldRow>
      </div>

      {/* Stage history */}
      {lead.stage_history?.length > 0 && (
        <div className="mt-6">
          <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-500 mb-3">Historico de estagios</h4>
          <div className="space-y-[6px]">
            {lead.stage_history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px] text-ink-600 bg-ink-50 px-3 py-[6px] rounded-md">
                <ArrowRight size={11} className="text-ink-400" />
                <span className="font-medium">{h.from_stage?.name || 'Inicio'}</span>
                <span className="text-ink-400">→</span>
                <span className="font-medium">{h.to_stage?.name || '?'}</span>
                <span className="ml-auto font-mono text-[10px] text-ink-400">
                  {format(new Date(h.moved_at), 'dd/MM HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ConversasTab({ leadId, lead }) {
  const { data: messages = [] } = useQuery({
    queryKey: ['lead-messages', leadId],
    queryFn: () => api.getLeadMessages(leadId),
    refetchInterval: 5000,
  });

  useRealtimeLeadMessages(leadId);

  const timeline = [
    ...messages.map(m => ({ ...m, type: 'message', timestamp: m.sent_at })),
    ...(lead?.stage_history || []).map(h => ({ ...h, type: 'stage_change', timestamp: h.moved_at }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {timeline.map((item, i) => {
          if (item.type === 'message') {
            return <MessageBubble key={`msg-${item.id}`} message={item} />;
          }
          return (
            <div key={`stage-${item.id || i}`} className="flex justify-center my-2">
              <span className="flex items-center gap-1 text-[10px] text-ink-500 bg-ink-100 px-3 py-1 rounded-full font-mono">
                <ArrowRight size={10} />
                {item.from_stage?.name || 'Inicio'} → {item.to_stage?.name || '?'}
                <Clock size={9} className="ml-1" />
                {format(new Date(item.timestamp), 'dd/MM HH:mm')}
              </span>
            </div>
          );
        })}
        {timeline.length === 0 && <p className="text-center text-ink-400 py-8 text-[13px]">Nenhuma interacao ainda</p>}
      </div>
      <MessageComposer leadId={leadId} />
    </div>
  );
}

function AgendamentosTab({ phone }) {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lead-bookings', phone],
    queryFn: () => api.getBookingsByPhone(phone),
    enabled: !!phone,
  });

  const statusColors = {
    confirmed: { bg: 'bg-success-50', text: 'text-success-700', label: 'Confirmado' },
    cancelled: { bg: 'bg-danger-50', text: 'text-danger-500', label: 'Cancelado' },
    completed: { bg: 'bg-info-50', text: 'text-info-500', label: 'Concluido' },
    pending: { bg: 'bg-warning-50', text: 'text-warning-700', label: 'Pendente' },
  };

  if (isLoading) return <div className="p-6 text-ink-400 text-[13px]">Carregando agendamentos...</div>;

  return (
    <div className="p-6">
      <h3 className="text-[15px] font-semibold text-ink-900 mb-4">Agendamentos do lead</h3>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={32} className="mx-auto mb-3 text-ink-300" />
          <p className="text-[13px] text-ink-500">Nenhum agendamento encontrado</p>
          <p className="text-[11px] text-ink-400 mt-1">Agendamentos feitos pelo telefone {phone} aparecerao aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const st = statusColors[b.status] || statusColors.pending;
            return (
              <div key={b.id} className="bg-ink-0 border border-ink-150 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-violet-500" />
                    <span className="text-[14px] font-semibold text-ink-900">
                      {format(new Date(b.booking_date + 'T12:00:00'), 'dd/MM/yyyy')}
                    </span>
                    <span className="text-[14px] font-mono text-violet-600">{b.booking_time?.substring(0, 5)}</span>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.04em] px-[8px] py-[3px] rounded-full ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                </div>
                {b.service_interest && (
                  <p className="text-[12px] text-ink-600 mt-1">
                    <span className="text-ink-400">Interesse:</span> {b.service_interest}
                  </p>
                )}
                {b.client_name && (
                  <p className="text-[12px] text-ink-500 mt-[2px]">
                    <span className="text-ink-400">Nome:</span> {b.client_name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dados');

  useRealtimeLeads();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.getLead(id),
    refetchInterval: 15000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['lead-messages', id],
    queryFn: () => api.getLeadMessages(id),
    refetchInterval: 10000,
  });

  const { data: allTags = [] } = useQuery({ queryKey: ['tags'], queryFn: api.getTags });
  const tagColorMap = {};
  allTags.forEach(t => { tagColorMap[t.name] = t.color; });

  const updateMut = useMutation({
    mutationFn: (data) => api.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Lead atualizado');
    }
  });

  const toggleFollowupMut = useMutation({
    mutationFn: () => api.toggleFollowup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Follow-up atualizado');
    }
  });

  if (isLoading) return <div className="p-8 text-ink-400">Carregando...</div>;
  if (!lead) return <div className="p-8 text-ink-400">Lead nao encontrado</div>;

  const initials = lead.name ? lead.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-150 bg-ink-0/90 backdrop-blur-[12px] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/leads')} className="p-[6px] hover:bg-ink-75 rounded-lg transition-colors">
            <ArrowLeft size={18} strokeWidth={1.75} />
          </button>

          <div className="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center text-[14px] font-semibold shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-semibold text-ink-900 tracking-tight">{lead.name}</h2>
            <div className="flex items-center gap-2 mt-[2px]">
              <span className="text-[12px] text-ink-500 font-mono">{lead.phone}</span>
              {lead.email && <span className="text-[12px] text-ink-400">· {lead.email}</span>}
            </div>
          </div>

          {lead.kanban_stages && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.04em] px-[10px] py-[4px] rounded-full" style={{ backgroundColor: lead.kanban_stages.color + '18', color: lead.kanban_stages.color }}>
              {lead.kanban_stages.name}
            </span>
          )}

          <button onClick={() => toggleFollowupMut.mutate()} className={`flex items-center gap-1 px-3 py-[7px] text-[12px] font-medium rounded-md transition-colors ${lead.auto_followup_paused ? 'bg-warning-50 text-warning-700 border border-warning-100' : 'bg-success-50 text-success-700 border border-success-100'}`}>
            {lead.auto_followup_paused ? <><Play size={13} /> Retomar</> : <><Pause size={13} /> Pausar</>}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 -mb-[1px]">
          <TabButton active={activeTab === 'dados'} icon={User} label="Dados" onClick={() => setActiveTab('dados')} />
          <TabButton active={activeTab === 'conversas'} icon={MessageSquare} label="Conversas" count={messages.length} onClick={() => setActiveTab('conversas')} />
          <TabButton active={activeTab === 'agendamentos'} icon={Calendar} label="Agendamentos" onClick={() => setActiveTab('agendamentos')} />
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dados' && (
          <DadosTab lead={lead} tagColorMap={tagColorMap} onUpdate={(data) => updateMut.mutate(data)} />
        )}
        {activeTab === 'conversas' && (
          <ConversasTab leadId={id} lead={lead} />
        )}
        {activeTab === 'agendamentos' && (
          <AgendamentosTab phone={lead.phone} />
        )}
      </div>
    </div>
  );
}
