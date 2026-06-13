'use client';

import { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { JobApplication, StatusValue } from '@/types';
import { STATUS_ORDER, STATUS_LABELS } from '@/lib/constants';
import { useApp } from '@/context/AppProvider';
import { useT } from '@/i18n/I18nProvider';
import { useToast } from '@/context/ToastProvider';
import { KanbanColumn } from './KanbanColumn';
import { JobCardView } from './JobCard';

export function KanbanBoard({
  apps, onOpen, onEdit, onAdd,
}: {
  apps: JobApplication[];
  onOpen: (app: JobApplication) => void;
  onEdit: (app: JobApplication) => void;
  onAdd: (status: StatusValue) => void;
}) {
  const { changeStatus } = useApp();
  const { t, lang } = useT();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<StatusValue | null>(null);
  const [collapsed, setCollapsed] = useState<Set<StatusValue>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byStatus = (s: StatusValue) => apps.filter((a) => a.status === s);
  const activeApp = activeId ? apps.find((a) => a.id === activeId) ?? null : null;

  function resolveStatus(overId: string | undefined, overData: Record<string, unknown> | undefined): StatusValue | null {
    if (!overId) return null;
    if (overId.startsWith('col:')) return overId.slice(4) as StatusValue;
    if (overData?.status) return overData.status as StatusValue;
    const overApp = apps.find((a) => a.id === overId);
    return overApp ? overApp.status : null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const s = resolveStatus(e.over?.id ? String(e.over.id) : undefined, e.over?.data.current);
    setOverStatus(s);
  }

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const target = resolveStatus(e.over?.id ? String(e.over.id) : undefined, e.over?.data.current);
    setActiveId(null);
    setOverStatus(null);
    if (!target) return;
    const app = apps.find((a) => a.id === id);
    if (!app || app.status === target) return;

    const prev = app.status;
    changeStatus(id, target);
    const label = lang === 'hi' ? STATUS_LABELS[target].hi : STATUS_LABELS[target].en;
    toast({
      message: t('confirm.moved', { status: label }),
      action: { label: t('actions.undo'), onClick: () => changeStatus(id, prev) },
      duration: 5000,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => { setActiveId(null); setOverStatus(null); }}
    >
      <div className="scroll-thin flex h-full gap-3 overflow-x-auto px-4 pb-4 pt-2">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            apps={byStatus(status)}
            collapsed={collapsed.has(status)}
            onToggle={() =>
              setCollapsed((prev) => {
                const next = new Set(prev);
                next.has(status) ? next.delete(status) : next.add(status);
                return next;
              })
            }
            onOpen={onOpen}
            onEdit={onEdit}
            onAdd={onAdd}
            isOver={overStatus === status}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22,1,0.36,1)' }}>
        {activeApp ? (
          <div className="w-[284px] rotate-2 scale-[1.02]">
            <JobCardView app={activeApp} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
