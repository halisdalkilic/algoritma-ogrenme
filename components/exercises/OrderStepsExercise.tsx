"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { OrderStepsExercise as OrderStepsExerciseType } from "@/content/schema";
import type { ExerciseProps } from "./types";
import { FeedbackBanner } from "./FeedbackBanner";
import { useT } from "@/lib/i18n/context";
import { shuffledIndices } from "@/lib/answers";
import { ContinueButton } from "./ContinueButton";

function SortableStep({
  id,
  text,
  status,
}: {
  id: string;
  text: string;
  status: "idle" | "correct" | "wrong";
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="choice cursor-grab select-none whitespace-pre font-mono text-[0.9rem] active:cursor-grabbing"
      data-state={status === "correct" ? "correct" : status === "wrong" ? "wrong" : "idle"}
    >
      <span aria-hidden className="grid flex-none grid-cols-2 gap-[3px] text-muted">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="h-[4px] w-[4px] rounded-full bg-current" />
        ))}
      </span>
      <span className="min-w-0 flex-1 overflow-x-auto">{text}</span>
    </div>
  );
}

export function OrderStepsExercise({
  exercise,
  onResult,
}: ExerciseProps<OrderStepsExerciseType>) {
  const t = useT();
  // order[i] = exercise.steps'teki orijinal indeks
  const [order, setOrder] = useState<number[]>(() => shuffledIndices(exercise.steps.length));
  const [checked, setChecked] = useState(false);

  const ids = useMemo(() => order.map((i) => `step-${i}`), [order]);
  const isCorrect = useMemo(
    () => order.every((v, i) => v === exercise.correctOrder[i]),
    [order, exercise.correctOrder],
  );

  const sensors = useSensors(
    // Fare: kısa mesafe sürükleyince başlar. Dokunmatik: 150ms basılı tutunca başlar; hızlı kaydırma sayfayı kaydırır.
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Ekran okuyucu duyuruları için: "step-3" → adımın metni, ve listedeki sırası (1'den başlar)
  const stepLabel = (id: string | number) => `"${exercise.steps[Number(String(id).replace("step-", ""))]}"`;
  const positionOf = (id: string | number) => ids.indexOf(String(id)) + 1;

  function handleDragEnd(event: DragEndEvent) {
    if (checked) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    setOrder((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[1.35rem] font-black leading-snug">{exercise.question}</p>
      <p className="text-sm font-bold text-muted">{t.exercise.order.instruction}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          // dnd-kit'in varsayılan ekran okuyucu metinleri İngilizcedir; dile göre sözlükten verilir
          screenReaderInstructions: { draggable: t.exercise.order.dragInstructions },
          announcements: {
            onDragStart: ({ active }) => t.exercise.order.picked(stepLabel(active.id)),
            onDragOver: ({ active, over }) => (over ? t.exercise.order.overItem(stepLabel(active.id), positionOf(over.id)) : t.exercise.order.outside(stepLabel(active.id))),
            onDragEnd: ({ active, over }) => (over ? t.exercise.order.dropped(stepLabel(active.id), positionOf(over.id)) : t.exercise.order.droppedNoTarget(stepLabel(active.id))),
            onDragCancel: ({ active }) => t.exercise.order.cancelled(stepLabel(active.id)),
          },
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {order.map((originalIndex, position) => (
              <SortableStep
                key={originalIndex}
                id={`step-${originalIndex}`}
                text={exercise.steps[originalIndex]}
                status={
                  !checked
                    ? "idle"
                    : originalIndex === exercise.correctOrder[position]
                      ? "correct"
                      : "wrong"
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {checked && (
        <FeedbackBanner correct={isCorrect}>
          {isCorrect ? t.exercise.order.ok : t.exercise.order.wrong}
        </FeedbackBanner>
      )}

      {!checked ? (
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="btn btn-block"
        >
          {t.exercise.check}
        </button>
      ) : (
        <ContinueButton correct={isCorrect} onClick={() => onResult(isCorrect)} />
      )}
    </div>
  );
}
