import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../services/api';

const UNITS = [
  { label: 'Minutos', value: 1 },
  { label: 'Horas', value: 60 },
  { label: 'Dias', value: 1440 },
];

export default function AutoMessageConfig({ stage, onBack }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ message_template: '', message_type: 'text', media_url: '', delay_value: 1, delay_unit: 60 });

  const { data: messages = [] } = useQuery({
    queryKey: ['auto-messages', stage.id],
    queryFn: () => api.getAutoMessages(stage.id)
  });

  const createMut = useMutation({
    mutationFn: (data) => api.createAutoMessage(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-messages', stage.id] }); setShowForm(false); setForm({ message_template: '', message_type: 'text', media_url: '', delay_value: 1, delay_unit: 60 }); toast.success('Mensagem automática criada'); }
  });

  const toggleMut = useMutation({
    mutationFn: (id) => api.toggleAutoMessage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auto-messages', stage.id] })
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.deleteAutoMessage(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-messages', stage.id] }); toast.success('Removida'); }
  });

  const handleCreate = () => {
    createMut.mutate({
      stage_id: stage.id,
      message_template: form.message_template,
      message_type: form.message_type,
      media_url: form.message_type === 'image' ? form.media_url : null,
      delay_minutes: form.delay_value * form.delay_unit,
      position: messages.length
    });
  };

  const formatDelay = (minutes) => {
    if (minutes >= 1440) return `${minutes / 1440}d`;
    if (minutes >= 60) return `${minutes / 60}h`;
    return `${minutes}min`;
  };

  return (
    <div>
      {onBack && <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">← Voltar aos stages</button>}

      <div className="space-y-3 mb-4">
        {messages.length === 0 && <p className="text-sm text-gray-400">Nenhuma mensagem automática configurada.</p>}
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <button onClick={() => toggleMut.mutate(msg.id)} className="mt-0.5">
              {msg.is_active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
            </button>
            <div className="flex-1">
              <p className="text-sm text-gray-800">{msg.message_template}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-gray-500">Após {formatDelay(msg.delay_minutes)}</span>
                <span className="text-xs bg-gray-200 px-1.5 rounded">{msg.message_type}</span>
              </div>
            </div>
            <button onClick={() => deleteMut.mutate(msg.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="border rounded-lg p-4 space-y-3">
          <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} placeholder="Template da mensagem... Use {{name}}, {{phone}}, {{company}}" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <select value={form.message_type} onChange={e => setForm(f => ({ ...f, message_type: e.target.value }))} className="border rounded-lg px-2 py-1 text-sm">
              <option value="text">Texto</option>
              <option value="image">Imagem</option>
            </select>
            {form.message_type === 'image' && (
              <input value={form.media_url} onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))} placeholder="URL da imagem" className="flex-1 border rounded-lg px-2 py-1 text-sm" />
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">Enviar após</span>
            <input type="number" min={1} value={form.delay_value} onChange={e => setForm(f => ({ ...f, delay_value: Number(e.target.value) }))} className="w-20 border rounded-lg px-2 py-1 text-sm" />
            <select value={form.delay_unit} onChange={e => setForm(f => ({ ...f, delay_unit: Number(e.target.value) }))} className="border rounded-lg px-2 py-1 text-sm">
              {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          {form.message_template && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 font-medium mb-1">Preview:</p>
              <p className="text-sm text-green-900">{form.message_template.replace(/\{\{name\}\}/g, 'João Silva').replace(/\{\{phone\}\}/g, '11999999999').replace(/\{\{company\}\}/g, 'Empresa X')}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={handleCreate} disabled={!form.message_template} className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Salvar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Plus size={16} /> Nova mensagem automática</button>
      )}
    </div>
  );
}
