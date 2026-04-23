import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical, MessageSquare, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import * as api from '../../services/api';
import AutoMessageConfig from '../messages/AutoMessageConfig';

export default function StageConfigModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#5a4a9c');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [autoMsgStage, setAutoMsgStage] = useState(null);
  const [activeTab, setActiveTab] = useState('stages');
  const [selectedStageForMsg, setSelectedStageForMsg] = useState(null);

  const { data: stages = [] } = useQuery({ queryKey: ['stages'], queryFn: api.getStages });

  const createMut = useMutation({
    mutationFn: (data) => api.createStage(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stages'] }); setNewName(''); toast.success('Estagio criado'); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.updateStage(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stages'] }); setEditingId(null); toast.success('Estagio atualizado'); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.deleteStage(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stages'] }); toast.success('Estagio excluido'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao excluir')
  });

  if (autoMsgStage) {
    return (
      <Modal open={open} onClose={() => setAutoMsgStage(null)} title={`Mensagens automaticas — ${autoMsgStage.name}`} size="lg">
        <AutoMessageConfig stage={autoMsgStage} onBack={() => setAutoMsgStage(null)} />
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Configurar pipeline" size="lg">
      <div className="flex border-b border-ink-150 mb-4">
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === 'stages'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          Estagios
        </button>
        <button
          onClick={() => { setActiveTab('messages'); if (!selectedStageForMsg && stages.length > 0) setSelectedStageForMsg(stages[0]); }}
          className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === 'messages'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          <Clock size={13} />
          Mensagens por tempo
        </button>
      </div>

      {activeTab === 'stages' && (
        <>
          <div className="space-y-[10px] mb-4">
            {stages.map(stage => (
              <div key={stage.id} className="flex items-center gap-2 p-[10px] bg-ink-50 rounded-lg border border-ink-100">
                <GripVertical size={14} className="text-ink-300" />
                <input type="color" value={editingId === stage.id ? editColor : stage.color} onChange={e => { setEditColor(e.target.value); if (editingId !== stage.id) { setEditingId(stage.id); setEditName(stage.name); setEditColor(e.target.value); } }} className="w-7 h-7 rounded cursor-pointer border-0" />
                {editingId === stage.id ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 text-[13px] border border-ink-200 rounded-sm px-2 py-1 outline-none focus:border-violet-500" autoFocus />
                    <button onClick={() => updateMut.mutate({ id: stage.id, data: { name: editName, color: editColor } })} className="text-xs text-violet-600 hover:underline font-medium">Salvar</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-ink-500 hover:underline">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-[13px] text-ink-800 font-medium" onDoubleClick={() => { setEditingId(stage.id); setEditName(stage.name); setEditColor(stage.color); }}>{stage.name}</span>
                    <button
                      onClick={() => setAutoMsgStage(stage)}
                      className="flex items-center gap-1 text-xs text-violet-600 hover:bg-violet-50 px-2 py-1 rounded-md font-medium transition-colors"
                      title="Configurar mensagens automaticas"
                    >
                      <MessageSquare size={11} />
                      Auto-msgs
                    </button>
                    <button onClick={() => deleteMut.mutate(stage.id)} className="text-ink-400 hover:text-danger-500 transition-colors"><Trash2 size={13} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-ink-150 pt-3">
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Novo estagio..." className="flex-1 text-[13px] border border-ink-200 rounded-sm px-3 outline-none focus:border-violet-500" onKeyDown={e => e.key === 'Enter' && newName && createMut.mutate({ name: newName, color: newColor })} />
            <button onClick={() => newName && createMut.mutate({ name: newName, color: newColor })} className="flex items-center gap-[7px] px-[14px] py-2 text-[13px] font-medium text-white bg-violet-500 rounded-md hover:bg-violet-600 transition-all shadow-violet"><Plus size={14} /> Adicionar</button>
          </div>
        </>
      )}

      {activeTab === 'messages' && (
        <div className="flex gap-4 min-h-[400px]">
          <div className="w-48 shrink-0 border-r border-ink-150 pr-3 space-y-1">
            <p className="text-[10px] text-ink-500 font-semibold mb-2 uppercase tracking-[0.12em]">Selecione o estagio</p>
            {stages.map(stage => (
              <button
                key={stage.id}
                onClick={() => setSelectedStageForMsg(stage)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[13px] transition-colors ${
                  selectedStageForMsg?.id === stage.id
                    ? 'bg-violet-50 text-violet-700 font-semibold'
                    : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                <span className="truncate flex-1">{stage.name}</span>
                {selectedStageForMsg?.id === stage.id && <ChevronRight size={13} />}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {selectedStageForMsg ? (
              <>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-ink-100">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedStageForMsg.color }} />
                  <h4 className="text-[13px] font-semibold text-ink-800">{selectedStageForMsg.name}</h4>
                  <span className="text-[11px] text-ink-400">Mensagens disparadas quando lead entra neste estagio</span>
                </div>
                <AutoMessageConfig stage={selectedStageForMsg} onBack={null} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[13px] text-ink-400">
                Selecione um estagio para configurar mensagens
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
