"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/providers/LanguageProvider";

const RING_RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const DEFAULT_WORK = 25;
const DEFAULT_BREAK = 5;

function getSettings(): { work: number; brk: number } {
  if (typeof window === "undefined") return { work: DEFAULT_WORK, brk: DEFAULT_BREAK };
  try {
    const raw = localStorage.getItem("pomodoro_settings");
    if (!raw) return { work: DEFAULT_WORK, brk: DEFAULT_BREAK };
    const parsed = JSON.parse(raw) as { work?: number; brk?: number };
    return {
      work: parsed.work && parsed.work >= 1 && parsed.work <= 120 ? parsed.work : DEFAULT_WORK,
      brk: parsed.brk && parsed.brk >= 1 && parsed.brk <= 60 ? parsed.brk : DEFAULT_BREAK,
    };
  } catch {
    return { work: DEFAULT_WORK, brk: DEFAULT_BREAK };
  }
}

export function PomodoroTimer() {
  const t = useTranslation();
  const [settings, setSettings] = useState({ work: DEFAULT_WORK, brk: DEFAULT_BREAK });
  const [mode, setMode] = useState<"work" | "break">("work");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [draftWork, setDraftWork] = useState(DEFAULT_WORK);
  const [draftBreak, setDraftBreak] = useState(DEFAULT_BREAK);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    setTimeLeft(s.work * 60);
    setDraftWork(s.work);
    setDraftBreak(s.brk);
  }, []);

  const workSecs = settings.work * 60;
  const breakSecs = settings.brk * 60;
  const total = mode === "work" ? workSecs : breakSecs;
  const progress = timeLeft / total;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (mode === "work") {
            setCycles((c) => c + 1);
            setMode("break");
            return breakSecs;
          } else {
            setMode("work");
            return workSecs;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, mode, workSecs, breakSecs]);

  function toggle() { setIsRunning((r) => !r); }

  function reset() {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? workSecs : breakSecs);
  }

  function skip() {
    setIsRunning(false);
    if (mode === "work") {
      setCycles((c) => c + 1);
      setMode("break");
      setTimeLeft(breakSecs);
    } else {
      setMode("work");
      setTimeLeft(workSecs);
    }
  }

  function saveSettings() {
    const s = {
      work: Math.min(120, Math.max(1, draftWork)),
      brk: Math.min(60, Math.max(1, draftBreak)),
    };
    localStorage.setItem("pomodoro_settings", JSON.stringify(s));
    setSettings(s);
    setIsRunning(false);
    setMode("work");
    setTimeLeft(s.work * 60);
    setCycles(0);
    setShowSettings(false);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const ringColor = mode === "work" ? "#E8732A" : "#5B8A70";

  if (showSettings) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
        <p className="text-sand-400 text-xs font-semibold uppercase tracking-wider">{t.study.timerSettings}</p>
        <div className="w-full space-y-3">
          <div>
            <label className="block text-sand-500 text-xs mb-1">{t.study.workMin}</label>
            <input
              type="number"
              min={1}
              max={120}
              value={draftWork}
              onChange={(e) => setDraftWork(Number(e.target.value))}
              className="w-full bg-card border border-warm rounded px-2 py-1.5 text-sand-200 text-sm focus:outline-none focus:border-ember-400 text-center"
            />
          </div>
          <div>
            <label className="block text-sand-500 text-xs mb-1">{t.study.breakMin}</label>
            <input
              type="number"
              min={1}
              max={60}
              value={draftBreak}
              onChange={(e) => setDraftBreak(Number(e.target.value))}
              className="w-full bg-card border border-warm rounded px-2 py-1.5 text-sand-200 text-sm focus:outline-none focus:border-ember-400 text-center"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>{t.settings.cancelBtn}</Button>
          <Button variant="primary" size="sm" onClick={saveSettings}>{t.settings.saveBtn}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 140 140" aria-hidden="true">
          <circle cx="70" cy="70" r={RING_RADIUS} fill="none" stroke="#2A1F18" strokeWidth="8" />
          <circle
            cx="70" cy="70" r={RING_RADIUS} fill="none"
            stroke={ringColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
            transform="rotate(-90 70 70)"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sand-200 text-3xl font-mono font-semibold tabular-nums leading-none">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-xs uppercase tracking-widest mt-1" style={{ color: ringColor }}>
            {mode === "work" ? t.study.focus : t.study.breakMode}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={reset} disabled={isRunning}>{t.study.reset}</Button>
        <Button variant={isRunning ? "secondary" : "primary"} size="sm" onClick={toggle} className="w-20">
          {isRunning ? t.study.pause : t.study.start}
        </Button>
        <Button variant="ghost" size="sm" onClick={skip}>{t.study.skip}</Button>
      </div>

      <div className="flex flex-col items-center gap-1">
        {cycles > 0 && (
          <p className="text-sand-600 text-xs">{t.study.cycleCompleted(cycles)}</p>
        )}
        <button
          onClick={() => { setDraftWork(settings.work); setDraftBreak(settings.brk); setShowSettings(true); }}
          className="text-sand-700 text-xs hover:text-sand-500 transition-colors"
        >
          {settings.work}m / {settings.brk}m · {t.study.editTimer}
        </button>
      </div>
    </div>
  );
}
