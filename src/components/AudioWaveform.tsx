import React, { useEffect, useRef } from "react";

interface AudioWaveformProps {
  isRecording?: boolean;
  isPlaying?: boolean;
  audioData?: Float32Array;
  duration?: number;
  currentTime?: number;
  height?: number;
}

const AudioWaveform = ({
  isRecording = false,
  isPlaying = false,
  audioData = new Float32Array(100).fill(0.05),
  duration = 0,
  currentTime = 0,
  height = 120,
}: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (audioData && audioData.length > 0) {
      const barWidth = width / audioData.length;
      const barGap = Math.max(1, barWidth * 0.2);
      const effectiveBarWidth = barWidth - barGap;

      const progressPosition = isPlaying ? (currentTime / duration) * width : 0;

      for (let i = 0; i < audioData.length; i++) {
        const x = i * barWidth;
        const barHeight = audioData[i] * height;
        const y = height / 2 - barHeight / 2;

        if (isPlaying && x < progressPosition) {
          ctx.fillStyle = "#4f46e5";
        } else {
          ctx.fillStyle = "#6b7280";
        }

        ctx.fillRect(x, y, effectiveBarWidth, barHeight);
      }

      if (isPlaying) {
        const playheadX = (currentTime / duration) * width;
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(playheadX - 1, 0, 2, height);
      }
      return;
    }

    if (isRecording) {
      const drawAnimatedWaveform = (timestamp: number) => {
        if (!canvas) return;

        if (timestamp - lastUpdateTimeRef.current < 50) {
          animationRef.current = requestAnimationFrame(drawAnimatedWaveform);
          return;
        }

        lastUpdateTimeRef.current = timestamp;

        ctx.clearRect(0, 0, width, height);

        const barCount = 50;
        const barWidth = width / barCount;
        const barGap = Math.max(1, barWidth * 0.2);
        const effectiveBarWidth = barWidth - barGap;

        ctx.fillStyle = "#ef4444";

        for (let i = 0; i < barCount; i++) {
          const randomHeight = Math.random() * 0.5 + 0.1;
          const barHeight = randomHeight * height;
          const x = i * barWidth;
          const y = height / 2 - barHeight / 2;

          ctx.fillRect(x, y, effectiveBarWidth, barHeight);
        }

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        animationRef.current = requestAnimationFrame(drawAnimatedWaveform);
      };

      animationRef.current = requestAnimationFrame(drawAnimatedWaveform);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPlaying, audioData, duration, currentTime]);

  return (
    <div className="w-full bg-background rounded-md p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={1000}
          height={height}
          className="w-full h-auto"
        />
        {isRecording && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm font-medium text-red-500">
              Recording...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioWaveform;
