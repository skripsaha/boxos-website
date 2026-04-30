import * as React from "react";

type Props = {
  size?: number;
  className?: string;
  monochrome?: boolean;
};

/**
 * BoxOS mark — open cardboard box, three-quarter view.
 * Hand-drawn paths matched to the project's official artwork.
 */
export function Logo({ size = 28, className, monochrome = false }: Props) {
  const a = monochrome ? "currentColor" : "#B8814B";
  const b = monochrome ? "currentColor" : "#9D6B3A";
  const c = monochrome ? "currentColor" : "#6B4220";
  const d = monochrome ? "currentColor" : "#4A2C12";
  const e = monochrome ? "currentColor" : "#D9A26B";
  const opa = monochrome ? { a: 0.95, b: 0.78, c: 0.45, d: 0.28, e: 1 } : { a: 1, b: 1, c: 1, d: 1, e: 1 };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* back flap */}
      <path d="M22 16 L42 16 L40 22 L24 22 Z" fill={c} fillOpacity={opa.c} />
      {/* left flap */}
      <path d="M10 22 L24 22 L20 26 L8 26 Z" fill={b} fillOpacity={opa.b} />
      {/* right flap */}
      <path d="M42 22 L56 22 L58 26 L46 26 Z" fill={b} fillOpacity={opa.b} />
      {/* interior shadow (visible through opening) */}
      <path d="M14 26 L52 26 L50 32 L16 32 Z" fill={d} fillOpacity={opa.d} />
      {/* body — front face */}
      <path
        d="M10 26 L54 26 L52 54 L12 54 Z"
        fill={a}
        fillOpacity={opa.a}
      />
      {/* body — top rim highlight */}
      <path d="M10 26 L54 26 L52 28 L12 28 Z" fill={e} fillOpacity={opa.e * 0.55} />
      {/* center seam */}
      <path d="M32 28 L32 54" stroke={c} strokeOpacity={opa.c * 0.6} strokeWidth="0.6" />
    </svg>
  );
}

export function LogoMark({ size = 16, className }: { size?: number; className?: string }) {
  return <Logo size={size} className={className} monochrome />;
}
