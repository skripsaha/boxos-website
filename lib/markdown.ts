/**
 * Tiny, deliberately small markdown-to-HTML renderer.
 * Supports: headings, paragraphs, lists, code blocks (``` fenced), inline code,
 * bold, italics, links, blockquotes, horizontal rules.
 * Escapes HTML in user-supplied source.
 */

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isSafeImageUrl(u: string): boolean {
  return /^https?:\/\//.test(u) || u.startsWith("/") || /^data:image\/(png|jpe?g|gif|webp);base64,/.test(u);
}

function renderInline(s: string): string {
  /* image markdown is processed *before* HTML escaping so the data URL passes through intact */
  const placeholders: string[] = [];
  let pre = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, u) => {
    const safe = isSafeImageUrl(u) ? u : "";
    if (!safe) return "";
    const altEsc = String(alt).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    const html = `<img src="${safe}" alt="${altEsc}" loading="lazy" style="max-width:100%; height:auto; border-radius:8px; border:1px solid var(--color-line-2); margin: 0.6em 0;"/>`;
    placeholders.push(html);
    return `IMG${placeholders.length - 1}`;
  });

  let out = esc(pre);
  out = out.replace(/IMG(\d+)/g, (_m, idx) => placeholders[Number(idx)]);

  out = out.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, u) => {
    const safe = /^https?:\/\/|^\//.test(u) ? u : "#";
    return `<a href="${safe}" rel="noreferrer">${t}</a>`;
  });
  return out;
}

export function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  const flushPara = (buf: string[]) => {
    if (buf.length) {
      out.push(`<p>${renderInline(buf.join(" "))}</p>`);
      buf.length = 0;
    }
  };

  let para: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      flushPara(para);
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      out.push(`<pre><code data-lang="${esc(lang)}">${esc(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara(para);
      const lvl = Math.min(6, h[1].length);
      out.push(`<h${lvl}>${renderInline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushPara(para);
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${renderInline(buf.join(" "))}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushPara(para);
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushPara(para);
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushPara(para);
      out.push("<hr/>");
      i++;
      continue;
    }

    if (line.trim() === "") {
      flushPara(para);
      i++;
      continue;
    }

    para.push(line);
    i++;
  }

  flushPara(para);
  return out.join("\n");
}

export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function timeAgo(unix: number): string {
  const diff = Math.floor(Date.now() / 1000) - unix;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 365) return `${Math.floor(diff / 86400 / 30)}mo ago`;
  return `${Math.floor(diff / 86400 / 365)}y ago`;
}

export function formatDate(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
