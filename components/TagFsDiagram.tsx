import * as React from "react";

/**
 * Side-by-side: POSIX directory tree vs TagFS tag-indexed model.
 * Numbers and component names taken from src/kernel/tagfs/tagfs.h.
 */
export function TagFsDiagram() {
  return (
    <figure className="not-prose my-10">
      <div className="grid md:grid-cols-2 gap-px bg-[color:var(--color-line)] border hairline rounded-[14px] overflow-hidden">
        <div className="bg-[color:var(--color-paper)] p-7 md:p-9 flex flex-col">
          <p className="text-[11px] tabular font-mono uppercase tracking-[0.16em] text-[color:var(--color-ink-3)]">POSIX</p>
          <h3 className="mt-2 text-[20px] font-medium tracking-tight">A tree.</h3>
          <p className="mt-3 text-[13.5px] text-[color:var(--color-ink-2)] max-w-[36ch]">
            One path per file. Renaming or moving rewrites the link.
          </p>
          <div className="mt-7 flex-1 flex items-center">
            <PosixSvg />
          </div>
        </div>
        <div className="bg-[color:var(--color-paper)] p-7 md:p-9 flex flex-col">
          <p className="text-[11px] tabular font-mono uppercase tracking-[0.16em] text-[color:var(--color-brand-deep)]">TagFS</p>
          <h3 className="mt-2 text-[20px] font-medium tracking-tight">A registry.</h3>
          <p className="mt-3 text-[13.5px] text-[color:var(--color-ink-2)] max-w-[36ch]">
            File entry · tag IDs · 4 KB blocks. Dedup by content hash.
          </p>
          <div className="mt-7 flex-1 flex items-center">
            <TagFsSvg />
          </div>
        </div>
      </div>
    </figure>
  );
}

/* ─────────────────────────────────────────────────────
   POSIX — clean nested tree, fixed viewBox 360×260
   ───────────────────────────────────────────────────── */
function PosixSvg() {
  return (
    <svg viewBox="0 0 360 260" width="100%" height="auto" role="img" aria-label="POSIX directory tree" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="folder-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#D9A26B" />
          <stop offset="100%" stopColor="#B8814B" />
        </linearGradient>
        <linearGradient id="folder-tab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#9D6B3A" />
          <stop offset="100%" stopColor="#6B4220" />
        </linearGradient>
      </defs>

      {/* connector lines drawn first */}
      <g fill="none" stroke="#B5B1A4" strokeWidth="1.2">
        <path d="M180 38 V58 H 60 V80" />
        <path d="M 60 124 V158" />
        <path d="M 60 200 V222 H140" />
        <path d="M180 38 V58 H300 V80" />
      </g>

      {/* root */}
      <Folder x={156} y={6} label="/" />

      {/* /home */}
      <Folder x={36}  y={80}  label="home" />
      {/* /home/sasha */}
      <Folder x={36}  y={158} label="sasha" />
      {/* file at the leaf */}
      <Doc    x={116} y={222} label="report.txt" />

      {/* /etc — sibling */}
      <Folder x={276} y={80}  label="etc" muted />
    </svg>
  );
}

function Folder({ x, y, label, muted = false }: { x: number; y: number; label: string; muted?: boolean }) {
  const W = 48, H = 32;
  const op = muted ? 0.55 : 1;
  return (
    <g opacity={op}>
      {/* tab */}
      <rect x={x} y={y} width={W * 0.45} height="8" rx="2" fill="url(#folder-tab)" />
      {/* body */}
      <rect x={x} y={y + 6} width={W} height={H - 6} rx="3" fill="url(#folder-body)" stroke="#6B4220" strokeWidth="0.6" />
      <text x={x + W / 2} y={y + H + 14} textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="11" fill="#0E0D0B">
        {label}
      </text>
    </g>
  );
}

function Doc({ x, y, label }: { x: number; y: number; label: string }) {
  const W = 48, H = 32;
  return (
    <g>
      <path
        d={`M${x + 4} ${y} H${x + W - 12} L${x + W - 4} ${y + 8} V${y + H - 4} A4 4 0 0 1 ${x + W - 8} ${y + H} H${x + 4} A4 4 0 0 1 ${x} ${y + H - 4} V${y + 4} A4 4 0 0 1 ${x + 4} ${y} Z`}
        fill="#FBFAF6"
        stroke="#9D6B3A"
        strokeWidth="1.4"
      />
      <path d={`M${x + W - 12} ${y} V${y + 8} H${x + W - 4}`} fill="none" stroke="#9D6B3A" strokeWidth="1.4" />
      <line x1={x + 8}  y1={y + 16} x2={x + W - 8} y2={y + 16} stroke="#B5B1A4" strokeWidth="1.2" />
      <line x1={x + 8}  y1={y + 22} x2={x + W - 8} y2={y + 22} stroke="#B5B1A4" strokeWidth="1.2" />
      <line x1={x + 8}  y1={y + 28} x2={x + W - 16} y2={y + 28} stroke="#B5B1A4" strokeWidth="1.2" />
      <text x={x + W / 2} y={y + H + 14} textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="11" fill="#0E0D0B">
        {label}
      </text>
    </g>
  );
}

