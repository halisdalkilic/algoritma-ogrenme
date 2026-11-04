/**
 * Türkçe sözde kod için AST (soyut sözdizim ağacı) tipleri.
 * Desteklenen komutlar: OKU, YAZ, ← (atama), EĞER/DEĞİLSE/BİTİR,
 * İÇİN...DÖNGÜ_BİTİR, SÜRECE...DÖNGÜ_BİTİR, dizi indeksleme,
 * FONKSİYON(...)...DÖNDÜR...BİTİR.
 */

export type Value = number | string | boolean | Value[] | undefined;

// ---- İfadeler (expression) ----

export type Expr =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "ident"; name: string }
  | { kind: "arrayAccess"; array: Expr; index: Expr }
  | { kind: "arrayLiteral"; items: Expr[] }
  | { kind: "unary"; op: "-" | "DEĞİL"; expr: Expr }
  | { kind: "binary"; op: BinaryOp; left: Expr; right: Expr }
  | { kind: "call"; name: string; args: Expr[] };

export type BinaryOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "div"
  | "mod"
  | "="
  | "≠"
  | "<"
  | ">"
  | "≤"
  | "≥"
  | "VE"
  | "VEYA";

// ---- Deyimler (statement) ----

export type Stmt =
  | { kind: "assign"; line: number; target: Expr; expr: Expr; isConst?: boolean }
  | { kind: "read"; line: number; name: string }
  | { kind: "print"; line: number; expr: Expr }
  | { kind: "if"; line: number; cond: Expr; thenBody: Stmt[]; elseBody: Stmt[] }
  | {
      kind: "for";
      line: number;
      varName: string;
      from: Expr;
      to: Expr;
      step: Expr;
      body: Stmt[];
    }
  | { kind: "while"; line: number; cond: Expr; body: Stmt[] }
  | { kind: "funcDecl"; line: number; name: string; params: string[]; body: Stmt[] }
  | { kind: "return"; line: number; expr: Expr };

export type Program = Stmt[];
