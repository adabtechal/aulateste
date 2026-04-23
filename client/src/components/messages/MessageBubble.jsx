import { format } from 'date-fns';

const directionColors = {
  outgoing: 'bg-violet-500 text-white',
  incoming: 'bg-ink-100 text-ink-900',
  auto: 'bg-success-500 text-white',
};

const directionLabels = {
  outgoing: 'Enviada',
  incoming: 'Recebida',
  auto: 'Automatica',
};

export default function MessageBubble({ message }) {
  const isOutgoing = message.direction !== 'incoming';

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
