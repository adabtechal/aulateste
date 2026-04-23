import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Pause, Play, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import LeadForm from '../components/leads/LeadForm';
import MessageComposer from '../components/messages/MessageComposer';
import MessageBubble from '../components/messages/MessageBubble';
import { useRealtimeLeads, useRealtimeLeadMessages } from '../hooks/useRealtime';
import * as api from '../services/api';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  useRealtimeLeads();
  useRealtimeLeadMessages(id);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.getLead(id),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['lead-messages', id],
    queryFn: () => api.getLeadMessages(id),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const updateMut = useMutation({
    mutationFn: (data) => api.updateLead(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lead', id] }); setEditing(false); toast.success('Lead atualizado'); }
  });

  const toggleFollowupMut = useMutation({
    mutationFn: () => api.toggleFollowup(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lead', id] }); toast.success('Follow-up atualizado'); }
  });

  if (isLoading) return <div className="p-8 text-ink-400">Carregando...</div>;
  if (!lead) return <div className="p-8 text-ink-400">Lead nao encontrado</div>;

  const timeline = [
    ...messages.map(m => ({ ...m, type: 'message', timestamp: m.sent_at })),
    ...(lead.stage_history || []).map(h => ({ ...h, type: 'stage_change', timestamp: h.moved_at }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-6 py-[14px] border-b border-ink-150 bg-ink-0/85 backdrop-blur-[12px] sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-ink-75 rounded-lg transition-colors"><ArrowLeft size={18} strokeWidth={1.75} /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-ink-900 tracking-tight">{lead.name}</h2>
          <p className="text-[13px] text-ink-500 font-mono">{lead.phone} {lead.email && `· ${lead.email}`}</p>
        </div>
        {lead.kanban_stages && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.04em] px-[9px] py-[3px] rounded-full" style={{ backgroundColor: lead.kanban_stages.color + '18', color: lead.kanban_stages.color }}>
            {lead.kanban_stages.name}
          </span>
        )}
        <button onClick={() => toggleFollowupMut.mutate()} className={`flex items-center gap-1 px-3 py-[6px] text-xs font-medium rounded-md transition-colors ${lead.auto_followup_paused ? 'bg-warning-50 text-warning-700 border border-warning-100' : 'bg-success-50 text-success-700 border border-success-100'}`}>
          {lead.auto_followup_paused ? <><Play size={13} /> Retomar</> : <><Pause size={13} /> Pausar</>}
        </button>
        <button onClick={() => setEditing(true)} className="p-2 hover:bg-ink-75 rounded-lg transition-colors text-ink-600"><Edit size={16} strokeWidth={1.75} /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r border-ink-150 bg-ink-0 p-5 overflow-y-auto">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500 mb-3">Dados do lead</h3>
          <dl className="space-y-3 text-[13px]">
            <div><dt className="text-ink-500 text-[11px] uppercase tracking-[0.08em] font-semibold">Empresa</dt><dd className="font-medium text-ink-800 mt-[2px]">{lead.company || '—'}</dd></div>
            <div><dt className="text-ink-500 text-[11px] uppercase tracking-[0.08em] font-semibold">Tags</dt><dd className="flex flex-wrap gap-1 mt-1">{lead.tags?.map(t => <span key={t} className="bg-violet-50 text-violet-600 px-[6px] py-[2px] rounded-xs text-[9px] font-medium">{t}</span>)}{!lead.tags?.length && <span className="text-ink-400">—</span>}</dd></div>
            <div><dt className="text-ink-500 text-[11px] uppercase tracking-[0.08em] font-semibold">Notas</dt><dd className="text-ink-700 mt-[2px]">{lead.notes || '—'}</dd></div>
            <div><dt className="text-ink-500 text-[11px] uppercase tracking-[0.08em] font-semibold">Criado em</dt><dd className="font-mono text-ink-600 mt-[2px]">{format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}</dd></div>
          </dl>
        </div>

        <div className="flex-1 flex flex-col">
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
          <MessageComposer leadId={id} />
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar lead">
        <LeadForm lead={{ ...lead, tags: lead.tags?.join(', ') || '' }} onSubmit={(data) => updateMut.mutate(data)} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
