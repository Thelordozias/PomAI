import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getServerTranslations } from "@/lib/i18n/server";
import type { Capture, MathCaptureContent, GenericCaptureContent } from "@/types";

/* ─── Streak helper ──────────────────────────────────────────────────── */

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = Array.from(new Set(dates)).sort((a, b) => (a > b ? -1 : 1));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (unique[0] !== todayStr && unique[0] !== yesterdayStr) return 0;
  let streak = 0;
  let expected = unique[0] === todayStr ? today : yesterday;
  for (const d of unique) {
    const expectedStr = expected.toISOString().slice(0, 10);
    if (d === expectedStr) {
      streak++;
      const prev = new Date(expected);
      prev.setDate(prev.getDate() - 1);
      expected = prev;
    } else break;
  }
  return streak;
}

/* ─── XP + Level system ──────────────────────────────────────────────── */

const LEVEL_THRESHOLDS = [
  { min: 0,    max: 100,  num: 1 },
  { min: 100,  max: 300,  num: 2 },
  { min: 300,  max: 600,  num: 3 },
  { min: 600,  max: 1000, num: 4 },
  { min: 1000, max: Infinity, num: 5 },
];

function computeXP(captures: number, reviews: number, streak: number) {
  return (captures * 5) + (reviews * 2) + (streak * 20);
}

function getLevel(xp: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].min) return LEVEL_THRESHOLDS[i];
  }
  return LEVEL_THRESHOLDS[0];
}

