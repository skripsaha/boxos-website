import * as React from "react";

/**
 * Side-by-side illustration: classic POSIX directory tree vs BoxOS TagFS
 * content-and-tags graph. Hand-drawn SVG, no external dependencies.
 */
export function TagFsDiagram() {
  return (
    <figure className="not-prose my-10">
      <div className="grid md:grid-cols-2 gap-px bg-[color:var(--color-line)] border hairline rounded-[14px] overflow-hidden">
        <div className="bg-[color:var(--color-paper)] p-7 md:p-9">
          <p className="text-[11px] tabular font-mono uppercase tracking-[0.16em] text-[color:var(--color-ink-3)]">POSIX</p>
          <h3 className="mt-2 text-[20px] font-medium tracking-tight">A tree.</h3>
          <p className="mt-3 text-[13.5px] text-[color:var(--color-ink-2)] max-w-[36ch]">
            One path. One place. Renaming or moving the file rewrites the link.
          </p>
          <div className="mt-7">
            <PosixTree />
          </div>
        </div>
        <div className="bg-[color:var(--color-paper)] p-7 md:p-9">
          <p className="text-[11px] tabular font-mono uppercase tracking-[0.16em] text-[color:var(--color-brand-deep)]">TagFS</p>
          <h3 className="mt-2 text-[20px] font-medium tracking-tight">A graph.</h3>
          <p className="mt-3 text-[13.5px] text-[color:var(--color-ink-2)] max-w-[36ch]">
            One blob. Many descriptions. Reachable through any subset of its tags.
          </p>
          <div className="mt-7">
            <TagFsGraph />
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-xs tabular font-mono text-[color:var(--color-ink-3)] text-center">
        Both diagrams describe the same JPEG.
      </figcaption>
    </figure>
  );
}

function PosixTree() {
  /* Hand-drawn tree, root → home → sasha → photos → 2024 → summer → IMG_001.jpg */
  return (
    <svg viewBox="0 0 360 320" width="100%" height="auto" role="img" aria-label="POSIX directory tree">
      <defs>
        <linearGradient id="folderG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D9A26B" />
          <stop offset="100%" stopColor="#B8814B" />
        </linearGradient>
        <linearGradient id="folderTab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9D6B3A" />
          <stop offset="100%" stopColor="#6B4220" />
        </linearGradient>
      </defs>

      {/* connectors — drawn first so folders sit on top */}
      <g stroke="#B5B1A4" strokeWidth="1" fill="none">
        <path d="M180 36 V60 H80 V92" />
        <path d="M80 132 V160 H80 V190" />
        <path d="M80 230 V258 H80 V288" />
        <path d="M180 36 V60 H280 V92" />
        <path d="M280 132 V160 H280 V190" />
        <path d="M280 230 V258 H280 V288" />
      </g>

      {/* root / */}
      <Folder x={156} y={6} label="/" />

      {/* /home */}
      <Folder x={56} y={92} label="home" />
      {/* /home/sasha */}
      <Folder x={56} y={190} label="sasha" />
      {/* /home/sasha/photos */}
      <Folder x={56} y={288} label="photos" muted />

      {/* /etc — example sibling */}
      <Folder x={256} y={92} label="etc" muted />
      <Folder x={256} y={190} label="2024" muted />
      <File x={256} y={288} label="IMG_001.jpg" />
    </svg>
  );
}

function Folder({ x, y, label, muted = false }: { x: number; y: number; label: string; muted?: boolean }) {
  /* folder icon, 48x32 */
  const fill = muted ? "url(#folderG)" : "url(#folderG)";
  const op = muted ? 0.55 : 1;
  return (
    <g opacity={op}>
      <path
        d={`M${x + 4} ${y + 4} h14 l4 4 h26 a3 3 0 0 1 3 3 v21 a3 3 0 0 1 -3 3 h-44 a3 3 0 0 1 -3 -3 V7 a3 3 0 0 1 3 -3 z`}
        fill="url(#folderTab)"
      />
      <rect x={x} y={y + 8} width="48" height="24" rx="3" fill={fill} />
      <text x={x + 24} y={y + 50} textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="11" fill="#0E0D0B">
        {label}
      </text>
    </g>
  );
}

