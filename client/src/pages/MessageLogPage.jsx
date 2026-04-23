import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import * as api from '../services/api';

const directionColors = {
  outgoing: 'bg-violet-50 text-violet-700',
  incoming: 'bg-ink-100 text-ink-700',
  auto: 'bg-success-50 text-success-700',
};

const directionLabels = { outgoing: 'Enviada', incoming: 'Recebida', auto: 'Automatica' };

export default function MessageLogPage() {
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState('');
  const [type, setType] = useState('');

  const { data: result, isLoading } = useQuery({
    queryKey: ['messages', { page, direction, type }],
    queryFn: () => api.getMessages({ page, limit: 50, direction: direction || undefined, type: type || undefined })
  });

  const messages = result?.data || [];
  const pagination = result?.pagination;

  const handleExport = async () => {
    const response = await api.exportMessages({ direction: direction || undefined, type: type || undefined });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">Historico</p>
          <h2 className="text-[22px] font-semibold text-ink-900 tracking-tight">Log de <em className="font-serif font-normal text-violet-600">mensagens</em></h2>
        </div>
        <button onClick={handleExport} className="flex items-center gap-[7px] px-[14px] py-2 text-[13px] font-medium text-ink-700 bg-ink-0 border border-ink-200 rounded-md hover:bg-ink-75 transition-colors">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={direction} onChange={e => { setDirection(e.target.value); setPage(1); }} className="border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] bg-ink-0 outline-none focus:border-violet-500">
          <option value="">Todas as direcoes</option>
          <option value="outgoing">Enviadas</option>
          <option value="incoming">Recebidas</option>
          <option value="auto">Automaticas</option>
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="border border-ink-200 rounded-sm px-3 py-[9px] text-[13px] bg-ink-0 outline-none focus:border-violet-500">
          <option value="">Todos os tipos</option>
          <option value="text">Texto</option>
          <option value="image">Imagem</option>
        </select>
      </div>

      <div className="bg-ink-0 border border-ink-150 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-ink-50 border-b border-ink-150">
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Data</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Lead</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Direcao</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Tipo</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Conteudo</th>
              <th className="text-left px-4 py-[11px] text-[10px] font-semibold text-ink-500 uppercase tracking-[0.12em]">Status</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(msg => (
              <tr key={msg.id} className="hover:bg-ink-50 border-b border-ink-100 last:border-b-0 transition-colors">
                <td className="px-4 py-[13px] text-[13px] font-mono text-ink-600">{format(new Date(msg.sent_at), 'dd/MM/yy HH:mm')}</td>
                <td className="px-4 py-[13px] text-[13px] font-semibold text-ink-800">{msg.leads?.name || '—'}</td>
                <td className="px-4 py-[13px]">
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.04em] px-[9px] py-[3px] rounded-full ${directionColors[msg.direction]}`}>{directionLabels[msg.direction]}</span>
                </td>
                <td className="px-4 py-[13px] text-xs text-ink-500">{msg.message_type}</td>
                <td className="px-4 py-[13px] text-[13px] text-ink-600 max-w-xs truncate">{msg.content || '—'}</td>
                <td className="px-4 py-[13px] text-xs text-ink-500">{msg.status}</td>
              </tr>
            ))}
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-400 text-[13px]">Carregando...</td></tr>}
            {!isLoading && messages.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-400 text-[13px]">Nenhuma mensagem encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 text-[13px] rounded-md transition-colors ${page === i + 1 ? 'bg-violet-500 text-white shadow-violet' : 'bg-ink-0 border border-ink-200 hover:bg-ink-75'}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
