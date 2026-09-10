import React, { useEffect, useRef, useState } from 'react';

interface PathNode {
  x: number;
  y: number;
  label?: string;
}

interface ConnectedPathProps {
  className?: string;
  nodes?: PathNode[];
  viewBox?: string;
  scrollProgress?: number;
}

/**
 * ConnectedPath — the signature global journey visual.
 *
 * A single continuous SVG path that curves through the page,
 * connecting luminous nodes. It is purely decorative (pointer-events: none)
 * and supports prefers-reduced-motion.
 */
export const ConnectedPath: React.FC<ConnectedPathProps> = ({
  className = '',
  nodes = [
    { x: 220, y: 120, label: 'Clarity tomorrow' },
    { x: 480, y: 260, label: 'Guidance today' },
    { x: 700, y: 420, label: 'Experience matters' },
    { x: 980, y: 620 },
    { x: 1240, y: 820 },
  ],
  viewBox = '0 0 1440 900',
  scrollProgress = 0,
}) => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [length, setLength] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const l = path.getTotalLength();
    setLength(l);
    path.style.strokeDasharray = `${l}`;
    path.style.strokeDashoffset = `${l}`;
    if (reduced) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(0.22, 1, 0.36, 1)';
        path.style.strokeDashoffset = '0';
      });
    });
  }, [reduced]);

  // Build a smooth bezier path through the nodes
  const buildD = (pts: PathNode[]): string => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const c1x = a.x + (b.x - a.x) * 0.5;
      const c1y = a.y;
      const c2x = b.x - (b.x - a.x) * 0.5;
      const c2y = b.y;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
    }
    return d;
  };

  const pathD = buildD(nodes);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cp-grad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#8052ff" stopOpacity="0" />
          <stop offset="18%" stopColor="#8052ff" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#8052ff" stopOpacity="0.4" />
          <stop offset="82%" stopColor="#8052ff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8052ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cp-glowGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#8052ff" stopOpacity="0" />
          <stop offset="18%" stopColor="#8052ff" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#8052ff" stopOpacity="0.12" />
          <stop offset="82%" stopColor="#8052ff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#8052ff" stopOpacity="0" />
        </linearGradient>
        <filter id="cp-softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cp-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Far faint path — depth layer */}
      <path
        d={pathD}
        fill="none"
        stroke="url(#cp-glowGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#cp-softGlow)"
        opacity="0.55"
      />

      {/* Main luminous path */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="url(#cp-grad)"
        strokeWidth="1.4"
        strokeLinecap="round"
        filter="url(#cp-glow)"
        style={{ strokeDasharray: `${length}`, strokeDashoffset: `${length}` }}
      />

      {/* Nodes */}
      {nodes.map((n, idx) => (
        <g key={idx}>
          <circle cx={n.x} cy={n.y} r="3.5" fill="#8052ff" opacity="0.85">
            {!reduced && (
              <animate
                attributeName="opacity"
                values="0.4;0.95;0.4"
                dur={`${3 + idx * 0.5}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle cx={n.x} cy={n.y} r="9" fill="#8052ff" opacity="0.1">
            {!reduced && (
              <>
                <animate attributeName="r" values="7;14;7" dur={`${3 + idx * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.08;0.22;0.08" dur={`${3 + idx * 0.5}s`} repeatCount="indefinite" />
              </>
            )}
          </circle>
          {n.label && (
            <text
              x={n.x}
              y={n.y - 16}
              textAnchor="middle"
              fill="#a07cff"
              fontSize="11"
              fontWeight="500"
              opacity="0.65"
              fontFamily="Inter, sans-serif"
              letterSpacing="0.4"
            >
              {n.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

export default ConnectedPath;