import type { Lesson } from "@/content/schema";
import type { WorldMeta } from "@/content/worlds";
import type { Progress } from "@/lib/progress";
import { isLessonUnlocked } from "@/lib/progress";
import { useT } from "@/lib/i18n/context";
import { LessonNode, NODE_SIZE, type NodeState } from "./LessonNode";
import { PathFit } from "./PathFit";
import { useNewlyUnlocked } from "@/lib/useNewlyUnlocked";

// Yol geometrisi (piksel). Konteyner sabit 360px: hem 375px'lik telefonlara
// sığar hem de düğüm ↔ SVG yol koordinatları ölçeklemeden birebir örtüşür.
const PATH_WIDTH = 360;
const ROW_HEIGHT = 122;
const TOP_PAD = 66; // "BAŞLA" balonu için üst boşluk
const OFFSETS = [0, 64, 98, 64, 0, -64, -98, -64];

function nodeCenter(i: number) {
  return { x: PATH_WIDTH / 2 + OFFSETS[i % OFFSETS.length], y: TOP_PAD + i * ROW_HEIGHT };
}

function labelSide(i: number): "left" | "right" {
  const off = OFFSETS[i % OFFSETS.length];
  if (off > 0) return "left";
  if (off < 0) return "right";
  return i % OFFSETS.length === 0 ? "left" : "right";
}

function segment(i: number) {
  const a = nodeCenter(i);
  const b = nodeCenter(i + 1);
  const dy = ROW_HEIGHT * 0.55;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + dy}, ${b.x} ${b.y - dy}, ${b.x} ${b.y}`;
}

export function WorldSection({
  world,
  lessons,
  progress,
}: {
  world: WorldMeta;
  lessons: Lesson[];
  progress: Progress;
}) {
  const t = useT();
  const worldText = t.worlds[world.id as keyof typeof t.worlds];
  const states: NodeState[] = [];
  let currentAssigned = false;
  for (const lesson of lessons) {
    if (lesson.id in progress.completedLessons) {
      states.push("completed");
    } else if (isLessonUnlocked(progress, lesson.prerequisites)) {
      states.push(currentAssigned ? "unlocked" : "current");
      currentAssigned = true;
    } else {
      states.push("locked");
    }
  }

  const fresh = useNewlyUnlocked(lessons.filter((_, i) => states[i] !== "locked").map((l) => l.id));
  const completed = states.filter((s) => s === "completed").length;
  const pct = lessons.length === 0 ? 0 : Math.round((completed / lessons.length) * 100);
  const allDone = lessons.length > 0 && completed === lessons.length;
  const height = TOP_PAD + (lessons.length - 1) * ROW_HEIGHT + NODE_SIZE / 2 + 74;

  return (
    <section aria-labelledby={`dunya-${world.id}`} className="flex flex-col items-center">
      {/* Dünya başlık bandı */}
      <div
        className="reveal relative w-full overflow-hidden rounded-3xl p-5 text-white sm:p-6"
        style={{
          background: `linear-gradient(135deg, ${world.color}, ${world.colorDark})`,
          boxShadow: `0 6px 0 ${world.colorDark}, 0 18px 36px -14px ${world.color}`,
        }}
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 opacity-20"
          width="190"
          height="190"
          viewBox="0 0 190 190"
          fill="none"
          stroke="white"
          strokeWidth="3"
        >
          <circle cx="110" cy="80" r="70" />
          <circle cx="110" cy="80" r="46" />
          <rect x="70" y="40" width="80" height="80" rx="16" transform="rotate(14 110 80)" />
        </svg>

        <div className="relative flex items-center gap-4">
          <div
            aria-hidden
            className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm sm:h-16 sm:w-16"
          >
            {world.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.16em]">
                {t.map.world(world.id)}
              </span>
              {world.bonus && (
                <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-950">
                  {t.map.bonus}
                </span>
              )}
            </div>
            <h2 id={`dunya-${world.id}`} className="mt-1 text-xl font-black leading-tight sm:text-2xl">
              {worldText.title}
            </h2>
            <p className="text-sm font-semibold text-white/85">{worldText.description}</p>
          </div>
          <div className="hidden flex-none text-right sm:block">
            <div className="text-2xl font-black tabular-nums">
              {completed}
              <span className="text-white/60">/{lessons.length}</span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/75">{t.map.lessonsUnit}</div>
          </div>
        </div>

        <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-black/20">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-700"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t.map.worldProgress(world.id)}
          />
        </div>
      </div>

      {/* Kıvrımlı ders yolu */}
      <PathFit width={PATH_WIDTH} height={height}>
        <svg
          aria-hidden
          className="absolute inset-0"
          width={PATH_WIDTH}
          height={height}
          viewBox={`0 0 ${PATH_WIDTH} ${height}`}
          fill="none"
        >
          {lessons.slice(0, -1).map((_, i) => {
            const done = states[i] === "completed";
            return (
              <path
                key={i}
                d={segment(i)}
                stroke={done ? world.color : "var(--line)"}
                strokeWidth={done ? 8 : 7}
                strokeLinecap="round"
                strokeDasharray={done ? undefined : "2 14"}
                opacity={done ? 0.9 : 1}
              />
            );
          })}
        </svg>

        {lessons.map((lesson, i) => {
          const { x, y } = nodeCenter(i);
          return (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              state={states[i]}
              x={x}
              y={y}
              side={labelSide(i)}
              labelWidth={OFFSETS[i % OFFSETS.length] === 0 ? 120 : 170}
              color={world.color}
              colorDark={world.colorDark}
              fresh={fresh.has(lesson.id)}
            />
          );
        })}

        {allDone && (
          <div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-sm font-black uppercase tracking-widest"
            style={{ top: height - 36, color: world.color }}
          >
            {t.map.worldDone}
          </div>
        )}
      </PathFit>
    </section>
  );
}
