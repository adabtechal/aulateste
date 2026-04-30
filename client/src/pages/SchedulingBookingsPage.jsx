import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBookings } from '../services/api';

const STATUS_LABELS = {
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  completed: { label: 'Concluido', color: 'bg-blue-100 text-blue-700' },
  no_show: { label: 'Nao compareceu', color: 'bg-amber-100 text-amber-700' },
};

export default function SchedulingBookingsPage() {
  const [page, setPage] = useState(1);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const params = { page, limit: 20 };
  if (filterDate) params.date = filterDate;
  if (filterStatus) params.status = filterStatus;

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, filterDate, filterStatus],
    queryFn: () => getBookings(params),
  });

  const bookings = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
          <CalendarCheck size={18} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-ink-900">Agendamentos</h1>
          <p className="text-[13px] text-ink-500">Visualize e gerencie os agendamentos dos seus clientes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="date"
          value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setPage(1); }}
          className="px-3 py-2 text-[13px] border border-ink-200 rounded-lg bg-ink-0 text-ink-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-[13px] border border-ink-200 rounded-lg bg-ink-0 text-ink-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value="">Todos os status</option>
          <option value="confirmed">Confirmado</option>
          <option value="cancelled">Cancelado</option>
          <option value="completed">Concluido</option>
          <option value="no_show">Nao compareceu</option>
        </select>
        {(filterDate || filterStatus) && (
          <button
            onClick={() => { setFilterDate(''); setFilterStatus(''); setPage(1); }}
            className="text-[12px] text-violet-600 hover:text-violet-700 font-medium"
          >
            Limpar filtros
          </button>
        )}
        <span className="text-[12px] text-ink-400 ml-auto">{pagination.total} agendamento{pagination.total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-500" size={28} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-[14px] text-ink-500">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="border border-ink-150 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-150">
                <th className="px-4 py-3 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Horario</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Telefone</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Servico</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const status = STATUS_LABELS[b.status] || { label: b.status, color: 'bg-ink-100 text-ink-600' };
                return (
                  <tr key={b.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-25 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-ink-800 font-medium">
                      {new Date(b.booking_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-700">{b.booking_time.substring(0, 5)}</td>
                    <td className="px-4 py-3 text-[13px] text-ink-800 font-medium">{b.client_name}</td>
                    <td className="px-4 py-3 text-[13px] text-ink-600 font-mono">{b.client_phone}</td>
                    <td className="px-4 py-3 text-[13px] text-ink-700">{b.service_interest}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] text-ink-600">
            Pagina {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="p-2 rounded-lg hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