function File({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <path
        d={`M${x + 6} ${y} h26 l10 10 v22 a2 2 0 0 1 -2 2 h-34 a2 2 0 0 1 -2 -2 V2 a2 2 0 0 1 2 -2 z`}
        fill="#FBFAF6"
        stroke="#9D6B3A"
        strokeWidth="1.5"
      />
      <path d={`M${x + 32} ${y} v8 a2 2 0 0 0 2 2 h8`} fill="none" stroke="#9D6B3A" strokeWidth="1.5" />
      <line x1={x + 8} y1={y + 18} x2={x + 38} y2={y + 18} stroke="#B5B1A4" strokeWidth="1" />
      <line x1={x + 8} y1={y + 24} x2={x + 38} y2={y + 24} stroke="#B5B1A4" strokeWidth="1" />
      <line x1={x + 8} y1={y + 30} x2={x + 30} y2={y + 30} stroke="#B5B1A4" strokeWidth="1" />
      <text x={x + 24} y={y + 50} textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="11" fill="#0E0D0B">
        {label}
      </text>
    </g>
  );
}

function TagFsGraph() {
  /* Center blob with content hash. Tags radiate out as orbital labels with curved connectors. */
  const cx = 180;
  const cy = 160;
  const r = 56;

  type Tag = { angleDeg: number; key: string; value: string; dist: number };
  const tags: Tag[] = [
    { angleDeg: -90, key: "kind",    value: "photo",  dist: 110 },
    { angleDeg: -30, key: "year",    value: "2024",   dist: 110 },
    { angleDeg:  30, key: "season",  value: "summer", dist: 110 },
    { angleDeg:  90, key: "subject", value: "family", dist: 110 },
    { angleDeg: 150, key: "owner",   value: "sasha",  dist: 110 },
    { angleDeg: 210, key: "device",  value: "ricoh",  dist: 110 },
  ];

  return (
    <svg viewBox="0 0 360 320" width="100%" height="auto" role="img" aria-label="TagFS content-and-tag graph">
      <defs>
        <radialGradient id="blobG" cx="0.4" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#EADBC2" />
          <stop offset="60%" stopColor="#B8814B" />
          <stop offset="100%" stopColor="#6B4220" />
        </radialGradient>
        <linearGradient id="tagPill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBFAF6" />
          <stop offset="100%" stopColor="#F5F2EA" />
        </linearGradient>
      </defs>

      {/* connectors (under everything) */}
      {tags.map((t, i) => {
        const rad = (t.angleDeg * Math.PI) / 180;
        const x = cx + Math.cos(rad) * t.dist;
        const y = cy + Math.sin(rad) * t.dist;
        return (
          <line
            key={i}
            x1={cx + Math.cos(rad) * r}
            y1={cy + Math.sin(rad) * r}
            x2={x}
            y2={y}
            stroke="#D9A26B"
            strokeWidth="1.4"
            strokeDasharray="3 4"
            opacity="0.7"
          />
        );
      })}

      {/* central content blob */}
      <circle cx={cx} cy={cy} r={r} fill="url(#blobG)" stroke="#6B4220" strokeWidth="1.4" />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontFamily="JetBrains Mono, ui-monospace, monospace"
        fontSize="11"
        fill="#FBFAF6"
        opacity="0.95"
        letterSpacing="0.5"
      >
        sha256
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontFamily="JetBrains Mono, ui-monospace, monospace"
        fontSize="13"
        fontWeight="600"
        fill="#FBFAF6"
      >
        7f3a..bd29
      </text>

      {/* tag pills */}
      {tags.map((t, i) => {
        const rad = (t.angleDeg * Math.PI) / 180;
        const x = cx + Math.cos(rad) * t.dist;
        const y = cy + Math.sin(rad) * t.dist;
        const text = `${t.key}=${t.value}`;
        const w = 8 + text.length * 6.6;
        return (
          <g key={i} transform={`translate(${x - w / 2} ${y - 12})`}>
            <rect width={w} height="22" rx="11" ry="11" fill="url(#tagPill)" stroke="#B8814B" strokeWidth="1" />
            <text
              x={w / 2}
              y={15}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize="11"
              fill="#6B4220"
              letterSpacing="0.3"
            >
              {text}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
