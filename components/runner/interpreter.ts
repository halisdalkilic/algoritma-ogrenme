import { parse } from "./parser";
import { MESSAGES, type Lang } from "./lang";
import type { Expr, Program, Stmt, Value } from "./ast";

export class RuntimeError extends Error {}

/** DÖNDÜR ifadesinin, iç içe İÇİN/EĞER bloklarından fonksiyon çağrısı
 * sınırına kadar akışı kesmesini sağlayan dahili kontrol sinyali. Gerçek bir
 * hata değildir; sadece çağıran evalExpr("call") tarafından yakalanır. */
class ReturnSignal {
  constructor(public value: Value) {}
}

export type RunnerStep = {
  line: number;
  vars: Record<string, Value>;
  output: string[];
};

export type RunResult =
  | { ok: true; steps: RunnerStep[] }
  | { ok: false; steps: RunnerStep[]; error: string };

const MAX_STEPS = 5000;

export function stringifyValue(value: Value, lang: Lang = "tr"): string {
  const msg = MESSAGES[lang];
  if (value === undefined) return msg.undefinedValue;
  if (typeof value === "boolean") return value ? msg.trueText : msg.falseText;
  if (Array.isArray(value)) return "[" + value.map((v) => stringifyValue(v, lang)).join(", ") + "]";
  return String(value);
}

type FuncDef = { params: string[]; body: Stmt[] };

/**
 * Türkçe sözde kodu satır satır çalıştırır ve her önemli adımda
 * ({line, vars, output}) bir anlık görüntü (snapshot) üretir.
 * OKU komutları `inputs` dizisinden sırayla değer alır (canlı kullanıcı
 * girdisi yerine — StepRunner UI'ı programı önceden tam olarak çalıştırıp
 * adımlar arasında ileri/geri gezinmeyi mümkün kılar).
 *
 * Kapsam (scope): tek seviyeli bir "yığın" ile modellenir — scopes[0] her
 * zaman global kapsamdır, bir fonksiyon çağrısı üstüne YENİ bir kapsam
 * ekler. Okuma dıştan içe (global → yerel) arar; YAZMA HER ZAMAN en içteki
 * kapsama yapılır — bu, bir fonksiyonun aynı isimli bir global değişkeni
 * "gölgeleyebileceğini" (onu değiştirmeden kendi yerel kopyasını
 * oluşturabileceğini) öğretir (bkz. ders 5.7 Değişken Kapsamı).
 */
