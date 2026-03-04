import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PomodoroSettingsCard } from "./_components/PomodoroSettingsCard";
import { PreferencesCard } from "./_components/PreferencesCard";
import { getServerTranslations } from "@/lib/i18n/server";

/* ─── Activity chart (CSS-only, no extra dependency) ────────────────── */

function ActivityChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-20">
        {data.map(({ label, count }) => {
          const pct = Math.max((count / max) * 100, count > 0 ? 8 : 0);
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-sand-600 text-[9px] tabular-nums">{count > 0 ? count : ""}</span>
              <div className="w-full rounded-sm overflow-hidden" style={{ height: "52px" }}>
                <div
                  className="w-full bg-ember-500/70 rounded-sm transition-all duration-500"
                  style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {data.map(({ label }) => (
          <div key={label} className="flex-1 text-center text-sand-600 text-[9px]">{label}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default async function SettingsPage() {
  const [supabase, t] = await Promise.all([createClient(), getServerTranslations()]);
  const { data: { user } } = await supabase.auth.getUser();

  const email = user?.email ?? "—";
  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  // 7-day activity window
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    { count: courseCount },
    { count: captureCount },
    { count: cardCount },
    { count: reviewCount },
    { data: reviewActivity },
    { data: captureActivity },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("captures").select("*", { count: "exact", head: true }),
    supabase.from("flashcards").select("*", { count: "exact", head: true }),
    supabase.from("review_logs").select("*", { count: "exact", head: true }),
    supabase.from("review_logs").select("reviewed_at").gte("reviewed_at", sevenDaysAgo.toISOString()),
    supabase.from("captures").select("created_at").gte("created_at", sevenDaysAgo.toISOString()),
  ]);

  // Build last 7 days label → count map
  const days: { label: string; date: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      date: d.toISOString().slice(0, 10),
    });
  }

  const reviewByDay: Record<string, number> = {};
  (reviewActivity ?? []).forEach((r) => {
    const date = (r as { reviewed_at: string }).reviewed_at.slice(0, 10);
    reviewByDay[date] = (reviewByDay[date] ?? 0) + 1;
  });
  const captureByDay: Record<string, number> = {};
  (captureActivity ?? []).forEach((r) => {
    const date = (r as { created_at: string }).created_at.slice(0, 10);
    captureByDay[date] = (captureByDay[date] ?? 0) + 1;
  });

  const reviewChartData = days.map(({ label, date }) => ({ label, count: reviewByDay[date] ?? 0 }));
  const captureChartData = days.map(({ label, date }) => ({ label, count: captureByDay[date] ?? 0 }));

  const AI_FEATURES = [
    { title: t.settings.aiChatTitle, desc: t.settings.aiChatDesc },
    { title: t.settings.aiFlashcardsTitle, desc: t.settings.aiFlashcardsDesc },
    { title: t.settings.aiQuizTitle, desc: t.settings.aiQuizDesc },
    { title: t.settings.aiConceptTitle, desc: t.settings.aiConceptDesc },
    { title: t.settings.aiImportTitle, desc: t.settings.aiImportDesc },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-sand-200 text-xl font-semibold">{t.settings.title}</h2>
        <p className="text-sand-500 text-sm mt-0.5">{t.settings.subtitle}</p>
      </div>

      {/* Account */}
      <Card padding="md">
        <CardHeader><CardTitle>{t.settings.accountTitle}</CardTitle></CardHeader>
        <CardBody>
          <dl className="space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <dt className="text-sand-500 text-sm">{t.settings.emailLabel}</dt>
              <dd className="text-sand-200 text-sm font-medium">{email}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sand-500 text-sm">{t.settings.memberSince}</dt>
              <dd className="text-sand-200 text-sm">{created}</dd>
            </div>
          </dl>
          <div className="flex justify-end">
            <form action={signOut}>
              <Button type="submit" variant="danger" size="sm">{t.settings.signOut}</Button>
            </form>
          </div>
        </CardBody>
      </Card>

      {/* Statistics */}
      <Card padding="md">
        <CardHeader><CardTitle>{t.settings.statsTitle}</CardTitle></CardHeader>
        <CardBody>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: t.settings.courses, value: courseCount ?? 0 },
              { label: t.settings.captures, value: captureCount ?? 0 },
              { label: t.settings.flashcards, value: cardCount ?? 0 },
              { label: t.settings.reviews, value: reviewCount ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-semibold text-sand-200 tabular-nums">{value}</p>
                <p className="text-sand-600 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* 7-day activity charts — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sand-500 text-xs font-medium mb-2">{t.settings.reviewsChart}</p>
              <ActivityChart data={reviewChartData} />
            </div>
            <div>
              <p className="text-sand-500 text-xs font-medium mb-2">{t.settings.capturesChart}</p>
              <ActivityChart data={captureChartData} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Preferences (client component — language toggle) */}
      <PreferencesCard />

      {/* Pomodoro Timer */}
      <PomodoroSettingsCard />

      {/* AI Features */}
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t.settings.aiTitle}</CardTitle>
            <Badge variant="info">{t.settings.aiActive}</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <ul className="space-y-4">
            {AI_FEATURES.map(({ title, desc }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ember-500 shrink-0" />
                <div>
                  <p className="text-sand-200 text-sm font-medium">{title}</p>
                  <p className="text-sand-500 text-xs mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