/* ─────────────────────────────────────────────────────
   TagFS — file entry → tag IDs → tag registry buckets
   Numbers from src/kernel/tagfs/tagfs.h:
     TAGFS_BLOCK_SIZE   4096
     TAGFS_REG_BUCKETS  512
   ───────────────────────────────────────────────────── */
function TagFsSvg() {
  return (
    <svg viewBox="0 0 360 260" width="100%" height="auto" role="img" aria-label="TagFS file table and tag registry" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="file-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#FBFAF6" />
          <stop offset="100%" stopColor="#F0EBDF" />
        </linearGradient>
        <linearGradient id="reg-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#EADBC2" />
          <stop offset="100%" stopColor="#C9A077" />
        </linearGradient>
      </defs>

      {/* file table entry — left side */}
      <g>
        <rect x="14" y="36" width="148" height="188" rx="8" fill="url(#file-body)" stroke="#B8814B" strokeWidth="1.4" />
        <text x="88" y="20" textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="10" fill="#6B4220" letterSpacing="0.6">
          FILE TABLE ENTRY
        </text>
        <FileField y={56}  k="file_id"     v="0x041a" />
        <FileField y={80}  k="hash"        v="7f3a..bd29" mono />
        <FileField y={104} k="size"        v="48 KB" />
        <FileField y={128} k="blocks"      v="12 × 4 KB" />
        <FileField y={152} k="tag_ids[]"   v="[0x07, 0x12, 0x21]" mono />
        <FileField y={176} k="flags"       v="ACTIVE | COW" />
        <FileField y={200} k="snapshot"    v="ref_count=2" />
      </g>

      {/* connectors — file → registry buckets */}
      <g fill="none" stroke="#B8814B" strokeDasharray="3 3" strokeWidth="1.3" opacity="0.85">
        <path d="M162 152 C 200 152, 220 70, 250 70" />
        <path d="M162 156 C 200 156, 218 130, 250 130" />
        <path d="M162 160 C 198 160, 220 188, 250 188" />
      </g>

      {/* tag registry — right side */}
      <g>
        <rect x="250" y="36" width="100" height="188" rx="8" fill="url(#reg-body)" stroke="#6B4220" strokeWidth="1.4" />
        <text x="300" y="20" textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="10" fill="#6B4220" letterSpacing="0.6">
          TAG REGISTRY · 512
        </text>
        <Bucket y="58"  id="0x07" name="kernel" />
        <Bucket y="118" id="0x12" name="draft"  />
        <Bucket y="178" id="0x21" name="2026"   />
      </g>

      {/* dedup hint at bottom */}
      <text x="180" y="252" textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="9.5" fill="#8C887C" letterSpacing="0.4">
        same hash → same blocks · dedup
      </text>
    </svg>
  );
}

function FileField({ y, k, v, mono = false }: { y: number; k: string; v: string; mono?: boolean }) {
  return (
    <g>
      <text x="26" y={y} fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="10" fill="#8C887C">
        {k}
      </text>
      <text x="150" y={y} textAnchor="end" fontFamily={mono ? "JetBrains Mono, ui-monospace, monospace" : "Mona Sans, ui-sans-serif, sans-serif"} fontSize="11" fill="#0E0D0B">
        {v}
      </text>
    </g>
  );
}

function Bucket({ y, id, name }: { y: string; id: string; name: string }) {
  return (
    <g>
      <rect x="262" y={y} width="76" height="46" rx="6" fill="#FBFAF6" stroke="#6B4220" strokeWidth="1" />
      <text x="300" y={String(Number(y) + 18)} textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="10" fill="#6B4220">
        {id}
      </text>
      <text x="300" y={String(Number(y) + 35)} textAnchor="middle" fontFamily="Mona Sans, ui-sans-serif, sans-serif" fontSize="11" fontWeight="500" fill="#0E0D0B">
        {name}
      </text>
    </g>
  );
}
