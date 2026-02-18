"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

const RING_RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function PomodoroTimer() {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);

  const total = mode === "work" ? WORK_SECONDS : BREAK_SECONDS;
  const progress = timeLeft / total; // 1.0 → 0.0
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Phase complete — switch and pause
          setIsRunning(false);
          if (mode === "work") {
            setCycles((c) => c + 1);
            setMode("break");
            return BREAK_SECONDS;
          } else {
            setMode("work");
            return WORK_SECONDS;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, mode]);

  function toggle() {
    setIsRunning((r) => !r);
  }

  function reset() {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? WORK_SECONDS : BREAK_SECONDS);
  }

  function skip() {
    setIsRunning(false);
    if (mode === "work") {
      setCycles((c) => c + 1);
      setMode("break");
      setTimeLeft(BREAK_SECONDS);
    } else {
      setMode("work");
      setTimeLeft(WORK_SECONDS);
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const ringColor = mode === "work" ? "#E8732A" : "#5B8A70";

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      {/* SVG ring */}
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 140 140" aria-hidden="true">
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r={RING_RADIUS}
            fill="none"
            stroke="#2A1F18"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="70"
            cy="70"
            r={RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* Time + label overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sand-200 text-3xl font-mono font-semibold tabular-nums leading-none">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span
            className="text-xs uppercase tracking-widest mt-1"
            style={{ color: ringColor }}
          >
            {mode === "work" ? "Focus" : "Break"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={reset} disabled={isRunning}>
          Reset
        </Button>
        <Button
          variant={isRunning ? "secondary" : "primary"}
          size="sm"
          onClick={toggle}
          className="w-20"
        >
          {isRunning ? "Pause" : "Start"}
        </Button>
        <Button variant="ghost" size="sm" onClick={skip}>
          Skip →
        </Button>
      </div>

      {/* Cycle counter */}
      {cycles > 0 && (
        <p className="text-sand-600 text-xs">
          {cycles} {cycles === 1 ? "cycle" : "cycles"} completed
        </p>
      )}
    </div>
  );
}