function getLevelProgress(xp: number) {
  const lvl = getLevel(xp);
  if (lvl.max === Infinity) return 1;
  return Math.min((xp - lvl.min) / (lvl.max - lvl.min), 1);
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const [supabase, t] = await Promise.all([createClient(), getServerTranslations()]);
  const { data: { user } } = await supabase.auth.getUser();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [
    { count: courseCount },
    { count: captureToday },
    { count: reviewToday },
    { count: totalCaptures },
    { count: totalReviews },
    { data: recentCaptures },
    { data: captureDates },
    { data: reviewDates },
    { data: dueProgress },
    { count: totalFlashcards },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("captures").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    supabase.from("review_logs").select("*", { count: "exact", head: true }).gte("reviewed_at", todayStart.toISOString()),
    supabase.from("captures").select("*", { count: "exact", head: true }),
    supabase.from("review_logs").select("*", { count: "exact", head: true }),
    supabase.from("captures").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("captures").select("created_at").gte("created_at", sixtyDaysAgo.toISOString()),
    supabase.from("review_logs").select("reviewed_at").gte("reviewed_at", sixtyDaysAgo.toISOString()),
    supabase.from("concept_progress").select("next_review_at").lte("next_review_at", new Date().toISOString()),
    supabase.from("flashcards").select("*", { count: "exact", head: true }),
  ]);

  // Streak & XP
  const allDates: string[] = [
    ...(captureDates ?? []).map((r) => (r as { created_at: string }).created_at.slice(0, 10)),
    ...(reviewDates ?? []).map((r) => (r as { reviewed_at: string }).reviewed_at.slice(0, 10)),
  ];
  const streak = computeStreak(allDates);
  const xp = computeXP(totalCaptures ?? 0, totalReviews ?? 0, streak);
  const level = getLevel(xp);
  const levelProgress = getLevelProgress(xp);
  const nextLevel = LEVEL_THRESHOLDS.find((l) => l.num === level.num + 1);

  const dueCount = (dueProgress ?? []).length;
  const hasCards = (totalFlashcards ?? 0) > 0;
  const captures = (recentCaptures ?? []) as Capture[];
  const isNewUser = (courseCount ?? 0) === 0;

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t.dashboard.greeting_morning
    : hour < 17
    ? t.dashboard.greeting_afternoon
    : t.dashboard.greeting_evening;
  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="max-w-2xl space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sand-200 text-xl font-semibold">{greeting}, {firstName}</h2>
          <p className="text-sand-500 text-sm mt-0.5">{t.dashboard.subtitle}</p>
        </div>
        {streak >= 2 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ember-500/10 border border-ember-500/30">
            <span className="text-ember-400 text-sm font-semibold">{t.dashboard.streak(streak)}</span>
          </div>
        )}
      </div>

      {/* XP Level bar */}
      <div className="bg-card border border-warm rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-ember-500 text-xs font-bold px-2 py-0.5 rounded bg-ember-500/10 border border-ember-500/20">
              {t.dashboard.level(level.num)}
            </span>
            <span className="text-sand-200 text-sm font-medium">{t.dashboard.levelTitles[level.num - 1]}</span>
          </div>
          <span className="text-sand-500 text-xs tabular-nums">
            {xp} XP {nextLevel ? `/ ${nextLevel.min} XP` : t.dashboard.maxLevel}
          </span>
        </div>
        <div className="h-1.5 bg-bark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-ember-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.round(levelProgress * 100)}%` }}
          />
        </div>
        <p className="text-sand-600 text-xs mt-2">{t.dashboard.xpHint}</p>
      </div>

      {/* Onboarding checklist */}
      {isNewUser && (
        <div className="rounded-xl border border-ember-500/30 bg-ember-500/5 p-5">
          <h3 className="text-sand-200 text-sm font-semibold mb-3">{t.dashboard.onboardingTitle}</h3>
          <div className="space-y-2">
            {[
              { label: t.dashboard.onboardingStep1, href: "/courses" },
              { label: t.dashboard.onboardingStep2, href: "/study" },
              { label: t.dashboard.onboardingStep3, href: "/review" },
            ].map(({ label, href }) => (
              <Link key={href} href={href} className="flex items-center gap-3 group">
                <span className="w-5 h-5 rounded-full border border-sand-600 group-hover:border-ember-400 flex items-center justify-center shrink-0 transition-colors" />
                <span className="text-sm text-sand-400 group-hover:text-sand-200 transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.dashboard.courses, value: courseCount ?? 0, href: "/courses", accent: false },
          { label: t.dashboard.capturesToday, value: captureToday ?? 0, href: "/study", accent: (captureToday ?? 0) > 0 },
          { label: t.dashboard.reviewsToday, value: reviewToday ?? 0, href: "/review", accent: (reviewToday ?? 0) > 0 },
          {
            label: dueCount > 0 ? t.dashboard.cardsDue : hasCards ? t.dashboard.upToDate : t.dashboard.flashcards,
            value: dueCount > 0 ? dueCount : (totalFlashcards ?? 0),
            href: "/review",
            accent: dueCount > 0,
          },
        ].map(({ label, value, href, accent }) => (
          <Link key={label} href={href}>
            <Card padding="md" hover>
              <p className={["text-3xl font-semibold tabular-nums", accent ? "text-ember-400" : "text-sand-200"].join(" ")}>
                {value}
              </p>
              <p className="text-sand-500 text-xs mt-1">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Due cards alert */}
      {dueCount > 0 && (
        <Link href="/review" className="block rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 hover:border-amber-400/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 text-sm">{t.dashboard.dueAlert(dueCount)}</span>
            <span className="text-amber-400 text-xs">{t.dashboard.reviewLink}</span>
          </div>
        </Link>
      )}

      {/* Recent captures */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sand-200 text-sm font-semibold">{t.dashboard.recentCaptures}</h3>
          <Link href="/study" className="text-sand-500 text-xs hover:text-ember-400 transition-colors">
            {t.dashboard.studyLink}
          </Link>
        </div>
        {captures.length === 0 ? (
          <div className="border border-dashed border-warm rounded-xl p-6 text-center">
            <p className="text-sand-500 text-sm mb-3">{t.dashboard.noCaptures}</p>
            <Link href="/study" className="text-ember-400 text-sm hover:underline">
              {t.dashboard.startSession}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {captures.map((c) => <DashboardCaptureRow key={c.id} capture={c} />)}
          </ul>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sand-200 text-sm font-semibold mb-3">{t.dashboard.quickLinks}</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: t.nav.courses, href: "/courses" },
            { label: t.nav.study, href: "/study" },
            { label: t.nav.review, href: "/review" },
            { label: t.nav.quiz, href: "/quiz" },
            { label: t.nav.chat, href: "/chat" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg border border-warm text-sand-400 text-xs hover:border-ember-400/50 hover:text-sand-200 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Capture row ────────────────────────────────────────────────────── */

function DashboardCaptureRow({ capture }: { capture: Capture }) {
  const date = new Date(capture.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let preview = "";
  if (capture.mode === "math") {
    const c = capture.content as MathCaptureContent;
    preview = c.concept || c.formula || "(math capture)";
  } else {
    const c = capture.content as GenericCaptureContent;
    preview = (c.notes || "").slice(0, 80) + ((c.notes || "").length > 80 ? "…" : "");
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-warm">
      <Badge variant={capture.mode === "math" ? "accent" : "default"}>
        {capture.mode === "math" ? "Math" : "Note"}
      </Badge>
      <span className="flex-1 text-sand-400 text-sm truncate">{preview}</span>
      <span className="text-sand-600 text-xs shrink-0">{date}</span>
    </li>
  );
}
