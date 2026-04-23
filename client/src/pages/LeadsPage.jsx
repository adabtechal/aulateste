import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setDeleteId(null); toast.success('Lead excluido'); }
  });

  const leads = result?.data || [];
  const pagination = result?.pagination;

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">Central</p>
          <h2 className="text-[22px] font-semibold text-ink-900 tracking-tight">Central de <em className="font-serif font-normal text-violet-600">leads</em></h2>
        </div>
        <button onClick={() => setShowNewLead(true)} className="flex items-center gap-[7px] px-[14px] py-2 text-[13px] font-medium text-white bg-violet-500 rounded-md hover:bg-violet-600 transition-all shadow-violet">
          <Plus size={14} strokeWidth={2} /> Novo lead
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-[11px] text-ink-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nome, telefone ou email..." className="w-full pl-9 pr-3 py-[9px] border border-ink-200 rounded-sm text-[13px] bg-ink-0 outline-none transition focus:border-violet-500" />
        </div>
        <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(1); }} className="border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] bg-ink-0 outline-none focus:border-violet-500">
          <option value="">Todos os estagios</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-ink-0 border border-ink-150 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-ink-50 border-b border-ink-150">
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Nome</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Telefone</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Email</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Estagio</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Tags</th>
              <th className="px-4 py-[11px]"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-ink-50 cursor-pointer border-b border-ink-100 last:border-b-0 transition-colors" onClick={() => navigate(`/leads/${lead.id}`)}>
                <td className="px-4 py-[13px] text-[13px] font-semibold text-ink-900">{lead.name}</td>
                <td className="px-4 py-[13px] text-[13px] font-mono text-ink-600">{lead.phone}</td>
                <td className="px-4 py-[13px] text-[13px] text-ink-600">{lead.email || '—'}</td>
                <td className="px-4 py-[13px]">
                  {lead.kanban_stages && (
                    <span className="inline-flex items-center gap-[5px] text-[10px] font-semibold uppercase tracking-[0.04em] px-[9px] py-[3px] rounded-full" style={{ backgroundColor: lead.kanban_stages.color + '18', color: lead.kanban_stages.color }}>
                      <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: lead.kanban_stages.color }} />
                      {lead.kanban_stages.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-[13px]">
                  <div className="flex gap-1">{lead.tags?.map(t => <span key={t} className="text-[9px] font-medium bg-ink-100 text-ink-600 px-[6px] py-[2px] rounded-xs">{t}</span>)}</div>
                </td>
                <td className="px-4 py-[13px]" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setDeleteId(lead.id)} className="text-ink-400 hover:text-danger-500 transition-colors"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-400 text-[13px]">Carregando...</td></tr>}
            {!isLoading && leads.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-400 text-[13px]">Ainda nao ha leads por aqui</td></tr>}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-[13px] text-ink-500">{pagination.total} leads encontrados</span>
          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 text-[13px] rounded-md transition-colors ${page === i + 1 ? 'bg-violet-500 text-white shadow-violet' : 'bg-ink-0 border border-ink-200 text-ink-700 hover:bg-ink-75'}`}>{i + 1}</button>
            ))}
          </div>
        </div>
      )}

      <Modal open={showNewLead} onClose={() => setShowNewLead(false)} title="Novo lead">
        <LeadForm onSubmit={(data) => createMut.mutate(data)} onCancel={() => setShowNewLead(false)} />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} title="Excluir lead" message="Excluir este lead? Esta acao nao pode ser desfeita." />
    </div>
  );
}
