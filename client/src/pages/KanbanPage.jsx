import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Settings2, Plus, Filter } from 'lucide-react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import StageConfigModal from '../components/kanban/StageConfigModal';
import LeadForm from '../components/leads/LeadForm';
import Modal from '../components/ui/Modal';
import { useRealtimeLeads } from '../hooks/useRealtime';
import * as api from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function KanbanPage() {
  const [showConfig, setShowConfig] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useRealtimeLeads();

  const { data: stages = [] } = useQuery({ queryKey: ['stages'], queryFn: api.getStages });
  const { data: leadsData } = useQuery({ queryKey: ['kanban'], queryFn: () => api.getLeads({ limit: 500 }) });
  const leads = leadsData?.data || [];

  const createMut = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kanban'] }); setShowNewLead(false); toast.success('Lead criado'); }
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-8 py-[14px] border-b border-ink-150 bg-ink-0/85 backdrop-blur-[12px] sticky top-0 z-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">Pipeline</p>
          <h2 className="text-[22px] font-semibold text-ink-900 tracking-tight">Pipeline de <em className="font-serif font-normal text-violet-600">vendas</em></h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(true)} className="flex items-center gap-[7px] px-[14px] py-2 text-[13px] font-medium text-ink-700 bg-ink-0 border border-ink-200 rounded-md hover:bg-ink-75 transition-colors">
            <Settings2 size={14} strokeWidth={2} /> Estagios
          </button>
          <button onClick={() => setShowNewLead(true)} className="flex items-center gap-[7px] px-[14px] py-2 text-[13px] font-medium text-white bg-violet-500 rounded-md hover:bg-violet-600 transition-all shadow-violet">
            <Plus size={14} strokeWidth={2} /> Novo lead
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto p-6">
        <KanbanBoard stages={stages} leads={leads} onLeadClick={(lead) => navigate(`/leads/${lead.id}`)} />
      </div>

      <StageConfigModal open={showConfig} onClose={() => setShowConfig(false)} />
      <Modal open={showNewLead} onClose={() => setShowNewLead(false)} title="Novo lead">
        <LeadForm onSubmit={(data) => createMut.mutate(data)} onCancel={() => setShowNewLead(false)} />
      </Modal>
    </div>
  );
}
