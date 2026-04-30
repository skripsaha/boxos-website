import * as React from "react";

type Props = {
  username: string;
  avatarData: string | null;
  size?: number;
  className?: string;
};

const TONES = ["#B8814B", "#6B4220", "#9D6B3A", "#C0592C", "#4A2C12", "#7A4A23"];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

export function Avatar({ username, avatarData, size = 36, className }: Props) {
  if (avatarData) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={avatarData}
        alt={`${username}'s avatar`}
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: size > 64 ? 12 : 999,
          imageRendering: "pixelated",
          objectFit: "cover",
          flexShrink: 0,
          background: "var(--color-paper-2)",
          border: "1px solid var(--color-line-2)",
        }}
      />
    );
  }
  const bg = colorFor(username);
  const fontSize = Math.max(11, Math.round(size * 0.42));
  return (
    <span
      className={`flex-shrink-0 inline-flex items-center justify-center select-none text-white font-medium tabular ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: size > 64 ? 12 : 999,
        fontSize,
      }}
      aria-hidden="true"
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
}
