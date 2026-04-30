import { format } from 'date-fns';
import { FileText } from 'lucide-react';

const directionColors = {
  outgoing: 'bg-violet-500 text-white',
  incoming: 'bg-ink-100 text-ink-900',
  auto: 'bg-success-500 text-white',
};

const directionLabels = {
  outgoing: 'Enviada',
  incoming: 'Recebida',
  auto: 'Automatica',
  internal: 'Nota interna',
};

export default function MessageBubble({ message }) {
  const isInternal = message.direction === 'internal';
  const isOutgoing = message.direction !== 'incoming' && !isInternal;

  // Internal notes — distinct full-width centered layout with warning/amber tones
  if (isInternal) {
    return (
      <div className="flex justify-center my-3">
        <div className="max-w-[85%] w-full rounded-lg px-4 py-3 bg-warning-50 border border-warning-100 border-dashed">
          <div className="flex items-center gap-[6px] mb-[6px]">
            <FileText size={13} className="text-warning-700" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-warning-700">
              Nota interna
            </span>
            <span className="text-[10px] text-warning-500 font-mono ml-auto">
              {format(new Date(message.sent_at), 'dd/MM HH:mm')}
            </span>
          </div>
          <p className="text-[13px] text-ink-800 whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[70%] rounded-[11px] px-[14px] py-[10px] ${directionColors[message.direction]}`}>
        {message.media_url && (
          <img src={message.media_url} alt="" className="rounded-lg mb-1 max-w-full max-h-48 object-cover" />
        )}
        {message.content && <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{message.content}</p>}
        <div className={`flex items-center gap-2 mt-1 ${isOutgoing ? 'justify-end' : ''}`}>
          <span className="text-[10px] opacity-70">
            {directionLabels[message.direction]} · {format(new Date(message.sent_at), 'HH:mm')}
          </span>
        </div>
      </div>
    </div>
  );
}
