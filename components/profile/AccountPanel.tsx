"use client";

import { useState } from "react";
import { accountsEnabled } from "@/lib/account/supabase";
import { deleteAccount, sendPasswordReset, signIn, signOut, signUp, updatePassword, type AuthResult } from "@/lib/account/auth";
import { syncNow } from "@/lib/account/sync";
import { useAccountStore, type SyncIssue } from "@/lib/account/useAccountStore";
import { useHref, useLocale, useT } from "@/lib/i18n/context";

type Mode = "giris" | "kayit" | "sifre";

function Message({ result }: { result: AuthResult | null }) {
  const a = useT().account;
  if (!result) return null;
  const text = result.ok ? (result.info ? a.infos[result.info] : undefined) : a.errors[result.error];
  if (!text) return null;
  return (
    <p role="status" className="mt-3 text-sm font-bold" style={{ color: result.ok ? "var(--good-ink)" : "var(--bad-ink)" }}>
      {text}
    </p>
  );
}

function SignedOutForm() {
  const a = useT().account;
  const href = useHref();
  const [mode, setMode] = useState<Mode>("giris");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    const trimmed = email.trim();
    const res = mode === "giris" ? await signIn(trimmed, password) : mode === "kayit" ? await signUp(trimmed, password, href({ name: "profile" })) : await sendPasswordReset(trimmed, href({ name: "profile" }));
    setBusy(false);
    setResult(res);
    if (res.ok) setPassword("");
  }

  const tabs: [Mode, string][] = [["giris", a.signIn], ["kayit", a.signUp]];

  return (
    <>
      <p className="mt-1 text-sm font-semibold text-muted">
        {a.intro}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2" role="tablist" aria-label={a.modeAria}>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setResult(null);
            }}
            className={mode === id ? "btn" : "btn btn-ghost"}
          >
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-black">
          {a.email}
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint={mode === "sifre" ? "send" : "next"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field text-base"
          />
        </label>
        {mode !== "sifre" && (
          <label className="flex flex-col gap-1.5 text-sm font-black">
            {a.password}
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "kayit" ? "new-password" : "current-password"}
              enterKeyHint="go"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field text-base"
            />
            {mode === "kayit" && <span className="text-xs font-semibold text-muted">{a.passwordHint}</span>}
          </label>
        )}
        <button type="submit" disabled={busy} className="btn btn-block">
          {busy ? a.busy : mode === "giris" ? a.signIn : mode === "kayit" ? a.createAccount : a.sendReset}
        </button>
      </form>
      {mode === "giris" && (
        <button
          type="button"
          onClick={() => {
            setMode("sifre");
            setResult(null);
          }}
          className="mt-1 inline-flex min-h-11 items-center text-sm font-black text-brand underline-offset-4 hover:underline"
        >
          {a.forgot}
        </button>
      )}
      {mode === "sifre" && (
        <button
          type="button"
          onClick={() => {
            setMode("giris");
            setResult(null);
          }}
          className="mt-1 inline-flex min-h-11 items-center text-sm font-black text-brand underline-offset-4 hover:underline"
        >
          {a.backToSignIn}
        </button>
      )}
      <Message result={result} />
    </>
  );
}

function RecoveryForm() {
  const a = useT().account;
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(await updatePassword(password));
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-muted">{a.recoveryIntro}</p>
      <label className="flex flex-col gap-1.5 text-sm font-black">
        {a.newPassword}
        <input type="password" required minLength={8} autoComplete="new-password" enterKeyHint="go" value={password} onChange={(e) => setPassword(e.target.value)} className="field text-base" />
      </label>
      <button type="submit" disabled={busy} className="btn btn-block">
        {busy ? a.busy : a.updatePassword}
      </button>
      <Message result={result} />
    </form>
  );
}

function SignedInView({ email, onNotice }: { email: string; onNotice: (r: AuthResult) => void }) {
  const a = useT().account;
  const locale = useLocale();
  const sync = useAccountStore((s) => s.sync);
  const syncMessage = useAccountStore((s) => s.syncMessage);
  const lastSyncedAt = useAccountStore((s) => s.lastSyncedAt);
  const [busy, setBusy] = useState(false);

  const time = (at: number) => new Date(at).toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-US", { hour: "2-digit", minute: "2-digit" });
  const label =
    sync === "syncing" ? a.syncing : sync === "error" ? a.syncFailed : sync === "synced" && lastSyncedAt ? a.synced(time(lastSyncedAt)) : a.waiting;
  const issueText = (issue: SyncIssue) => (issue.kind === "invalid" ? a.issues.invalid(issue.detail) : a.issues[issue.kind]);

  async function remove() {
    if (!confirm(a.confirmDelete)) return;
    setBusy(true);
    onNotice(await deleteAccount());
    setBusy(false);
  }

  return (
    <>
      <p className="mt-1 break-all text-sm font-bold">{email}</p>
      <p className="mt-1 text-sm font-semibold text-muted" aria-live="polite">
        {label}
      </p>
      {syncMessage && (
        <p role="status" className="mt-2 text-sm font-bold" style={{ color: "var(--bad-ink)" }}>
          {issueText(syncMessage)}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void syncNow()} disabled={sync === "syncing"} className="btn btn-ghost">
          {a.syncNow}
        </button>
        <button type="button" onClick={() => void signOut()} className="btn btn-ghost">
          {a.signOut}
        </button>
      </div>
      <button type="button" onClick={remove} disabled={busy} className="mt-4 text-sm font-black underline-offset-4 hover:underline" style={{ color: "var(--bad-ink)" }}>
        {a.deleteAccount}
      </button>
    </>
  );
}

/** Profil sayfasındaki isteğe bağlı hesap kutusu. Hesap özelliği yapılandırılmamışsa hiç görünmez. */
export function AccountPanel() {
  const a = useT().account;
  const ready = useAccountStore((s) => s.ready);
  const email = useAccountStore((s) => s.email);
  const recovery = useAccountStore((s) => s.recovery);
  // Hesap silindiğinde panel giriş formuna döner; sonuç iletisi bu yüzden burada tutulur.
  const [notice, setNotice] = useState<AuthResult | null>(null);

  if (!accountsEnabled) return null;

  return (
    <section className="card p-5" aria-labelledby="hesap-baslik">
      <h2 id="hesap-baslik" className="text-lg font-black">
        {a.title}
      </h2>
      {!ready ? (
        <p className="mt-1 text-sm font-semibold text-muted">{a.loading}</p>
      ) : recovery && email ? (
        <RecoveryForm />
      ) : email ? (
        <SignedInView email={email} onNotice={setNotice} />
      ) : (
        <SignedOutForm />
      )}
      <Message result={notice} />
    </section>
  );
}
