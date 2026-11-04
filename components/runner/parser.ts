import { tokenize, type Token } from "./tokenizer";
import { MESSAGES, shown, type Lang } from "./lang";
import type { BinaryOp, Expr, Program, Stmt } from "./ast";

class ParseError extends Error {}

export function parse(source: string, lang: Lang = "tr"): Program {
  const tokens = tokenize(source, lang);
  const msg = MESSAGES[lang];
  let pos = 0;

  function peek(offset = 0): Token {
    return tokens[Math.min(pos + offset, tokens.length - 1)];
  }

  function currentLine(): number {
    return peek().line;
  }

  function advance(): Token {
    const t = tokens[pos];
    if (pos < tokens.length - 1) pos++;
    return t;
  }

  function skipNewlines() {
    while (peek().type === "NEWLINE") advance();
  }

  function expect(type: Token["type"], value?: string): Token {
    const t = peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new ParseError(msg.expected(t.line + 1, shown(lang, t.value || t.type), shown(lang, value ?? type)));
    }
    return advance();
  }

  function isKeyword(value: string): boolean {
    return peek().type === "KEYWORD" && peek().value === value;
  }

  // ---- İfade ayrıştırma (precedence climbing) ----

  function parsePrimary(): Expr {
    const t = peek();

    if (t.type === "NUMBER") {
      advance();
      return { kind: "number", value: parseFloat(t.value) };
    }
    if (t.type === "STRING") {
      advance();
      return { kind: "string", value: t.value };
    }
    if (t.type === "KEYWORD" && t.value === "DOĞRU") {
      advance();
      return { kind: "bool", value: true };
    }
    if (t.type === "KEYWORD" && t.value === "YANLIŞ") {
      advance();
      return { kind: "bool", value: false };
    }
    if (t.type === "LPAREN") {
      advance();
      const e = parseExpr();
      expect("RPAREN");
      return e;
    }
    if (t.type === "LBRACKET") {
      advance();
      const items: Expr[] = [];
      if (peek().type !== "RBRACKET") {
        items.push(parseExpr());
        while (peek().type === "COMMA") {
          advance();
          items.push(parseExpr());
        }
      }
      expect("RBRACKET");
      return { kind: "arrayLiteral", items };
    }
    if (t.type === "IDENT") {
      advance();
      if (peek().type === "LPAREN") {
        advance();
        const args: Expr[] = [];
        if (peek().type !== "RPAREN") {
          args.push(parseExpr());
          while (peek().type === "COMMA") {
            advance();
            args.push(parseExpr());
          }
        }
        expect("RPAREN");
        return { kind: "call", name: t.value, args };
      }
      return { kind: "ident", name: t.value };
    }

    throw new ParseError(msg.invalidExpr(t.line + 1, shown(lang, t.value || t.type)));
  }

  function parsePostfix(): Expr {
    let expr = parsePrimary();
    while (peek().type === "LBRACKET") {
      advance();
      const index = parseExpr();
      expect("RBRACKET");
      expr = { kind: "arrayAccess", array: expr, index };
    }
    return expr;
  }

  function parseUnary(): Expr {
    const t = peek();
    if (t.type === "OP" && t.value === "-") {
      advance();
      return { kind: "unary", op: "-", expr: parseUnary() };
    }
    if (t.type === "KEYWORD" && t.value === "DEĞİL") {
      advance();
      return { kind: "unary", op: "DEĞİL", expr: parseUnary() };
    }
    return parsePostfix();
  }

  function parseMul(): Expr {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      let op: BinaryOp | null = null;
      if (t.type === "OP" && (t.value === "*" || t.value === "/")) op = t.value as BinaryOp;
      else if (t.type === "KEYWORD" && t.value === "DİV") op = "div";
      else if (t.type === "KEYWORD" && t.value === "MOD") op = "mod";
      if (!op) break;
      advance();
      left = { kind: "binary", op, left, right: parseUnary() };
    }
    return left;
  }

  function parseAdd(): Expr {
    let left = parseMul();
    for (;;) {
      const t = peek();
      if (t.type === "OP" && (t.value === "+" || t.value === "-")) {
        advance();
        left = { kind: "binary", op: t.value as BinaryOp, left, right: parseMul() };
      } else break;
    }
    return left;
  }

  const COMPARISON_OPS = new Set(["=", "≠", "<", ">", "≤", "≥"]);

  function parseComparison(): Expr {
    const left = parseAdd();
    const t = peek();
    if (t.type === "OP" && COMPARISON_OPS.has(t.value)) {
      advance();
      const right = parseAdd();
      return { kind: "binary", op: t.value as BinaryOp, left, right };
    }
    return left;
  }

  function parseAnd(): Expr {
    let left = parseComparison();
    while (isKeyword("VE")) {
      advance();
      left = { kind: "binary", op: "VE", left, right: parseComparison() };
    }
    return left;
  }

  function parseOr(): Expr {
    let left = parseAnd();
    while (isKeyword("VEYA")) {
      advance();
      left = { kind: "binary", op: "VEYA", left, right: parseAnd() };
    }
    return left;
  }

  function parseExpr(): Expr {
    return parseOr();
  }

  // ---- Deyim (statement) ayrıştırma ----

  function parseBlock(terminators: string[]): Stmt[] {
    const stmts: Stmt[] = [];
    skipNewlines();
    while (
      peek().type !== "EOF" &&
      !(peek().type === "KEYWORD" && terminators.includes(peek().value))
    ) {
      stmts.push(parseStatement());
      skipNewlines();
    }
    return stmts;
  }

  function parseIf(): Stmt {
    const line = currentLine();
    expect("KEYWORD", "EĞER");
    const cond = parseExpr();
    skipNewlines();
    const thenBody = parseBlock(["DEĞİLSE", "BİTİR"]);
    let elseBody: Stmt[] = [];
    if (isKeyword("DEĞİLSE")) {
      advance();
      skipNewlines();
      elseBody = parseBlock(["BİTİR"]);
    }
    expect("KEYWORD", "BİTİR");
    return { kind: "if", line, cond, thenBody, elseBody };
  }

  function parseFor(): Stmt {
    const line = currentLine();
    expect("KEYWORD", "İÇİN");
    const varName = expect("IDENT").value;
    expect("OP", "←");
    const from = parseExpr();
    expect("KEYWORD", "DEN"); // İngilizcede bu token "TO"dur (bkz. lang.ts)
    const to = parseExpr();
    // Türkçe: İÇİN i ← 1'DEN 5'E ADIM 1 ("5'E" eki ayrı token olur). İngilizce: FOR i ← 1 TO 5 STEP 1, ek yok.
    if (lang === "tr") expect("KEYWORD", "E");
    expect("KEYWORD", "ADIM");
    const step = parseExpr();
    skipNewlines();
    const body = parseBlock(["DÖNGÜ_BİTİR"]);
    expect("KEYWORD", "DÖNGÜ_BİTİR");
    return { kind: "for", line, varName, from, to, step, body };
  }

  function parseWhile(): Stmt {
    const line = currentLine();
    expect("KEYWORD", "SÜRECE");
    const cond = parseExpr();
    skipNewlines();
    const body = parseBlock(["DÖNGÜ_BİTİR"]);
    expect("KEYWORD", "DÖNGÜ_BİTİR");
    return { kind: "while", line, cond, body };
  }

  function parseFuncDecl(): Stmt {
    const line = currentLine();
    expect("KEYWORD", "FONKSİYON");
    const name = expect("IDENT").value;
    expect("LPAREN");
    const params: string[] = [];
    if (peek().type !== "RPAREN") {
      params.push(expect("IDENT").value);
      while (peek().type === "COMMA") {
        advance();
        params.push(expect("IDENT").value);
      }
    }
    expect("RPAREN");
    skipNewlines();
    const body = parseBlock(["BİTİR"]);
    expect("KEYWORD", "BİTİR");
    return { kind: "funcDecl", line, name, params, body };
  }

  function parseReturn(): Stmt {
    const line = currentLine();
    expect("KEYWORD", "DÖNDÜR");
    const expr = parseExpr();
    return { kind: "return", line, expr };
  }

  function parseStatement(): Stmt {
    const t = peek();

    if (t.type === "KEYWORD" && t.value === "OKU") {
      const line = currentLine();
      advance();
      const name = expect("IDENT").value;
      return { kind: "read", line, name };
    }

    if (t.type === "KEYWORD" && t.value === "YAZ") {
      const line = currentLine();
      advance();
      const expr = parseExpr();
      return { kind: "print", line, expr };
    }

    if (t.type === "KEYWORD" && t.value === "SABIT") {
      const line = currentLine();
      advance();
      const name = expect("IDENT").value;
      expect("OP", "←");
      const expr = parseExpr();
      return { kind: "assign", line, target: { kind: "ident", name }, expr, isConst: true };
    }

    if (t.type === "KEYWORD" && t.value === "EĞER") return parseIf();
    if (t.type === "KEYWORD" && t.value === "İÇİN") return parseFor();
    if (t.type === "KEYWORD" && t.value === "SÜRECE") return parseWhile();
    if (t.type === "KEYWORD" && t.value === "FONKSİYON") return parseFuncDecl();
    if (t.type === "KEYWORD" && t.value === "DÖNDÜR") return parseReturn();

    if (t.type === "IDENT") {
      const line = currentLine();
      let target: Expr = { kind: "ident", name: t.value };
      advance();
      while (peek().type === "LBRACKET") {
        advance();
        const index = parseExpr();
        expect("RBRACKET");
        target = { kind: "arrayAccess", array: target, index };
      }
      expect("OP", "←");
      const expr = parseExpr();
      return { kind: "assign", line, target, expr };
    }

    throw new ParseError(msg.unexpected(t.line + 1, shown(lang, t.value || t.type)));
  }

  function parseProgram(): Program {
    const stmts: Stmt[] = [];
    skipNewlines();
    while (peek().type !== "EOF") {
      stmts.push(parseStatement());
      skipNewlines();
    }
    return stmts;
  }

  return parseProgram();
}
