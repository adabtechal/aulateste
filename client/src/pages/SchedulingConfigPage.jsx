import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Trash2, ToggleLeft, ToggleRight, Clock, Loader2, Link2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSchedulingAvailability, createSchedulingSlot, deleteSchedulingSlot, toggleSchedulingSlot, getTenantSlug } from '../services/api';

const DAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terca-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sabado', short: 'Sab' },
];

function BookingLinkCard({ tenantSlug }) {
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${window.location.origin}/booking/${tenantSlug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  }

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Link2 size={16} className="text-violet-600" />
        <h3 className="text-[14px] font-semibold text-violet-900">Link de Agendamento</h3>
      </div>
      <p className="text-[12px] text-violet-700 mb-3">Compartilhe este link com seus clientes para que eles possam agendar atendimentos.</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white border border-violet-200 rounded-lg px-3 py-2 text-[13px] text-ink-700 font-mono truncate">
          {bookingUrl}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-violet-500 text-white hover:bg-violet-600'
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

function TimeSlotForm({ dayOfWeek, onSave, saving }) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  function handleSubmit(e) {
    e.preventDefault();
    if (startTime >= endTime) {
      toast.error('Horario inicial deve ser anterior ao final');
      return;
    }
    onSave({ day_of_week: dayOfWeek, start_time: startTime, end_time: endTime });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-3 bg-ink-50 rounded-lg border border-ink-150 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          className="flex-1 px-2 py-1.5 text-[13px] border border-ink-200 rounded-lg bg-ink-0 text-ink-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <span className="text-ink-400 text-[12px]">ate</span>
        <input
          type="time"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          className="flex-1 px-2 py-1.5 text-[13px] border border-ink-200 rounded-lg bg-ink-0 text-ink-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-1 w-full px-3 py-2 text-[13px] font-medium bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Salvar horario
      </button>
    </form>
  );
}

function DayCard({ day, slots, onAddSlot, onDeleteSlot, onToggleSlot, saving }) {
  const [showForm, setShowForm] = useState(false);
  const activeSlots = slots.filter(s => s.is_active);
  const hasActiveSlots = activeSlots.length > 0;

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${hasActiveSlots ? 'border-violet-300 bg-violet-50/40' : 'border-ink-150 bg-ink-0'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-ink-900">{day.label}</h3>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          hasActiveSlots ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'
        }`}>
          {hasActiveSlots ? `${activeSlots.length} ativo${activeSlots.length > 1 ? 's' : ''}` : 'Inativo'}
        </span>
      </div>

      {slots.length > 0 && (
        <div className="space-y-2 mb-3">
          {slots.map(slot => (
            <div key={slot.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
              slot.is_active
                ? 'bg-white border border-violet-200 shadow-sm'
                : 'bg-ink-75 border border-ink-100 opacity-50'
            }`}>
              <div className="flex items-center gap-2">
                <Clock size={13} className={slot.is_active ? 'text-violet-500' : 'text-ink-400'} />
                <span className={`text-[13px] font-semibold ${slot.is_active ? 'text-ink-800' : 'text-ink-500 line-through'}`}>
                  {slot.start_time.substring(0, 5)} — {slot.end_time.substring(0, 5)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleSlot(slot.id)}
                  className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors"
                  title={slot.is_active ? 'Desativar horario' : 'Ativar horario'}
                >
                  {slot.is_active
                    ? <ToggleRight size={20} className="text-green-500" />
                    : <ToggleLeft size={20} className="text-ink-400" />
                  }
                </button>
                <button
                  onClick={() => {
                    if (confirm('Remover este horario?')) onDeleteSlot(slot.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-danger-50 transition-colors"
                  title="Remover horario"
                >
                  <Trash2 size={14} className="text-danger-400 hover:text-danger-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div>
          <TimeSlotForm
            dayOfWeek={day.value}
            onSave={(data) => {
              onAddSlot(data);
              setShowForm(false);
            }}
            saving={saving}
          />
          <button
            onClick={() => setShowForm(false)}
            className="text-[11px] text-ink-500 hover:text-ink-700 mt-2 ml-1"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-3 py-2 rounded-lg transition-all mt-1 w-full"
        >
          <Plus size={15} />
          Adicionar horario
        </button>
      )}
    </div>
  );
}

export default function SchedulingConfigPage() {
  const queryClient = useQueryClient();

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['scheduling-availability'],
    queryFn: getSchedulingAvailability,
  });

  const { data: tenantInfo } = useQuery({
    queryKey: ['tenant-slug'],
    queryFn: getTenantSlug,
  });

  const createMutation = useMutation({
    mutationFn: createSchedulingSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-availability'] });
      toast.success('Horario adicionado com sucesso!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao criar horario'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchedulingSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-availability'] });
      toast.success('Horario removido');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao remover'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleSchedulingSlot,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-availability'] });
      toast.success(data.is_active ? 'Horario ativado' : 'Horario desativado');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao alternar'),
  });

  const slotsByDay = DAYS.map(day => ({
    day,
    slots: slots.filter(s => s.day_of_week === day.value),
  }));

  const totalActive = slots.filter(s => s.is_active).length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-violet-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
          <Calendar size={18} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-ink-900">Configuracao de Agendamento</h1>
          <p className="text-[13px] text-ink-500">
            Defina os dias e horarios disponiveis para agendamento dos seus clientes
            {totalActive > 0 && (
              <span className="ml-2 text-violet-600 font-medium">({totalActive} horario{totalActive > 1 ? 's' : ''} ativo{totalActive > 1 ? 's' : ''})</span>
            )}
          </p>
        </div>
      </div>

      {/* Booking Link */}
      {tenantInfo?.slug && (
        <BookingLinkCard tenantSlug={tenantInfo.slug} />
      )}

      {/* Days Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {slotsByDay.map(({ day, slots: daySlots }) => (
          <DayCard
            key={day.value}
            day={day}
            slots={daySlots}
            onAddSlot={(data) => createMutation.mutate(data)}
            onDeleteSlot={(id) => deleteMutation.mutate(id)}
            onToggleSlot={(id) => toggleMutation.mutate(id)}
            saving={createMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}
