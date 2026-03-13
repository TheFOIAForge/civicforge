"use client";

import { useEffect, useRef } from "react";

/**
 * Intersection Observer hook that adds "visible" class to elements
 * when they scroll into view. Use with CSS classes:
 * - animate-on-scroll (fade up)
 * - animate-on-scroll-left (fade left)
 * - animate-on-scroll-scale (scale in)
 * - stagger-children (stagger child animations)
 */
export function useScrollAnimate<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold },
    );

    // Observe the element itself and any animated children
    const targets = el.querySelectorAll(
      ".animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-scale, .stagger-children",
    );
    targets.forEach((t) => observer.observe(t));

    // Also observe the element if it has an animation class
    if (
      el.classList.contains("animate-on-scroll") ||
      el.classList.contains("animate-on-scroll-left") ||
      el.classList.contains("animate-on-scroll-scale") ||
      el.classList.contains("stagger-children")
    ) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
