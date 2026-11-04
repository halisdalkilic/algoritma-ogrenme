"use client";

import { useMemo, useState } from "react";
import { run, stringifyValue, type Value } from ".";
import type { Lang } from "./lang";
import { useLocale, useT } from "@/lib/i18n/context";

function CtrlButton({
  onClick,
  disabled,
  label,
  children,
  primary,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-11 place-items-center rounded-xl border-2 border-b-4 font-black transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 ${
        primary
          ? "w-14 border-brand-dark bg-brand text-white"
          : "w-11 border-line bg-surface text-ink hover:border-brand"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Sözde kodu satır satır çalıştıran, adım kontrolüyle (▶/⏭/⏮) gezinilebilen
 * görsel yürütücü. Program, mount olduğunda TAMAMEN çalıştırılır (inputs
 * önceden verilir) ve üretilen adımlar dizisinde ileri/geri gezinilir —
 * böylece gerçek bir kullanıcı girdisi beklemeden geri gitmek de mümkündür.
 */
export function StepRunner({
  source,
  inputs = [],
  title,
  lang,
}: {
  source: string;
  inputs?: Value[];
  title?: string;
  lang?: Lang;
}) {
  const t = useT();
  const locale = useLocale();
  const language: Lang = lang ?? locale;
  const result = useMemo(() => run(source, inputs, { lang: language }), [source, inputs, language]);
  const [cursor, setCursor] = useState(0);

  const lines = useMemo(() => source.split("\n"), [source]);
  const steps = result.steps;
  const hasSteps = steps.length > 0;
  const current = hasSteps ? steps[Math.min(cursor, steps.length - 1)] : undefined;
  const atStart = cursor <= 0;
  const atEnd = cursor >= steps.length - 1;

  const varEntries = current ? Object.entries(current.vars) : [];

  return (
    <div className="flex flex-col gap-3">
      {title && <h3 className="font-black">{title}</h3>}

      {/* kod paneli */}
      <div className="code-block !p-0">
        <div className="flex items-center gap-1.5 border-b-2 border-[var(--code-line)] px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-[#ff6c61]" />
          <span className="h-3 w-3 rounded-full bg-[#f5b13a]" />
          <span className="h-3 w-3 rounded-full bg-[#35d27c]" />
          <span className="ml-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/45">{t.runner.codeTitle}</span>
        </div>
        <div className="py-2">
          {lines.map((line, i) => {
            const active = current?.line === i;
            return (
              <div
                key={i}
                className="flex whitespace-pre border-l-4 pr-4 transition-colors"
                style={{
                  borderColor: active ? "#ffd25e" : "transparent",
                  background: active ? "rgba(139,116,255,0.28)" : "transparent",
                  color: active ? "#fff" : "rgba(231,233,255,0.82)",
                }}
              >
                <span className="w-9 flex-none select-none pr-3 text-right text-xs leading-[1.7rem] text-white/30">
                  {i + 1}
                </span>
                <span>{line || " "}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!result.ok && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border-2 p-3 text-sm font-bold"
          style={{ background: "var(--bad-soft)", borderColor: "var(--bad)", color: "var(--bad-ink)" }}
        >
          <span aria-hidden>⚠️</span>
          {result.error}
        </div>
      )}

      {/* kontroller */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CtrlButton label={t.runner.restart} disabled={atStart} onClick={() => setCursor(0)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 5h2.5v14H6zM20 5.5v13a.8.8 0 0 1-1.25.66L9.5 12.66a.8.8 0 0 1 0-1.32l9.25-6.5A.8.8 0 0 1 20 5.5z" />
            </svg>
          </CtrlButton>
          <CtrlButton label={t.runner.back} disabled={atStart} onClick={() => setCursor((c) => Math.max(0, c - 1))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17 5.5v13a.8.8 0 0 1-1.25.66L6.5 12.66a.8.8 0 0 1 0-1.32l9.25-6.5A.8.8 0 0 1 17 5.5z" />
            </svg>
          </CtrlButton>
          <CtrlButton
            label={t.runner.forward}
            primary
            disabled={atEnd}
            onClick={() => setCursor((c) => Math.min(steps.length - 1, c + 1))}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M7 5.5v13a.8.8 0 0 0 1.25.66l9.25-6.5a.8.8 0 0 0 0-1.32L8.25 4.84A.8.8 0 0 0 7 5.5z" />
            </svg>
          </CtrlButton>
          <CtrlButton label={t.runner.end} disabled={atEnd} onClick={() => setCursor(steps.length - 1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18 5h-2.5v14H18zM4 5.5v13a.8.8 0 0 0 1.25.66l9.25-6.5a.8.8 0 0 0 0-1.32L5.25 4.84A.8.8 0 0 0 4 5.5z" />
            </svg>
          </CtrlButton>
        </div>

        <div className="min-w-0 flex-1 text-right">
          <div className="text-xs font-black uppercase tracking-wider text-muted">
            {t.runner.step} <span className="text-ink">{hasSteps ? cursor + 1 : 0}</span> / {steps.length}
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-200"
              style={{ width: `${hasSteps ? ((cursor + 1) / steps.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* değişkenler + çıktı */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-muted">{t.runner.variables}</div>
          {varEntries.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {varEntries.map(([name, value]) => (
                <li key={name} className="flex items-center justify-between gap-3 rounded-xl bg-brand-soft px-3 py-1.5">
                  <span className="font-mono text-sm font-black text-brand">{name}</span>
                  <span className="min-w-0 truncate font-mono text-sm font-black text-ink">{stringifyValue(value, language)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-muted">{t.runner.noVars}</p>
          )}
        </div>

        <div className="rounded-[1.25rem] border-2 p-4" style={{ background: "var(--code-bg)", borderColor: "var(--code-line)" }}>
          <div className="mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/45">{t.runner.output}</div>
          {current && current.output.length > 0 ? (
            <div className="space-y-0.5 font-mono text-sm font-bold text-[#7dffb0]">
              {current.output.map((line, i) => (
                <div key={i}>
                  <span className="mr-2 text-white/30">&gt;</span>
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-sm font-bold text-white/35">{t.runner.noOutput}</p>
          )}
        </div>
      </div>
    </div>
  );
}
