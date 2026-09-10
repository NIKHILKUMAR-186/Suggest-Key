import React, { useEffect, useRef, useState } from 'react';
export const NODES = [
  { x: 1140, y: 120, label: 'Clarity tomorrow' },
  { x: 980, y: 300, label: 'Guidance today' },
  { x: 1180, y: 520, label: 'Experience matters' },
  { x: 300, y: 780 }, { x: 1140, y: 1050 },
  { x: 260, y: 1330 }, { x: 720, y: 1600 }, { x: 720, y: 1900 },
];
function buildD(pts: { x: number; y: number }[]): string {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]; const b = pts[i + 1]; const dx = b.x - a.x;
    d += ` C ${(a.x + dx * 0.35).toFixed(1)} ${(a.y + (b.y - a.y) * 0.15).toFixed(1)}, ${(b.x - dx * 0.35).toFixed(1)} ${(b.y - (b.y - a.y) * 0.15).toFixed(1)}, ${b.x} ${b.y}`;
  }
  return d;
}
const D = buildD(NODES);
export const JourneyPath: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const midRef = useRef<SVGPathElement | null>(null);
  const actRef = useRef<SVGPathElement | null>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);
  useEffect(() => {
    const mid = midRef.current; const act = actRef.current; const wrap = wrapRef.current;
    if (!mid || !act || !wrap) return;
    let len = 4000;
    try { len = mid.getTotalLength(); } catch { /* noop */ }
    mid.style.strokeDasharray = `${len}`;
    act.style.strokeDasharray = `${len}`;
    act.style.strokeDashoffset = `${len * 0.85}`;
    if (!reduced) {
      mid.style.strokeDashoffset = `${len}`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        mid.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(0.22,1,0.36,1)';
        mid.style.strokeDashoffset = '0';
      }));
    } else { mid.style.strokeDashoffset = '0'; act.style.strokeDashoffset = '0'; return; }
    let raf = 0; let tick = false;
    const onScroll = () => {
      if (tick) return; tick = true;
      raf = requestAnimationFrame(() => {
        tick = false;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, window.scrollY / max));
        act.style.strokeDashoffset = `${len * (1 - p)}`;
        if (window.innerWidth >= 768) wrap.style.transform = `translate3d(0,${(window.scrollY * -0.04).toFixed(1)}px,0)`;
        else wrap.style.transform = 'none';
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [reduced]);
  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_78%_8%,rgba(128,82,255,0.10),transparent_65%),radial-gradient(760px_480px_at_12%_32%,rgba(34,211,238,0.05),transparent_65%),radial-gradient(1000px_700px_at_50%_88%,rgba(128,82,255,0.07),transparent_70%)]" />
      <svg viewBox="0 0 1440 2000" preserveAspectRatio="xMidYMin slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="jp-faint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8052ff" stopOpacity="0" />
            <stop offset="15%" stopColor="#8052ff" stopOpacity="0.16" />
            <stop offset="50%" stopColor="#8052ff" stopOpacity="0.10" />
            <stop offset="85%" stopColor="#8052ff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#8052ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="jp-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8052ff" stopOpacity="0" />
            <stop offset="12%" stopColor="#8052ff" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#a07cff" stopOpacity="0.38" />
            <stop offset="88%" stopColor="#8052ff" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#8052ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="jp-act" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9b3ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8052ff" stopOpacity="0.55" />
          </linearGradient>
          <filter id="jp-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="jp-crisp" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={D} fill="none" stroke="url(#jp-faint)" strokeWidth="7" strokeLinecap="round" filter="url(#jp-soft)" opacity="0.6" />
        <path ref={midRef} d={D} fill="none" stroke="url(#jp-mid)" strokeWidth="1.6" strokeLinecap="round" filter="url(#jp-crisp)" opacity="0.85" />
        <path ref={actRef} d={D} fill="none" stroke="url(#jp-act)" strokeWidth="2" strokeLinecap="round" filter="url(#jp-crisp)" opacity="0.55" />
        {NODES.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="16" fill="#8052ff" opacity="0.08" />
            <circle cx={n.x} cy={n.y} r="4.5" fill="#a07cff" opacity="0.9" filter="url(#jp-crisp)">
              {!reduced && <animate attributeName="opacity" values="0.45;0.95;0.45" dur={`${3 + i * 0.6}s`} repeatCount="indefinite" />}
            </circle>
            <circle cx={n.x} cy={n.y} r="9" fill="none" stroke="#8052ff" strokeOpacity="0.35" strokeWidth="1" />
            {(n as { label?: string }).label && (
              <text x={n.x} y={n.y - 20} textAnchor="middle" fill="#a07cff" fontSize="12" fontWeight="500" opacity="0.55" fontFamily="Inter, sans-serif" letterSpacing="0.5">{(n as { label?: string }).label}</text>
            )}
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-transparent to-[#050507] opacity-70" />
    </div>
  );
};
export default JourneyPath;

