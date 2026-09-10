import React, { useEffect, useRef } from 'react';
export function useReveal<T extends HTMLElement>(delay = 0): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('rv-pre');
    if (delay) el.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('rv-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    const t = setTimeout(() => { el.classList.add('rv-in'); }, 3500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [delay]);
  return ref;
}
export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'span' }> = ({ children, delay = 0, className = '' }) => {
  const ref = useReveal<HTMLDivElement>(delay);
  return <div ref={ref} className={className}>{children}</div>;
};
export default Reveal;
