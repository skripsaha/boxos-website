import * as React from "react";

type Props = {
  size?: number;
  className?: string;
};

/** BoxOS mark — real artwork rendered as a raster image. */
export function Logo({ size = 28, className }: Props) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/logo.png"
      width={size}
      height={Math.round(size * (976 / 1056))}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ display: "block", objectFit: "contain", flexShrink: 0 }}
    />
  );
}
