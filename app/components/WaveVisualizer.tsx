"use client";

import { useEffect, useRef } from "react";

type Props = {
  analyser: AnalyserNode | null;
  isRecording: boolean;
};

export default function WaveVisualizer({ analyser, isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const barCount = 32;
      const totalGap = (barCount - 1) * 3;
      const barWidth = (width - totalGap) / barCount;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        const barHeight = Math.max(value * centerY * 0.85, 1.5);

        // Gradient from center outward — more transparent at edges
        const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
        const alpha = (0.5 + value * 0.5) * (1 - distFromCenter * 0.4);

        const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        gradient.addColorStop(0, `rgba(245, 166, 35, ${alpha * 0.6})`);
        gradient.addColorStop(0.5, `rgba(245, 166, 35, ${alpha})`);
        gradient.addColorStop(1, `rgba(245, 166, 35, ${alpha * 0.6})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const x = i * (barWidth + 3);
        ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, barWidth / 2);
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isRecording]);

  if (!isRecording) return null;

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={80}
      className="w-full h-[80px]"
    />
  );
}
