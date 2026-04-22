import { useRef, useEffect, memo } from 'react';
import { useVitalsStore } from '@/stores/vitalsStore';

interface ECGCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

const ECGCanvas = memo(({ width = 600, height = 200, className = '' }: ECGCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const drawIndexRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const drawGrid = () => {
      ctx.strokeStyle = 'hsla(142, 100%, 50%, 0.06)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 10) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 10) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      ctx.strokeStyle = 'hsla(142, 100%, 50%, 0.12)';
      ctx.lineWidth = 0.8;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    };

    const draw = () => {
      const ecgData = useVitalsStore.getState().ecgData;
      ctx.clearRect(0, 0, width, height);
      drawGrid();

      if (ecgData.length < 2) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const mid = height / 2;
      const scale = height * 0.35;
      const step = width / Math.min(ecgData.length, 400);

      // Glow effect
      ctx.shadowColor = 'hsl(142, 100%, 50%)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'hsl(142, 100%, 50%)';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      const startIdx = Math.max(0, ecgData.length - 400);
      for (let i = startIdx; i < ecgData.length; i++) {
        const x = (i - startIdx) * step;
        const y = mid - ecgData[i] * scale;
        if (i === startIdx) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bright dot at the leading edge
      const lastX = (ecgData.length - 1 - startIdx) * step;
      const lastY = mid - ecgData[ecgData.length - 1] * scale;
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'hsl(142, 100%, 70%)';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`rounded-lg ${className}`}
    />
  );
});

ECGCanvas.displayName = 'ECGCanvas';
export default ECGCanvas;
