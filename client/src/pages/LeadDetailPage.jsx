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
    // Fallback: se realtime falhar (publication não habilitada, RLS, rede instável),
    // o polling garante que o chat não fique "preso" até um reload manual.
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

  if (isLoading) return <div className="p-8 text-gray-400">Carregando...</div>;
  if (!lead) return <div className="p-8 text-gray-400">Lead não encontrado</div>;

  // Build unified timeline
  const timeline = [
    ...messages.map(m => ({ ...m, type: 'message', timestamp: m.sent_at })),
    ...(lead.stage_history || []).map(h => ({ ...h, type: 'stage_change', timestamp: h.moved_at }))
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">{lead.name}</h2>
          <p className="text-sm text-gray-500">{lead.phone} {lead.email && `• ${lead.email}`}</p>
        </div>
        {lead.kanban_stages && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: lead.kanban_stages.color + '20', color: lead.kanban_stages.color }}>
            {lead.kanban_stages.name}
          </span>
        )}
        <button onClick={() => toggleFollowupMut.mutate()} className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg ${lead.auto_followup_paused ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {lead.auto_followup_paused ? <><Play size={14} /> Retomar Follow-up</> : <><Pause size={14} /> Pausar Follow-up</>}
        </button>
        <button onClick={() => setEditing(true)} className="p-2 hover:bg-gray-100 rounded"><Edit size={18} /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Info panel */}
        <div className="w-72 border-r bg-white p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Dados</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Empresa</dt><dd className="font-medium">{lead.company || '—'}</dd></div>
            <div><dt className="text-gray-500">Tags</dt><dd className="flex flex-wrap gap-1 mt-1">{lead.tags?.map(t => <span key={t} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs">{t}</span>)}{!lead.tags?.length && '—'}</dd></div>
            <div><dt className="text-gray-500">Notas</dt><dd>{lead.notes || '—'}</dd></div>
            <div><dt className="text-gray-500">Criado em</dt><dd>{format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}</dd></div>
          </dl>
        </div>

        {/* Timeline & Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {timeline.map((item, i) => {
              if (item.type === 'message') {
                return <MessageBubble key={`msg-${item.id}`} message={item} />;
              }
              return (
                <div key={`stage-${item.id || i}`} className="flex justify-center my-2">
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    <ArrowRight size={12} />
                    {item.from_stage?.name || 'Início'} → {item.to_stage?.name || '?'}
                    <Clock size={10} className="ml-1" />
                    {format(new Date(item.timestamp), 'dd/MM HH:mm')}
                  </span>
                </div>
              );
            })}
            {timeline.length === 0 && <p className="text-center text-gray-400 py-8">Nenhuma interação ainda</p>}
          </div>
          <MessageComposer leadId={id} />
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar Lead">
        <LeadForm lead={{ ...lead, tags: lead.tags?.join(', ') || '' }} onSubmit={(data) => updateMut.mutate(data)} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
