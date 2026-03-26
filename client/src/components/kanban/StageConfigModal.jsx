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
  const [newColor, setNewColor] = useState('#6B7280');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [autoMsgStage, setAutoMsgStage] = useState(null);
  const [activeTab, setActiveTab] = useState('stages'); // 'stages' | 'messages'
  const [selectedStageForMsg, setSelectedStageForMsg] = useState(null);

  const { data: stages = [] } = useQuery({ queryKey: ['stages'], queryFn: api.getStages });

  const createMut = useMutation({
    mutationFn: (data) => api.createStage(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stages'] }); setNewName(''); toast.success('Stage criado'); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.updateStage(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stages'] }); setEditingId(null); toast.success('Stage atualizado'); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.deleteStage(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stages'] }); toast.success('Stage excluído'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao excluir')
  });

  // Full-screen auto message config for a specific stage
  if (autoMsgStage) {
    return (
      <Modal open={open} onClose={() => setAutoMsgStage(null)} title={`Mensagens Automáticas — ${autoMsgStage.name}`} size="lg">
        <AutoMessageConfig stage={autoMsgStage} onBack={() => setAutoMsgStage(null)} />
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Configurar Pipeline" size="lg">
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stages'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Stages
        </button>
        <button
          onClick={() => { setActiveTab('messages'); if (!selectedStageForMsg && stages.length > 0) setSelectedStageForMsg(stages[0]); }}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'messages'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={14} />
          Mensagens por Tempo
        </button>
      </div>

      {activeTab === 'stages' && (
        <>
          <div className="space-y-3 mb-4">
            {stages.map(stage => (
              <div key={stage.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <GripVertical size={16} className="text-gray-400" />
                <input type="color" value={editingId === stage.id ? editColor : stage.color} onChange={e => { setEditColor(e.target.value); if (editingId !== stage.id) { setEditingId(stage.id); setEditName(stage.name); setEditColor(e.target.value); } }} className="w-8 h-8 rounded cursor-pointer border-0" />
                {editingId === stage.id ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 text-sm border rounded px-2 py-1" autoFocus />
                    <button onClick={() => updateMut.mutate({ id: stage.id, data: { name: editName, color: editColor } })} className="text-xs text-blue-600 hover:underline">Salvar</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm" onDoubleClick={() => { setEditingId(stage.id); setEditName(stage.name); setEditColor(stage.color); }}>{stage.name}</span>
                    <button
                      onClick={() => setAutoMsgStage(stage)}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded"
                      title="Configurar mensagens automáticas"
                    >
                      <MessageSquare size={12} />
                      Auto-msgs
                    </button>
                    <button onClick={() => deleteMut.mutate(stage.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t pt-3">
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Novo stage..." className="flex-1 text-sm border rounded-lg px-3" onKeyDown={e => e.key === 'Enter' && newName && createMut.mutate({ name: newName, color: newColor })} />
            <button onClick={() => newName && createMut.mutate({ name: newName, color: newColor })} className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"><Plus size={16} /> Adicionar</button>
          </div>
        </>
      )}

      {activeTab === 'messages' && (
        <div className="flex gap-4 min-h-[400px]">
          {/* Stage selector sidebar */}
          <div className="w-48 shrink-0 border-r pr-3 space-y-1">
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Selecione o stage</p>
            {stages.map(stage => (
              <button
                key={stage.id}
                onClick={() => setSelectedStageForMsg(stage)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  selectedStageForMsg?.id === stage.id
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                <span className="truncate flex-1">{stage.name}</span>
                {selectedStageForMsg?.id === stage.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>

          {/* Auto message config for selected stage */}
          <div className="flex-1 min-w-0">
            {selectedStageForMsg ? (
              <>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedStageForMsg.color }} />
                  <h4 className="text-sm font-semibold text-gray-800">{selectedStageForMsg.name}</h4>
                  <span className="text-xs text-gray-400">Mensagens disparadas quando lead entra neste stage</span>
                </div>
                <AutoMessageConfig stage={selectedStageForMsg} onBack={null} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Selecione um stage para configurar mensagens
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
