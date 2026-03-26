import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus } from 'lucide-react';
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
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-xl font-bold text-gray-900">Kanban</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowNewLead(true)} className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Novo Lead
          </button>
          <button onClick={() => setShowConfig(true)} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Settings size={16} /> Stages
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto p-4">
        <KanbanBoard stages={stages} leads={leads} onLeadClick={(lead) => navigate(`/leads/${lead.id}`)} />
      </div>

      <StageConfigModal open={showConfig} onClose={() => setShowConfig(false)} />
      <Modal open={showNewLead} onClose={() => setShowNewLead(false)} title="Novo Lead">
        <LeadForm onSubmit={(data) => createMut.mutate(data)} onCancel={() => setShowNewLead(false)} />
      </Modal>
    </div>
  );
}
