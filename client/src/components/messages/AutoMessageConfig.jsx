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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-messages', stage.id] }); setShowForm(false); setForm({ message_template: '', message_type: 'text', media_url: '', delay_value: 1, delay_unit: 60 }); toast.success('Mensagem automatica criada'); }
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
      {onBack && <button onClick={onBack} className="text-[13px] text-violet-600 hover:underline mb-4 font-medium">← Voltar aos estagios</button>}

      <div className="space-y-[10px] mb-4">
        {messages.length === 0 && <p className="text-[13px] text-ink-400">Nenhuma mensagem automatica configurada.</p>}
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-3 p-3 bg-ink-50 rounded-lg border border-ink-100">
            <button onClick={() => toggleMut.mutate(msg.id)} className="mt-0.5">
              {msg.is_active ? <ToggleRight size={18} className="text-success-500" /> : <ToggleLeft size={18} className="text-ink-400" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-ink-800">{msg.message_template}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[11px] text-ink-500 font-mono">Apos {formatDelay(msg.delay_minutes)}</span>
                <span className="text-[10px] bg-ink-200 text-ink-600 px-[6px] py-[1px] rounded-xs font-medium">{msg.message_type}</span>
              </div>
            </div>
            <button onClick={() => deleteMut.mutate(msg.id)} className="text-ink-400 hover:text-danger-500 transition-colors"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="border border-ink-150 rounded-lg p-4 space-y-3">
          <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} placeholder="Template da mensagem... Use {{name}}, {{phone}}, {{company}}" rows={3} className="w-full border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] outline-none focus:border-violet-500 resize-y" />
          <div className="flex gap-2">
            <select value={form.message_type} onChange={e => setForm(f => ({ ...f, message_type: e.target.value }))} className="border border-ink-200 rounded-sm px-2 py-1 text-[13px] outline-none focus:border-violet-500">
              <option value="text">Texto</option>
              <option value="image">Imagem</option>
            </select>
            {form.message_type === 'image' && (
              <input value={form.media_url} onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))} placeholder="URL da imagem" className="flex-1 border border-ink-200 rounded-sm px-2 py-1 text-[13px] outline-none focus:border-violet-500" />
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[13px] text-ink-600">Enviar apos</span>
            <input type="number" min={1} value={form.delay_value} onChange={e => setForm(f => ({ ...f, delay_value: Number(e.target.value) }))} className="w-20 border border-ink-200 rounded-sm px-2 py-1 text-[13px] outline-none focus:border-violet-500" />
            <select value={form.delay_unit} onChange={e => setForm(f => ({ ...f, delay_unit: Number(e.target.value) }))} className="border border-ink-200 rounded-sm px-2 py-1 text-[13px] outline-none focus:border-violet-500">
              {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          {form.message_template && (
            <div className="bg-success-50 border border-success-100 rounded-lg p-3">
              <p className="text-[10px] text-success-700 font-semibold uppercase tracking-[0.12em] mb-1">Preview:</p>
              <p className="text-[13px] text-success-700">{form.message_template.replace(/\{\{name\}\}/g, 'Joao Silva').replace(/\{\{phone\}\}/g, '11999999999').replace(/\{\{company\}\}/g, 'Empresa X')}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-[6px] text-[13px] text-ink-600 hover:bg-ink-75 rounded-md transition-colors">Cancelar</button>
            <button onClick={handleCreate} disabled={!form.message_template} className="px-3 py-[6px] text-[13px] font-medium text-white bg-violet-500 rounded-md hover:bg-violet-600 disabled:opacity-50 transition-all">Salvar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-[13px] text-violet-600 hover:underline font-medium"><Plus size={14} /> Nova mensagem automatica</button>
      )}
    </div>
  );
}
