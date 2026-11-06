"use client";

import { useEffect, useMemo, useState } from "react";
import { LessonFxContext } from "@/lib/lessonFx";
import { IdleHelper } from "./IdleHelper";
import { launchXpFlight } from "@/lib/xpFlight";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import type { Lesson } from "@/content/schema";
import { getWorldMeta } from "@/content/worlds";
import { useProgressStore } from "@/lib/useProgressStore";
import { clearDraft } from "@/lib/answerDraft";
import { ExerciseRouter } from "@/components/exercises/ExerciseRouter";
import { StepRunner } from "@/components/runner/StepRunner";
import { ConceptVisual, type VisualSpec } from "@/components/visuals/ConceptVisual";
import { MascotSays } from "@/components/mascot/Mascot";
import { useHref, useLocale, useT } from "@/lib/i18n/context";
import { ProgressBar } from "./ProgressBar";
import { SummaryCard } from "./SummaryCard";

type Stage =
  | { kind: "hook" }
  | { kind: "concept"; index: number }
  | { kind: "example"; index: number }
  | { kind: "exercise"; index: number }
  | { kind: "summary" };

const XP_PER_CORRECT = 10;
const XP_FIRST_TRY_BONUS = 5;

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const href = useHref();
  const gainXp = useProgressStore((s) => s.gainXp);
  const completeLesson = useProgressStore((s) => s.completeLesson);
  const reportWrongAnswer = useProgressStore((s) => s.reportWrongAnswer);
  const play = useProgressStore((s) => s.play);

  const [stage, setStage] = useState<Stage>({ kind: "hook" });
  const [correctCount, setCorrectCount] = useState(0);
  /** Üst üste doğru cevap sayısı (S1). Yanlışta sıfırlanır. */
  const [combo, setCombo] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [exerciseAttempts, setExerciseAttempts] = useState<Record<number, number>>({});

  // Kavram görselleri `layout` animasyonu için ayrı bir paket kullanır: ders açılır açılmaz arka planda indir.
  useEffect(() => {
    void import("@/components/visuals/visualFeatures");
  }, []);

  // Ders sürerken kutlama penceresi (seviye/hedef/seri) araya girmesin; özet ekranında gösterilir.
  const inProgress = stage.kind !== "summary";
  useEffect(() => {
    useProgressStore.setState({ holdCelebrations: inProgress });
    return () => useProgressStore.setState({ holdCelebrations: false });
  }, [inProgress]);

  // Duolingo tarzı ilerleme çubuğu: hook + concept + examples + exercises + summary
  const totalSteps =
    1 + lesson.concept.length + lesson.workedExamples.length + lesson.exercises.length + 1;
  const currentStepIndex = useMemo(() => {
    switch (stage.kind) {
      case "hook":
        return 0;
      case "concept":
        return 1 + stage.index;
      case "example":
        return 1 + lesson.concept.length + stage.index;
      case "exercise":
        return 1 + lesson.concept.length + lesson.workedExamples.length + stage.index;
      case "summary":
        return totalSteps - 1;
    }
  }, [stage, lesson, totalSteps]);

  function goNext() {
    if (stage.kind === "hook") {
      if (lesson.concept.length > 0) setStage({ kind: "concept", index: 0 });
      else if (lesson.workedExamples.length > 0) setStage({ kind: "example", index: 0 });
      else setStage({ kind: "exercise", index: 0 });
      return;
    }
    if (stage.kind === "concept") {
      if (stage.index + 1 < lesson.concept.length) {
        setStage({ kind: "concept", index: stage.index + 1 });
      } else if (lesson.workedExamples.length > 0) {
        setStage({ kind: "example", index: 0 });
      } else {
        setStage({ kind: "exercise", index: 0 });
      }
      return;
    }
    if (stage.kind === "example") {
      if (stage.index + 1 < lesson.workedExamples.length) {
        setStage({ kind: "example", index: stage.index + 1 });
      } else {
        setStage({ kind: "exercise", index: 0 });
      }
      return;
    }
    if (stage.kind === "exercise") {
      if (stage.index + 1 < lesson.exercises.length) {
        setStage({ kind: "exercise", index: stage.index + 1 });
      } else {
        const score = Math.round((correctCount / lesson.exercises.length) * 100);
        completeLesson(lesson.id, score);
        play("complete");
        setStage({ kind: "summary" });
      }
      return;
    }
  }

  function handleExerciseResult(exerciseIndex: number, correct: boolean) {
    const attempts = (exerciseAttempts[exerciseIndex] ?? 0) + 1;
    setExerciseAttempts((prev) => ({ ...prev, [exerciseIndex]: attempts }));

    if (correct) {
      clearDraft(lesson.exercises[exerciseIndex].id);
      const earned = attempts === 1 ? XP_PER_CORRECT + XP_FIRST_TRY_BONUS : XP_PER_CORRECT;
      launchXpFlight(earned);
      gainXp(earned);
      setCombo((c) => c + 1);
      setXpEarned((x) => x + earned);
      setCorrectCount((c) => c + 1);
      goNext();
    } else {
      setCombo(0);
      // İlk yanlış denemede alıştırmayı tekrar kuyruğuna ekle (1/3/7 gün
      // aralıklı tekrar — bkz. lib/srs.ts). Aynı alıştırmaya art arda yanlış
      // basılması kuyruğu bozmasın diye sadece ilk denemede kaydediyoruz.
      if (attempts === 1) reportWrongAnswer(lesson.exercises[exerciseIndex].id);
      // Yanlış cevapta aynı soru kalır; kullanıcı tekrar deneyebilsin diye
      // ExerciseRouter'ın kendi "Kontrol Et" akışı zaten tekrar denemeye izin verir.
      // Adımı ilerletmiyoruz.
    }
  }

  const stageKey = `${stage.kind}-${"index" in stage ? stage.index : 0}`;

  const world = getWorldMeta(lesson.worldId);
  const accent = world?.color ?? "var(--brand)";
  const accentDark = world?.colorDark ?? "var(--brand-dark)";
  const showContinue = stage.kind !== "exercise" && stage.kind !== "summary";

  return (
    // min-h-screen (100vh) KULLANMA: <main>, sticky Header'ın (64px) ALTINDA
    // yer alır ve zaten flex-1 ile kalan alanı dolduruyor. 100vh istemek,
    // header'ın yüksekliğini hesaba katmadan tam viewport talep eder ve her
    // sayfada gereksiz bir dikey scroll'a yol açar.
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-6">
      {/* üst çubuk: çıkış + ilerleme */}
      <div className="flex items-center gap-3">
        <Link
          href={href({ name: "home" })}
          aria-label={t.lesson.exitAria}
          className="grid h-11 w-11 flex-none place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <ProgressBar current={currentStepIndex} total={totalSteps - 1} />
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={stageKey}
          initial={{ opacity: 0, x: 56, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -56, scale: 0.98 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="flex-1 py-8"
        >
          {stage.kind === "hook" && (
            <div className="flex flex-col gap-7">
              <div className="flex items-center gap-4">
                <div
                  aria-hidden
                  className="grid h-[4.5rem] w-[4.5rem] flex-none place-items-center rounded-2xl text-4xl"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
                    boxShadow: `0 6px 0 ${accentDark}`,
                  }}
                >
                  {world?.emoji ?? "🧠"}
                </div>
                <div className="min-w-0">
                  <span className="chip">
                    {t.map.lessonMeta(lesson.id, lesson.estimatedMinutes)}
                  </span>
                  <h1 className="mt-1.5 text-2xl font-black leading-tight sm:text-3xl">{lesson.title}</h1>
                </div>
              </div>

              <div className="card p-6" style={{ borderLeft: `8px solid ${accent}` }}>
                <p className="text-[1.45rem] font-black leading-snug sm:text-[1.65rem]">{lesson.hook.text}</p>
              </div>

              <MascotSays mood="wave">
                {lesson.id === "0.1" ? t.lesson.mascotFirst : t.lesson.mascotOther}{" "}
                <span className="text-muted">{t.lesson.willTake(lesson.estimatedMinutes)}</span>
              </MascotSays>

              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted">{t.lesson.inThisLesson}</h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {lesson.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] font-bold leading-snug">
                      <span
                        aria-hidden
                        className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-white"
                        style={{ background: accent }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      </span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {stage.kind === "concept" && (
            <div className="flex flex-col gap-5">
              <span className="chip self-start">
                {t.lesson.conceptChip(stage.index + 1, lesson.concept.length)}
              </span>
              <h2 className="text-3xl font-black leading-tight">{lesson.concept[stage.index].heading}</h2>
              <div
                className="card p-6 text-[1.08rem] font-semibold leading-relaxed"
                style={{ borderLeft: `8px solid ${accent}` }}
              >
                {lesson.concept[stage.index].body}
              </div>
              <ConceptVisual
                visual={lesson.concept[stage.index].visual as VisualSpec | undefined}
                accent={accent}
                label={t.lesson.visualLabel(lesson.concept[stage.index].heading)}
              />
            </div>
          )}

          {stage.kind === "example" && (
            <div className="flex flex-col gap-5">
              <span className="chip self-start">{t.lesson.workedExample}</span>
              <h2 className="text-2xl font-black leading-snug">{lesson.workedExamples[stage.index].prompt}</h2>

              {lesson.workedExamples[stage.index].runnerSource ? (
                <StepRunner
                  lang={locale}
                  source={lesson.workedExamples[stage.index].runnerSource!}
                  inputs={lesson.workedExamples[stage.index].runnerInputs}
                />
              ) : (
                <pre className="code-block">{lesson.workedExamples[stage.index].pseudocode.join("\n")}</pre>
              )}

              <ol className="flex flex-col gap-2.5">
                {lesson.workedExamples[stage.index].steps.map((step, i) => (
                  <li key={i} className="card flex items-start gap-3 p-3.5 text-[14.5px] font-semibold leading-snug">
                    <span
                      className="grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-black text-white"
                      style={{ background: accent }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="mr-2 rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] font-bold text-muted">
                        {t.lesson.lineLabel(step.line + 1)}
                      </span>
                      {step.explain}
                      {step.vars && (
                        <span className="mt-1.5 flex flex-wrap gap-1.5">
                          {Object.entries(step.vars).map(([k, v]) => (
                            <span key={k} className="rounded-md bg-brand-soft px-2 py-0.5 font-mono text-xs font-bold text-brand">
                              {k} = {String(v)}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {stage.kind === "exercise" && (
            <div className="flex flex-col gap-5">
              <span className="chip self-start">
                {t.lesson.exerciseChip(stage.index + 1, lesson.exercises.length)}
              </span>
              <LessonFxContext.Provider value={{ combo }}>
              <ExerciseRouter
                // Yanlış cevapta deneme sayısı artar; key değişince bileşen yeniden
                // mount edilir ve iç durumu (checked/selected) sıfırlanır — böylece
                // kullanıcı aynı soruyu tekrar deneyebilir.
                key={`${stage.index}-${exerciseAttempts[stage.index] ?? 0}`}
                exercise={lesson.exercises[stage.index]}
                onResult={(correct) => handleExerciseResult(stage.index, correct)}
              />
              </LessonFxContext.Provider>
              <IdleHelper
                hint={lesson.exercises[stage.index].hint}
                resetKey={`${stage.index}-${exerciseAttempts[stage.index] ?? 0}`}
              />
            </div>
          )}

          {stage.kind === "summary" && (
            <SummaryCard
              title={lesson.title}
              lessonId={lesson.id}
              accent={accent}
              points={lesson.summary}
              xpEarned={xpEarned}
              accuracy={Math.round((correctCount / lesson.exercises.length) * 100)}
              onFinish={() => router.push(href({ name: "home" }))}
            />
          )}
        </m.div>
      </AnimatePresence>

      {showContinue && (
        <div className="sticky bottom-0 -mx-4 border-t-2 border-line bg-bg/90 px-4 py-4 backdrop-blur-md">
          <button type="button" onClick={goNext} className="btn btn-block">
            {t.exercise.continue}
          </button>
        </div>
      )}
    </div>
  );
}
