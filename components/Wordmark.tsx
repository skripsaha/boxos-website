import * as React from "react";
import { Logo } from "./Logo";

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <Logo size={size} />
      <span className="font-medium tracking-tight text-[17px] leading-none">
        BoxOS
      </span>
    </span>
  );
}
