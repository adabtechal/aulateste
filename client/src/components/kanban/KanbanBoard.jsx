import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import KanbanColumn from './KanbanColumn';
import LeadCard from './LeadCard';
import * as api from '../../services/api';

// Custom collision detection: prefer columns over individual leads
function customCollision(args) {
  // First try pointerWithin (more accurate for columns)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    // Prefer column droppables over lead draggables
    const columnHit = pointerCollisions.find(c => c.data?.droppableContainer?.data?.current?.type === 'column');
    if (columnHit) return [columnHit];
    return pointerCollisions;
  }
  // Fallback to rectIntersection
  return rectIntersection(args);
}

export default function KanbanBoard({ stages, leads, onLeadClick }) {
  const [activeId, setActiveId] = useState(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const moveMut = useMutation({
    mutationFn: ({ leadId, stageId }) => api.moveLeadToStage(leadId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      toast.success('Lead movido com sucesso');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao mover lead')
  });

  const leadsByStage = (stageId) => leads.filter(l => l.current_stage_id === stageId);
  const activeLead = leads.find(l => l.id === activeId);

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id;
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Determine target stage - the over target could be a column or a lead inside a column
    let targetStageId;
    if (over.data?.current?.type === 'column') {
      targetStageId = over.id;
    } else if (over.data?.current?.type === 'lead') {
      const overLead = leads.find(l => l.id === over.id);
      targetStageId = overLead?.current_stage_id;
    }

    if (targetStageId && targetStageId !== lead.current_stage_id) {
      moveMut.mutate({ leadId, stageId: targetStageId });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {stages.map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage(stage.id)}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200 }}>
        {activeLead ? (
          <div className="rotate-2 scale-105">
            <LeadCard lead={activeLead} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
