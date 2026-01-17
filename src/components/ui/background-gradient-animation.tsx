"use client";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import "@/styles/animated-gradient.css";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(15, 23, 42)",
  gradientBackgroundEnd = "rgb(30, 27, 75)",
  blendingValue = "screen",
  children,
  className,
  containerClassName,
  blobCount = 5,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  pointerColor?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  blobCount?: number;
}) => {
  useEffect(() => {
    document.body.style.setProperty("--gradient-background-start", gradientBackgroundStart);
    document.body.style.setProperty("--gradient-background-end", gradientBackgroundEnd);
    document.body.style.setProperty("--blending-value", blendingValue);
  }, [gradientBackgroundStart, gradientBackgroundEnd, blendingValue]);

  return (
    <div
      className={cn(
        "w-full rounded-xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900",
        containerClassName
      )}
    >
      <div className={cn("rounded-xl relative z-10", className)}>{children}</div>
      <div className="absolute inset-0 z-0 pointer-events-none opacity-80">
        {Array.from({ length: blobCount }).map((_, i) => (
          <div key={i} className={`blob blob-${i + 1}`} />
        ))}
      </div>
    </div>
  );
};
