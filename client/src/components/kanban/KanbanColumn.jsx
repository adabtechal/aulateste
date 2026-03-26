import { useDroppable } from '@dnd-kit/core';
import LeadCard from './LeadCard';

export default function KanbanColumn({ stage, leads, onLeadClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'column', stage }
  });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
        <h3 className="text-sm font-semibold text-gray-700">{stage.name}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-all duration-200 ${
          isOver
            ? 'bg-blue-50 border-2 border-blue-300 border-dashed ring-2 ring-blue-100'
            : 'bg-gray-50 border-2 border-transparent'
        }`}
      >
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
        ))}
        {leads.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            {isOver ? '🎯 Solte aqui' : 'Sem leads'}
          </p>
        )}
      </div>
    </div>
  );
}
