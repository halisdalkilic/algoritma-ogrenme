"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { FlowchartBuildExercise as FlowchartBuildExerciseType } from "@/content/schema";
import { NodeShape } from "@/components/flowchart/NodeShape";
import { validateFlowchart } from "@/components/flowchart/validateFlowchart";
import type { ExerciseProps } from "./types";
import { FeedbackBanner } from "./FeedbackBanner";
import { useT } from "@/lib/i18n/context";
import { ContinueButton } from "./ContinueButton";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function LabelChip({
  id,
  text,
  selected,
  onSelect,
}: {
  id: string;
  text: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  // dnd-kit'in PointerSensor/KeyboardSensor dinleyicileri, sürükleme
  // aktivasyonu için pointerdown/keydown'ı ele geçirir ve ardından gelen
  // native "click" olayını bastırır — bu yüzden seçim mantığını `onClick`
  // yerine `onPointerUp` ve kendi `onKeyDown`'ımızla (dnd-kit'inkini
  // ez'erek) tetikliyoruz. Böylece hem sürükleme hem de tıklama/klavye ile
  // seçim aynı elemanda birlikte çalışır.
  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerUp={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      className={[
        "min-h-11 cursor-grab select-none whitespace-nowrap rounded-xl border-2 border-b-4 px-3.5 py-2 text-sm font-extrabold transition-colors active:cursor-grabbing",
        selected
          ? "border-brand bg-brand text-white"
          : "border-line bg-surface text-ink hover:border-brand",
      ].join(" ")}
    >
      {text}
    </button>
  );
}

function SlotTarget({
  id,
  shape,
  label,
  status,
  onClick,
}: {
  id: string;
  shape: "terminal" | "process" | "decision" | "io";
  label: string;
  status: "neutral" | "correct" | "wrong";
  onClick: () => void;
}) {
  const t = useT();
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    // Sabit piksel genişlik/yükseklik kasten kullanılıyor: bu düğüm,
    // items-center'lı bir flex-col içinde yer alıyor — orada w-full/w-auto
    // çözülecek bir "definite width" bulamaz ve genişlik 0'a çöker.
    <button
      type="button"
      ref={setNodeRef}
      onClick={onClick}
      aria-label={label ? t.exercise.flowBuild.slotFilled(label) : t.exercise.flowBuild.slotEmpty}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      <svg
        viewBox={`0 0 ${NODE_WIDTH} ${NODE_HEIGHT}`}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        className={isOver ? "opacity-80" : ""}
      >
        <NodeShape
          shape={shape}
          x={2}
          y={2}
          width={NODE_WIDTH - 4}
          height={NODE_HEIGHT - 4}
          label={label}
          status={status}
          dashed={label === ""}
        />
      </svg>
    </button>
  );
}

export function FlowchartBuildExercise({
  exercise,
  onResult,
}: ExerciseProps<FlowchartBuildExerciseType>) {
  // Fare: kısa mesafe sürükleyince başlar. Dokunmatik: 150ms basılı tutunca başlar, hızlı kaydırma
  // sayfayı kaydırır. Tıklayarak yerleştirme her cihazda alternatif olarak durur.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const t = useT();
  const chipItems = useMemo(
    () => shuffle(exercise.expectedNodes.map((n, i) => ({ id: `chip-${i}`, text: n.label }))),
    [exercise.expectedNodes],
  );

  // slotLabelByIndex[i] = o slota yerleştirilmiş chip'in id'si (veya null)
  const [slotChip, setSlotChip] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(exercise.expectedNodes.map((_, i) => [i, null])),
  );
  const [checked, setChecked] = useState(false);
  // Sürüklemeden bağımsız, tıklayarak/klavyeyle yerleştirme için: önce bir
  // etiket SEÇİLİR, sonra bir yuvaya TIKLANIR. Fare olmadan (klavye/switch
  // erişimiyle) de tamamen kullanılabilir olmasını sağlar.
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const placedChipIds = new Set(Object.values(slotChip).filter((v): v is string => v !== null));
  const poolChips = chipItems.filter((c) => !placedChipIds.has(c.id));
  const allPlaced = Object.values(slotChip).every((v) => v !== null);

  function placeChip(chipId: string, slotIndex: number) {
    setSlotChip((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[Number(key)] === chipId) next[Number(key)] = null;
      }
      next[slotIndex] = chipId;
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (checked) return;
    const { active, over } = event;
    if (!over) return;
    const slotIndex = Number(String(over.id).replace("slot-", ""));
    placeChip(String(active.id), slotIndex);
  }

  function handleChipSelect(chipId: string) {
    if (checked) return;
    setSelectedChip((prev) => (prev === chipId ? null : chipId));
  }

  function handleSlotClick(slotIndex: number) {
    if (checked) return;
    if (selectedChip) {
      placeChip(selectedChip, slotIndex);
      setSelectedChip(null);
    } else if (slotChip[slotIndex]) {
      removeFromSlot(slotIndex);
    }
  }

  function removeFromSlot(slotIndex: number) {
    if (checked) return;
    setSlotChip((prev) => ({ ...prev, [slotIndex]: null }));
  }

  const validation = useMemo(() => {
    if (!checked) return null;
    const userNodes = exercise.expectedNodes.map((n, i) => ({
      id: `u${i}`,
      shape: n.shape,
      label: chipItems.find((c) => c.id === slotChip[i])?.text ?? "",
    }));
    const userEdges = exercise.expectedNodes.slice(1).map((_, i) => ({ from: `u${i}`, to: `u${i + 1}` }));
    const expectedUserIdNodes = exercise.expectedNodes; // id'ler zaten sırayla
    return validateFlowchart(userNodes, userEdges, expectedUserIdNodes, exercise.expectedEdges);
  }, [checked, exercise, slotChip, chipItems]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <p className="text-[1.35rem] font-black leading-snug">{exercise.question}</p>
        <p className="text-sm font-bold text-muted">{t.exercise.flowBuild.instruction}</p>

        <div className="flex flex-col items-center gap-3">
          {exercise.expectedNodes.map((node, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {i > 0 && <div className="h-5 w-1 rounded-full bg-line" />}
              <div className="relative">
                <SlotTarget
                  id={`slot-${i}`}
                  shape={node.shape}
                  label={chipItems.find((c) => c.id === slotChip[i])?.text ?? ""}
                  status={
                    !checked
                      ? "neutral"
                      : validation?.nodeResults[i]
                        ? "correct"
                        : "wrong"
                  }
                  onClick={() => handleSlotClick(i)}
                />
                {slotChip[i] && !checked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromSlot(i);
                    }}
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-ink text-xs font-black text-bg"
                    aria-label={t.exercise.flowBuild.removeLabel}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {poolChips.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface-2/60 p-3">
            {poolChips.map((chip) => (
              <LabelChip
                key={chip.id}
                id={chip.id}
                text={chip.text}
                selected={selectedChip === chip.id}
                onSelect={() => handleChipSelect(chip.id)}
              />
            ))}
          </div>
        )}

        {checked && (
          <FeedbackBanner correct={!!validation?.correct}>
            {validation?.correct ? t.exercise.flowBuild.ok : t.exercise.flowBuild.wrong}
          </FeedbackBanner>
        )}

        {!checked ? (
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={!allPlaced}
            className="btn btn-block"
          >
            {t.exercise.check}
          </button>
        ) : (
          <ContinueButton correct={!!validation?.correct} onClick={() => onResult(!!validation?.correct)} />
        )}
      </div>
    </DndContext>
  );
}
