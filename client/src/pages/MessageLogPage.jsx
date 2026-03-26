import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import { format } from 'date-fns';
import * as api from '../services/api';

const directionColors = {
  outgoing: 'bg-blue-100 text-blue-700',
  incoming: 'bg-gray-100 text-gray-700',
  auto: 'bg-green-100 text-green-700',
};

const directionLabels = { outgoing: 'Enviada', incoming: 'Recebida', auto: 'Automática' };

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Message Log</h2>
        <button onClick={handleExport} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={direction} onChange={e => { setDirection(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todas as direções</option>
          <option value="outgoing">Enviadas</option>
          <option value="incoming">Recebidas</option>
          <option value="auto">Automáticas</option>
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos os tipos</option>
          <option value="text">Texto</option>
          <option value="image">Imagem</option>
        </select>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lead</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Direção</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Conteúdo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {messages.map(msg => (
              <tr key={msg.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(msg.sent_at), 'dd/MM/yy HH:mm')}</td>
                <td className="px-4 py-3 text-sm font-medium">{msg.leads?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${directionColors[msg.direction]}`}>{directionLabels[msg.direction]}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{msg.message_type}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{msg.content || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{msg.status}</td>
              </tr>
            ))}
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>}
            {!isLoading && messages.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhuma mensagem encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 text-sm rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
