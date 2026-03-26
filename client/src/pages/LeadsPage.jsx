import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LeadForm from '../components/leads/LeadForm';
import * as api from '../services/api';

export default function LeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showNewLead, setShowNewLead] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data: stages = [] } = useQuery({ queryKey: ['stages'], queryFn: api.getStages });
  const { data: result, isLoading } = useQuery({
    queryKey: ['leads', { page, search, stage: stageFilter }],
    queryFn: () => api.getLeads({ page, limit: 20, search: search || undefined, stage: stageFilter || undefined })
  });

  const createMut = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setShowNewLead(false); toast.success('Lead criado'); }
  });

  const deleteMut = useMutation({
    mutationFn: api.deleteLead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setDeleteId(null); toast.success('Lead excluído'); }
  });

  const leads = result?.data || [];
  const pagination = result?.pagination;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Central de Leads</h2>
        <button onClick={() => setShowNewLead(true)} className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nome, telefone ou email..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos os stages</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{lead.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{lead.email || '—'}</td>
                <td className="px-4 py-3">
                  {lead.kanban_stages && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: lead.kanban_stages.color + '20', color: lead.kanban_stages.color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.kanban_stages.color }} />
                      {lead.kanban_stages.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">{lead.tags?.map(t => <span key={t} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{t}</span>)}</div>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setDeleteId(lead.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>}
            {!isLoading && leads.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhum lead encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">{pagination.total} leads encontrados</span>
          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 text-sm rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}

      <Modal open={showNewLead} onClose={() => setShowNewLead(false)} title="Novo Lead">
        <LeadForm onSubmit={(data) => createMut.mutate(data)} onCancel={() => setShowNewLead(false)} />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} title="Excluir Lead" message="Tem certeza? Esta ação não pode ser desfeita." />
    </div>
  );
}
