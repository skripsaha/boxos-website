import * as React from "react";

/**
 * Lightweight C-syntax colorizer. Server-rendered, no JS deps.
 * Recognizes keywords, types, strings, numbers, comments, and function defs.
 */

const KEYWORDS = new Set([
  "if", "else", "while", "for", "do", "return", "break", "continue", "switch", "case",
  "default", "static", "inline", "extern", "const", "volatile", "typedef", "struct",
  "union", "enum", "void", "sizeof", "goto",
]);

const TYPES = new Set([
  "uint8_t", "uint16_t", "uint32_t", "uint64_t",
  "int8_t", "int16_t", "int32_t", "int64_t",
  "size_t", "bool", "char", "int", "long", "short", "unsigned", "signed",
  "PocketId", "CabinId", "Manifest", "Op", "Deck", "TagId", "ResultCode",
]);

type Tok = { t: string; c?: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    // line comment
    if (ch === "/" && src[i + 1] === "/") {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      out.push({ t: src.slice(i, j), c: "c-com" });
      i = j;
      continue;
    }
    // block comment
    if (ch === "/" && src[i + 1] === "*") {
      let j = i + 2;
      while (j < src.length && !(src[j] === "*" && src[j + 1] === "/")) j++;
      j = Math.min(src.length, j + 2);
      out.push({ t: src.slice(i, j), c: "c-com" });
      i = j;
      continue;
    }
    // preprocessor
    if (ch === "#" && (i === 0 || src[i - 1] === "\n")) {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      out.push({ t: src.slice(i, j), c: "c-key" });
      i = j;
      continue;
    }
    // string
    if (ch === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') {
        if (src[j] === "\\") j++;
        j++;
      }
      j = Math.min(src.length, j + 1);
      out.push({ t: src.slice(i, j), c: "c-str" });
      i = j;
      continue;
    }
    // char
    if (ch === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== "'") {
        if (src[j] === "\\") j++;
        j++;
      }
      j = Math.min(src.length, j + 1);
      out.push({ t: src.slice(i, j), c: "c-str" });
      i = j;
      continue;
    }
    // number
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9a-fA-FxX_]/.test(src[j])) j++;
      out.push({ t: src.slice(i, j), c: "c-num" });
      i = j;
      continue;
    }
    // identifier
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let cls: string | undefined;
      if (KEYWORDS.has(word)) cls = "c-key";
      else if (TYPES.has(word)) cls = "c-typ";
      else if (src[j] === "(") cls = "c-fn";
      out.push({ t: word, c: cls });
      i = j;
      continue;
    }
    // whitespace / punctuation
    let j = i;
    while (j < src.length && !/[A-Za-z_0-9"'#\/]/.test(src[j]) && src[j] !== "\n") j++;
    if (j === i) j = i + 1;
    out.push({ t: src.slice(i, j) });
    i = j;
  }
  return out;
}

export function CodeBlock({ children, language = "c", fileName }: {
  children: string;
  language?: "c" | "asm" | "shell" | "plain";
  fileName?: string;
}) {
  const tokens = language === "c" ? tokenize(children) : null;
  return (
    <figure className="not-prose">
      {fileName && (
        <div className="flex items-center justify-between text-[11px] tabular font-mono text-[color:var(--color-ink-3)] px-4 py-2 border border-b-0 hairline rounded-t-[10px] bg-[color:var(--color-paper-2)]">
          <span>{fileName}</span>
          <span className="uppercase tracking-[0.14em]">{language}</span>
        </div>
      )}
      <pre className={`codeblock ${fileName ? "rounded-t-none" : ""} m-0`}>
        <code>
          {tokens ? tokens.map((tk, idx) => tk.c ? <span key={idx} className={tk.c}>{tk.t}</span> : <React.Fragment key={idx}>{tk.t}</React.Fragment>) : children}
        </code>
      </pre>
    </figure>
  );
}
