import { format } from 'date-fns';

const directionColors = {
  outgoing: 'bg-blue-500 text-white',
  incoming: 'bg-gray-200 text-gray-900',
  auto: 'bg-green-500 text-white',
};

const directionLabels = {
  outgoing: 'Enviada',
  incoming: 'Recebida',
  auto: 'Automática',
};

export default function MessageBubble({ message }) {
  const isOutgoing = message.direction !== 'incoming';

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[70%] rounded-lg px-3 py-2 ${directionColors[message.direction]}`}>
        {message.media_url && (
          <img src={message.media_url} alt="" className="rounded mb-1 max-w-full max-h-48 object-cover" />
        )}
        {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
        <div className={`flex items-center gap-2 mt-1 ${isOutgoing ? 'justify-end' : ''}`}>
          <span className="text-[10px] opacity-70">
            {directionLabels[message.direction]} • {format(new Date(message.sent_at), 'HH:mm')}
          </span>
        </div>
      </div>
    </div>
  );
}
