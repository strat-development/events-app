"use client";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import "@/styles/animated-gradient.css";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(108, 0, 162)",
  gradientBackgroundEnd = "rgb(0, 17, 82)",
  pointerColor = "140, 100, 255",
  blendingValue = "hard-light",
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
    document.body.style.setProperty("--pointer-color", pointerColor);
    document.body.style.setProperty("--blending-value", blendingValue);
  }, [gradientBackgroundStart, gradientBackgroundEnd, pointerColor, blendingValue]);

  return (
    <div
      className={cn(
        "w-full rounded-xl backdrop-blur-3xl relative overflow-hidden bg-[linear-gradient(45deg,var(--gradient-background-start),var(--gradient-background-end))]",
        containerClassName
      )}
    >
      <div className={cn("rounded-xl relative z-10", className)}>{children}</div>
      <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: blobCount }).map((_, i) => (
          <div key={i} className={`blob blob-${i + 1}`} />
        ))}
      </div>
    </div>
  );
};
