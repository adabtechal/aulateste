import { useDroppable } from '@dnd-kit/core';
import LeadCard from './LeadCard';

export default function KanbanColumn({ stage, leads, onLeadClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'column', stage }
  });

  return (
    <div className="flex flex-col w-[280px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-[10px] py-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.02em] text-ink-900">{stage.name}</h3>
        <span className="font-mono text-[11px] text-ink-500 bg-ink-100 px-[7px] py-[1px] rounded-full">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-[10px] space-y-[10px] min-h-[200px] transition-all duration-[200ms] ${
          isOver
            ? 'bg-violet-50 border-2 border-violet-300 border-dashed'
            : 'bg-ink-75 border-2 border-transparent'
        }`}
      >
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
        ))}
        {leads.length === 0 && (
          <p className="text-xs text-ink-400 text-center py-8">
            {isOver ? 'Solte aqui' : 'Sem leads'}
          </p>
        )}
      </div>
    </div>
  );
}
