"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/components/providers/LanguageProvider";

const DEFAULT = { work: 25, brk: 5 };

function load() {
  try {
    const raw = localStorage.getItem("pomodoro_settings");
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw) as { work?: number; brk?: number };
    return { work: p.work ?? DEFAULT.work, brk: p.brk ?? DEFAULT.brk };
  } catch {
    return DEFAULT;
  }
}

export function PomodoroSettingsCard() {
  const t = useTranslation();
  const [settings, setSettings] = useState(DEFAULT);
  const [editing, setEditing] = useState(false);
  const [draftWork, setDraftWork] = useState(DEFAULT.work);
  const [draftBreak, setDraftBreak] = useState(DEFAULT.brk);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = load();
    setSettings(s);
    setDraftWork(s.work);
    setDraftBreak(s.brk);
  }, []);

  function save() {
    const s = {
      work: Math.min(120, Math.max(1, draftWork)),
      brk: Math.min(60, Math.max(1, draftBreak)),
    };
    localStorage.setItem("pomodoro_settings", JSON.stringify(s));
    setSettings(s);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card padding="md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.settings.pomodoroTitle}</CardTitle>
          {!editing && (
            <button
              onClick={() => { setDraftWork(settings.work); setDraftBreak(settings.brk); setEditing(true); }}
              className="text-sand-500 text-xs hover:text-sand-200 transition-colors"
            >
              {t.settings.editBtn}
            </button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sand-500 text-sm shrink-0">{t.settings.workDuration}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={draftWork}
                  onChange={(e) => setDraftWork(Number(e.target.value))}
                  className="w-16 bg-card border border-warm rounded px-2 py-1 text-sand-200 text-sm focus:outline-none focus:border-ember-400 text-center"
                />
                <span className="text-sand-500 text-sm">min</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sand-500 text-sm shrink-0">{t.settings.breakDuration}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draftBreak}
                  onChange={(e) => setDraftBreak(Number(e.target.value))}
                  className="w-16 bg-card border border-warm rounded px-2 py-1 text-sand-200 text-sm focus:outline-none focus:border-ember-400 text-center"
                />
                <span className="text-sand-500 text-sm">min</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>{t.settings.cancelBtn}</Button>
              <Button variant="primary" size="sm" onClick={save}>{t.settings.saveBtn}</Button>
            </div>
          </div>
        ) : (
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sand-500 text-sm">{t.settings.workDuration}</dt>
              <dd className="text-sand-200 text-sm">{settings.work} min</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sand-500 text-sm">{t.settings.breakDuration}</dt>
              <dd className="text-sand-200 text-sm">{settings.brk} min</dd>
            </div>
            {saved && <p className="text-green-400 text-xs">{t.settings.savedFeedback}</p>}
          </dl>
        )}
      </CardBody>
    </Card>
  );
}
