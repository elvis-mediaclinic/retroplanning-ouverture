"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderEtapes } from "./actions";
import { EtapeRow } from "./EtapeRow";
import type { EtapeProjet } from "@/lib/types";

function SortableItem({ etape, projetId, canEdit }: { etape: EtapeProjet; projetId: string; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: etape.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch">
      {canEdit && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex items-center px-2 text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing touch-none shrink-0 border-r border-zinc-100"
          tabIndex={-1}
          aria-label="Déplacer"
        >
          ⠿
        </button>
      )}
      <div className="flex-1 min-w-0">
        <EtapeRow etape={etape} projetId={projetId} canEdit={canEdit} />
      </div>
    </div>
  );
}

export function SortableEtapeList({
  etapes,
  projetId,
  canEdit,
}: {
  etapes: EtapeProjet[];
  projetId: string;
  canEdit: boolean;
}) {
  const [items, setItems] = useState(etapes);
  useEffect(() => { setItems(etapes); }, [etapes]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((e) => e.id === active.id);
      const newIndex = items.findIndex((e) => e.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      await reorderEtapes(projetId, reordered.map((e) => e.id));
    },
    [items, projetId]
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-zinc-100">
          {items.map((etape) => (
            <SortableItem key={etape.id} etape={etape} projetId={projetId} canEdit={canEdit} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
