import { useRef, useEffect } from "react";

const POINT_COUNT = 20;
const LERP_FACTOR = 0.3;
const AMP_SCALE = 10.0;

interface Props {
  active: boolean;
  ctxRef: React.RefObject<AudioContext | null>;
  nodeRef: React.RefObject<AudioNode | null>;
  color?: string;
}

export function AudioVisualizer({ active, ctxRef, nodeRef, color = "#94a3b8" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep canvas pixel dimensions in sync with its CSS size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Connect/disconnect analyser and run the animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawIdle = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    };

    if (!active) {
      drawIdle();
      return;
    }

    const audioCtx = ctxRef.current;
    const node = nodeRef.current;
    if (!audioCtx || !node) {
      drawIdle();
      return;
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    node.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const points = new Array<number>(POINT_COUNT).fill(0);
    let rafId: number;

    const loop = () => {
      analyser.getByteTimeDomainData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      ctx2d.clearRect(0, 0, w, h);
      ctx2d.lineWidth = 3;
      ctx2d.strokeStyle = color;
      ctx2d.beginPath();

      const sliceW = w / (POINT_COUNT - 1);
      const step = Math.floor(dataArray.length / POINT_COUNT);

      for (let i = 0; i < POINT_COUNT; i++) {
        const idx = Math.min(i * step, dataArray.length - 1);
        const val = dataArray[idx] / 128.0 - 1.0;
        const norm = i / (POINT_COUNT - 1);
        const win = Math.sin(norm * Math.PI); // guitar-string envelope: 0→1→0
        const target = val * (h * 0.4) * AMP_SCALE * win;
        points[i] += (target - points[i]) * LERP_FACTOR;
      }

      for (let i = 0; i < POINT_COUNT; i++) {
        const x = i * sliceW;
        const y = h / 2 + points[i];
        if (i === 0) {
          ctx2d.moveTo(x, y);
        } else {
          const px = (i - 1) * sliceW;
          const py = h / 2 + points[i - 1];
          ctx2d.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
        }
      }
      ctx2d.lineTo(w, h / 2);
      ctx2d.stroke();

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      try { node.disconnect(analyser); } catch { /* already disconnected */ }
      drawIdle();
    };
  }, [active, ctxRef, nodeRef, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
