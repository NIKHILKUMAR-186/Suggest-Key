import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
}

const PALETTE = [
  '#8052ff', // Electric Iris
  '#ffb829', // Saffron Spark
  '#15846e', // Deep Verdant
  '#a07cff', // Violet Iris
  '#22d3ee', // Bright Teal
  '#fb7185', // Rose
  '#f59e0b', // Amber
  '#38bdf8', // Sky
  '#c084fc', // Lavender
];

export const ConstellationCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = canvas.width = entry.contentRect.width;
        height = canvas.height = entry.contentRect.height;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Generate ~140 3D particles distributed in a dual spherical / organic shell
    const particleCount = 130;
    const particles: Particle[] = [];
    const radius = Math.min(width, height) * 0.38;

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = radius * (0.5 + Math.random() * 0.6);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        size: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let rotY = 0;
    let rotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / height) * 2 - 1;
      targetRotY = nx * 0.4;
      targetRotX = -ny * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let baseAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      baseAngle += 0.003;
      rotY += (targetRotY + baseAngle - rotY) * 0.05;
      rotX += (targetRotX - rotX) * 0.05;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const fov = 400;
      const cx = width / 2;
      const cy = height / 2;

      // Project particles to 2D
      const projected = particles.map((p) => {
        // Rotate around Y
        let x1 = p.baseX * cosY - p.baseZ * sinY;
        let z1 = p.baseZ * cosY + p.baseX * sinY;

        // Rotate around X
        let y1 = p.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.baseY * sinX;

        // Perspective scale
        const scale = fov / (fov + z2 + 250);
        const x2d = cx + x1 * scale;
        const y2d = cy + y1 * scale;

        p.rotation += p.rotSpeed;

        return {
          ...p,
          x2d,
          y2d,
          scale,
          z: z2,
        };
      });

      // Sort by Z for proper depth
      projected.sort((a, b) => b.z - a.z);

      // Draw subtle constellation filaments between close particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.x2d - p2.x2d;
          const dy = p1.y2d - p2.y2d;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 75) {
            const alpha = (1 - dist / 75) * 0.18 * Math.min(p1.scale, p2.scale);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x2d, p1.y2d);
            ctx.lineTo(p2.x2d, p2.y2d);
            ctx.stroke();
          }
        }
      }

      // Draw miniature equilateral triangles for each node
      projected.forEach((p) => {
        const s = p.size * p.scale;
        if (s <= 0) return;

        ctx.save();
        ctx.translate(p.x2d, p.y2d);
        ctx.rotate(p.rotation);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.2, Math.min(0.95, p.scale * 1.1));

        ctx.beginPath();
        const h = s * (Math.sqrt(3) / 2);
        ctx.moveTo(0, -h * (2 / 3));
        ctx.lineTo(s / 2, h / 3);
        ctx.lineTo(-s / 2, h / 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block pointer-events-none ${className}`}
    />
  );
};
