import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, CheckCircle, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const publicApi = axios.create({ baseURL: '/api' });

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function BookingCalendar({ tenantSlug, activeDays, onSelectDate, selectedDate }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfMonth; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDayOfMonth, daysInMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function isAvailable(day) {
    if (!day) return false;
    const date = new Date(viewYear, viewMonth, day);
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return false;
    return activeDays.includes(date.getDay());
  }

  function formatDate(day) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  }

  function isSelected(day) {
    return selectedDate === formatDate(day);
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-violet-50 transition-colors">
          <ChevronLeft size={18} className="text-ink-600" />
        </button>
        <h3 className="text-[15px] font-semibold text-ink-900">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-violet-50 transition-colors">
          <ChevronRight size={18} className="text-ink-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-ink-400 uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const available = isAvailable(day);
          const selected = isSelected(day);

          return (
            <button
              key={day}
              disabled={!available}
              onClick={() => onSelectDate(formatDate(day))}
              className={`h-10 rounded-lg text-[13px] font-medium transition-all ${
                selected
                  ? 'bg-violet-500 text-white shadow-sm'
                  : available
                    ? 'text-ink-800 hover:bg-violet-50 hover:text-violet-600'
                    : 'text-ink-300 cursor-not-allowed'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSlotPicker({ tenantSlug, date, onSelectTime, selectedTime }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    publicApi.get(`/booking/${tenantSlug}/availability`, { params: { date } })
      .then(r => setSlots(r.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [tenantSlug, date]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-violet-500" size={24} />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-[13px] text-ink-500 py-6">Nenhum horario disponivel para esta data.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map(slot => (
        <button
          key={slot}
          onClick={() => onSelectTime(slot)}
          className={`py-2.5 px-3 rounded-lg text-[13px] font-medium border transition-all ${
            selectedTime === slot
              ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
              : 'border-ink-200 text-ink-700 hover:border-violet-300 hover:bg-violet-50'
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}

function BookingForm({ onSubmit, submitting }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '').substring(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    if (digits.length <= 10) return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) return;
    onSubmit({ client_name: name, client_phone: phoneDigits, service_interest: service });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[13px] font-medium text-ink-700 mb-1">Nome completo</label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Seu nome"
          className="w-full px-3 py-2.5 text-[14px] border border-ink-200 rounded-lg bg-ink-0 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
        />
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink-700 mb-1">Telefone</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
          placeholder="(11) 99999-9999"
          className="w-full px-3 py-2.5 text-[14px] border border-ink-200 rounded-lg bg-ink-0 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
        />
      </div>
      <div>
        <label className="block text-[13px] font-medium text-ink-700 mb-1">Servico de interesse</label>
        <input
          type="text"
          required
          value={service}
          onChange={e => setService(e.target.value)}
          placeholder="Ex: Consulta, Avaliacao, Corte..."
          className="w-full px-3 py-2.5 text-[14px] border border-ink-200 rounded-lg bg-ink-0 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !name || !service || phone.replace(/\D/g, '').length < 10}
        className="w-full py-3 bg-violet-500 text-white text-[14px] font-semibold rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CalendarIcon size={16} />}
        {submitting ? 'Confirmando...' : 'Confirmar Agendamento'}
      </button>
    </form>
  );
}

function BookingSuccess({ booking }) {
  const dateFormatted = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('pt-BR');

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-500" />
      </div>
      <h2 className="text-[20px] font-bold text-ink-900 mb-2">Agendamento Confirmado!</h2>
      <p className="text-[14px] text-ink-600 mb-6">Voce recebera uma confirmacao via WhatsApp.</p>

      <div className="bg-violet-50 rounded-lg p-4 max-w-xs mx-auto text-left space-y-2">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-ink-500 w-16">Nome:</span>
          <span className="font-medium text-ink-900">{booking.client_name}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-ink-500 w-16">Data:</span>
          <span className="font-medium text-ink-900">{dateFormatted}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-ink-500 w-16">Horario:</span>
          <span className="font-medium text-ink-900">{booking.booking_time.substring(0, 5)}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-ink-500 w-16">Servico:</span>
          <span className="font-medium text-ink-900">{booking.service_interest}</span>
        </div>
      </div>
    </div>
  );
}

export default function PublicBookingPage() {
  const { tenantSlug } = useParams();
  const [activeDays, setActiveDays] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState(1); // 1=date, 2=time, 3=form, 4=success
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    publicApi.get(`/booking/${tenantSlug}/availability-month`)
      .then(r => setActiveDays(r.data.activeDays || []))
      .catch(() => setError('Pagina de agendamento nao encontrada.'));
  }, [tenantSlug]);

  function handleSelectDate(date) {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep(2);
  }

  function handleSelectTime(time) {
    setSelectedTime(time);
    setStep(3);
  }

  async function handleConfirm(formData) {
    setSubmitting(true);
    try {
      const { data } = await publicApi.post(`/booking/${tenantSlug}/confirm`, {
        ...formData,
        booking_date: selectedDate,
        booking_time: selectedTime,
      });
      setBooking(data);
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao confirmar agendamento';
      if (err.response?.status === 409) {
        setSelectedTime(null);
        setStep(2);
      }
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-ink-400 mx-auto mb-4" />
          <h2 className="text-[16px] font-semibold text-ink-700">{error}</h2>
        </div>
      </div>
    );
  }

  if (activeDays === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" size={32} />
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Data' },
    { num: 2, label: 'Horario' },
    { num: 3, label: 'Dados' },
    { num: 4, label: 'Confirmado' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-[16px] font-extrabold mx-auto mb-3 shadow-sm">L</div>
          <h1 className="text-[20px] font-bold text-ink-900">Agendar Atendimento</h1>
          <p className="text-[13px] text-ink-500 mt-1">Escolha o melhor dia e horario para voce</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                step >= s.num ? 'bg-violet-500 text-white' : 'bg-ink-100 text-ink-400'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 transition-all ${step > s.num ? 'bg-violet-400' : 'bg-ink-150'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-6">
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon size={16} className="text-violet-500" />
                <h2 className="text-[15px] font-semibold text-ink-900">Escolha uma data</h2>
              </div>
              <BookingCalendar
                tenantSlug={tenantSlug}
                activeDays={activeDays}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-violet-500" />
                  <h2 className="text-[15px] font-semibold text-ink-900">Escolha um horario</h2>
                </div>
                <button onClick={() => { setStep(1); setSelectedTime(null); }} className="text-[12px] text-violet-600 hover:text-violet-700 font-medium">
                  Alterar data
                </button>
              </div>
              <p className="text-[13px] text-ink-500 mb-4">
                Data selecionada: <span className="font-medium text-ink-800">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              </p>
              <TimeSlotPicker
                tenantSlug={tenantSlug}
                date={selectedDate}
                selectedTime={selectedTime}
                onSelectTime={handleSelectTime}
              />
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-ink-900">Seus dados</h2>
                <button onClick={() => setStep(2)} className="text-[12px] text-violet-600 hover:text-violet-700 font-medium">
                  Alterar horario
                </button>
              </div>
              <div className="flex items-center gap-3 mb-5 p-3 bg-violet-50 rounded-lg">
                <CalendarIcon size={14} className="text-violet-500" />
                <span className="text-[13px] text-ink-700">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')} as {selectedTime}
                </span>
              </div>
              <BookingForm onSubmit={handleConfirm} submitting={submitting} />
            </>
          )}

          {step === 4 && booking && (
            <BookingSuccess booking={booking} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-ink-400 mt-6">
          Powered by LeadTrack
        </p>
      </div>
    </div>
  );
}
