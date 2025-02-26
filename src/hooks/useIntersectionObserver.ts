"use client";

import { useEffect, useState, useRef } from "react";

export const useIntersectionObserver = (options = {}, delay = 300) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasLoaded) {
        setTimeout(() => {
          setIsVisible(true);
          setHasLoaded(true);
        }, delay);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options, delay, hasLoaded]);

  return [ref, isVisible] as const;
};