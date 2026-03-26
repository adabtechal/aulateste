import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GripVertical, User } from 'lucide-react';

export default function LeadCard({ lead, onClick, overlay }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { type: 'lead', lead }
  });

  const style = overlay ? {} : {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const timeInStage = lead.updated_at
    ? formatDistanceToNow(new Date(lead.updated_at), { locale: ptBR, addSuffix: false })
    : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(lead)}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400 shrink-0" />
            <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">{lead.phone}</p>
          <div className="flex items-center gap-2 mt-2">
            {lead.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
            {timeInStage && <span className="text-xs text-gray-400 ml-auto">{timeInStage}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