export function run(source: string, inputs: Value[] = [], opts: { lang?: Lang } = {}): RunResult {
  const lang: Lang = opts.lang ?? "tr";
  const msg = MESSAGES[lang];
  const str = (v: Value) => stringifyValue(v, lang);
  const steps: RunnerStep[] = [];
  const scopes: Map<string, Value>[] = [new Map()];
  const constNames = new Set<string>();
  const functions = new Map<string, FuncDef>();
  const output: string[] = [];
  let inputIndex = 0;
  let stepCount = 0;

  function hasVar(name: string): boolean {
    return scopes.some((s) => s.has(name));
  }

  function lookupVar(name: string): Value {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i].has(name)) return scopes[i].get(name);
    }
    return undefined;
  }

  function setVarLocal(name: string, value: Value) {
    scopes[scopes.length - 1].set(name, value);
  }

  function snapshotVars(): Record<string, Value> {
    const merged: Record<string, Value> = {};
    for (const scope of scopes) {
      for (const [k, v] of scope.entries()) merged[k] = v;
    }
    return merged;
  }

  function pushStep(line: number) {
    stepCount++;
    if (stepCount > MAX_STEPS) {
      throw new RuntimeError(msg.stepLimit(MAX_STEPS));
    }
    steps.push({ line, vars: snapshotVars(), output: [...output] });
  }

  function toNumber(v: Value, line: number): number {
    if (typeof v === "number") return v;
    throw new RuntimeError(msg.expectedNumber(line + 1, str(v)));
  }

  function toBool(v: Value, line: number): boolean {
    if (typeof v === "boolean") return v;
    throw new RuntimeError(msg.expectedBool(line + 1, str(v)));
  }

  function evalExpr(expr: Expr, line: number): Value {
    switch (expr.kind) {
      case "number":
        return expr.value;
      case "string":
        return expr.value;
      case "bool":
        return expr.value;
      case "ident": {
        if (!hasVar(expr.name)) {
          throw new RuntimeError(msg.undefinedVar(line + 1, expr.name));
        }
        return lookupVar(expr.name);
      }
      case "arrayLiteral":
        return expr.items.map((item) => evalExpr(item, line));
      case "arrayAccess": {
        const arr = evalExpr(expr.array, line);
        if (!Array.isArray(arr)) {
          throw new RuntimeError(msg.notArrayIndex(line + 1));
        }
        const idx = toNumber(evalExpr(expr.index, line), line);
        if (idx < 0 || idx >= arr.length || !Number.isInteger(idx)) {
          throw new RuntimeError(msg.indexOutOfRange(line + 1, idx));
        }
        return arr[idx];
      }
      case "unary": {
        if (expr.op === "-") return -toNumber(evalExpr(expr.expr, line), line);
        return !toBool(evalExpr(expr.expr, line), line);
      }
      case "call": {
        const fn = functions.get(expr.name);
        if (!fn) {
          throw new RuntimeError(msg.undefinedFunc(line + 1, expr.name));
        }
        if (fn.params.length !== expr.args.length) {
          throw new RuntimeError(msg.paramCount(line + 1, expr.name, fn.params.length, expr.args.length));
        }
        const argValues = expr.args.map((a) => evalExpr(a, line));
        const localScope = new Map<string, Value>();
        fn.params.forEach((p, i) => localScope.set(p, argValues[i]));

        scopes.push(localScope);
        let returnValue: Value;
        try {
          execStmts(fn.body);
          returnValue = undefined; // DÖNDÜR hiç çalışmadıysa
        } catch (signal) {
          if (signal instanceof ReturnSignal) returnValue = signal.value;
          else throw signal;
        } finally {
          scopes.pop();
        }
        return returnValue;
      }
      case "binary": {
        const { op } = expr;
        if (op === "VE") return toBool(evalExpr(expr.left, line), line) && toBool(evalExpr(expr.right, line), line);
        if (op === "VEYA") return toBool(evalExpr(expr.left, line), line) || toBool(evalExpr(expr.right, line), line);

        const l = evalExpr(expr.left, line);
        const r = evalExpr(expr.right, line);

        if (op === "+") {
          if (typeof l === "string" || typeof r === "string") {
            return str(l) + str(r);
          }
          return toNumber(l, line) + toNumber(r, line);
        }
        if (op === "=") return l === r;
        if (op === "≠") return l !== r;

        const ln = toNumber(l, line);
        const rn = toNumber(r, line);
        switch (op) {
          case "-":
            return ln - rn;
          case "*":
            return ln * rn;
          case "/":
            if (rn === 0) throw new RuntimeError(msg.divZero(line + 1));
            return ln / rn;
          case "div":
            if (rn === 0) throw new RuntimeError(msg.divZero(line + 1));
            return Math.trunc(ln / rn);
          case "mod":
            if (rn === 0) throw new RuntimeError(msg.divZero(line + 1));
            return ln - Math.trunc(ln / rn) * rn;
          case "<":
            return ln < rn;
          case ">":
            return ln > rn;
          case "≤":
            return ln <= rn;
          case "≥":
            return ln >= rn;
          default:
            throw new RuntimeError(msg.unknownOp(line + 1));
        }
      }
    }
  }

  function assignTo(target: Expr, value: Value, line: number) {
    if (target.kind === "ident") {
      if (constNames.has(target.name)) {
        throw new RuntimeError(msg.constChange(line + 1, target.name));
      }
      setVarLocal(target.name, value);
      return;
    }
    if (target.kind === "arrayAccess") {
      const arr = evalExpr(target.array, line);
      if (!Array.isArray(arr)) {
        throw new RuntimeError(msg.notArrayAssign(line + 1));
      }
      const idx = toNumber(evalExpr(target.index, line), line);
      if (idx < 0 || idx >= arr.length || !Number.isInteger(idx)) {
        throw new RuntimeError(msg.indexOutOfRange(line + 1, idx));
      }
      arr[idx] = value;
      return;
    }
    throw new RuntimeError(msg.cannotAssign(line + 1));
  }

  function execStmts(stmts: Stmt[]) {
    for (const stmt of stmts) execStmt(stmt);
  }

  function execStmt(stmt: Stmt) {
    switch (stmt.kind) {
      case "assign": {
        const value = evalExpr(stmt.expr, stmt.line);
        const constName = stmt.isConst ? (stmt.target as { name: string }).name : undefined;
        if (constName !== undefined && constNames.has(constName)) {
          throw new RuntimeError(msg.constExists(stmt.line + 1, constName));
        }
        // SABIT'i assignTo'dan ÖNCE constNames'e eklersek, assignTo'nun kendi
        // "sabite yeniden atama" kontrolü ilk tanımlamayı da hatalı reddeder.
        // Bu yüzden önce ata, sabitliği sonra işaretle.
        assignTo(stmt.target, value, stmt.line);
        if (constName !== undefined) constNames.add(constName);
        pushStep(stmt.line);
        return;
      }
      case "read": {
        const value = inputIndex < inputs.length ? inputs[inputIndex++] : undefined;
        setVarLocal(stmt.name, value);
        pushStep(stmt.line);
        return;
      }
      case "print": {
        const value = evalExpr(stmt.expr, stmt.line);
        output.push(str(value));
        pushStep(stmt.line);
        return;
      }
      case "if": {
        const cond = toBool(evalExpr(stmt.cond, stmt.line), stmt.line);
        pushStep(stmt.line);
        execStmts(cond ? stmt.thenBody : stmt.elseBody);
        return;
      }
      case "for": {
        const from = toNumber(evalExpr(stmt.from, stmt.line), stmt.line);
        const to = toNumber(evalExpr(stmt.to, stmt.line), stmt.line);
        const step = toNumber(evalExpr(stmt.step, stmt.line), stmt.line);
        if (step === 0) throw new RuntimeError(msg.stepZero(stmt.line + 1));

        let i = from;
        while (step > 0 ? i <= to : i >= to) {
          setVarLocal(stmt.varName, i);
          pushStep(stmt.line);
          execStmts(stmt.body);
          i += step;
        }
        return;
      }
      case "while": {
        for (;;) {
          const cond = toBool(evalExpr(stmt.cond, stmt.line), stmt.line);
          pushStep(stmt.line);
          if (!cond) break;
          execStmts(stmt.body);
        }
        return;
      }
      case "funcDecl": {
        functions.set(stmt.name, { params: stmt.params, body: stmt.body });
        pushStep(stmt.line);
        return;
      }
      case "return": {
        const value = evalExpr(stmt.expr, stmt.line);
        pushStep(stmt.line);
        throw new ReturnSignal(value);
      }
    }
  }

  try {
    const program: Program = parse(source, lang);
    execStmts(program);
    return { ok: true, steps };
  } catch (err) {
    if (err instanceof ReturnSignal) {
      return { ok: false, steps, error: msg.returnOutside };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, steps, error: message };
  }
}
