import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GripVertical, Clock } from 'lucide-react';

function colorInitial(name) {
  const colors = ['var(--color-violet-500,#5a4a9c)', 'var(--color-coral-500,#c17d24)', 'var(--color-ink-700,#383548)', '#3a7b93', '#4d9768'];
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[h % colors.length];
}

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

  const initials = lead.name ? lead.name[0].toUpperCase() : '?';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-ink-0 border border-ink-150 rounded-[11px] p-[12px_14px] cursor-pointer transition-all duration-[180ms] hover:border-ink-200 hover:shadow-sm"
      onClick={() => onClick?.(lead)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 min-w-0">
          <button {...attributes} {...listeners} className="mt-0.5 text-ink-300 hover:text-ink-600 cursor-grab">
            <GripVertical size={14} />
          </button>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink-900 truncate leading-tight tracking-tight">{lead.name}</p>
            <p className="font-mono text-[10px] text-ink-500 mt-[2px]">{lead.phone}</p>
          </div>
        </div>
        <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0" style={{ background: colorInitial(lead.name) }}>
          {initials}
        </div>
      </div>
      <div className="flex items-center justify-between mt-[9px] pt-[6px] border-t border-ink-100">
        <div className="flex gap-1">
          {lead.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] font-medium px-[6px] py-[2px] rounded-xs bg-ink-100 text-ink-600">{tag}</span>
          ))}
        </div>
        {timeInStage && (
          <span className="text-[10px] text-ink-500 font-mono inline-flex items-center gap-[3px]">
            <Clock size={11} />{timeInStage}
          </span>
        )}
      </div>
    </div>
  );
}
