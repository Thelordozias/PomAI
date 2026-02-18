import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Capture, MathCaptureContent, GenericCaptureContent } from "@/types";

interface StatRow {
  label: string;
  value: number | string;
  href?: string;
  accent?: boolean;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // ── Parallel stats queries ──────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: courseCount },
    { count: captureToday },
    { count: reviewToday },
    { data: recentCaptures },
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase
      .from("captures")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("review_logs")
      .select("*", { count: "exact", head: true })
      .gte("reviewed_at", todayStart.toISOString()),
    supabase
      .from("captures")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats: StatRow[] = [
    {
      label: "Courses",
      value: courseCount ?? 0,
      href: "/courses",
    },
    {
      label: "Captures today",
      value: captureToday ?? 0,
      href: "/study",
      accent: (captureToday ?? 0) > 0,
    },
    {
      label: "Reviews today",
      value: reviewToday ?? 0,
      href: "/review",
      accent: (reviewToday ?? 0) > 0,
    },
  ];

  const captures = (recentCaptures ?? []) as Capture[];

  return (
    <div className="max-w-2xl space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-sand-200 text-xl font-semibold">Dashboard</h2>
        <p className="text-sand-500 text-sm mt-0.5">
          Your study snapshot for today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, href, accent }) => {
          const inner = (
            <Card padding="md" hover={!!href}>
              <p
                className={[
                  "text-3xl font-semibold tabular-nums",
                  accent ? "text-ember-400" : "text-sand-200",
                ].join(" ")}
              >
                {value}
              </p>
              <p className="text-sand-500 text-xs mt-1">{label}</p>
            </Card>
          );
          return href ? (
            <Link key={label} href={href}>
              {inner}
            </Link>
          ) : (
            <div key={label}>{inner}</div>
          );
        })}
      </div>

      {/* Recent captures */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sand-200 text-sm font-semibold">Recent Captures</h3>
          <Link
            href="/study"
            className="text-sand-500 text-xs hover:text-ember-400 transition-colors"
          >
            Go to Study →
          </Link>
        </div>

        {captures.length === 0 ? (
          <div className="border border-dashed border-warm rounded p-6 text-center">
            <p className="text-sand-500 text-sm mb-3">No captures yet.</p>
            <Link
              href="/study"
              className="text-ember-400 text-sm hover:underline"
            >
              Start a study session →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {captures.map((c) => (
              <DashboardCaptureRow key={c.id} capture={c} />
            ))}
          </ul>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sand-200 text-sm font-semibold mb-3">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Courses", href: "/courses" },
            { label: "Study", href: "/study" },
            { label: "Review", href: "/review" },
            { label: "Settings", href: "/settings" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-3 py-1.5 rounded border border-warm text-sand-400 text-xs hover:border-ember-400 hover:text-sand-200 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Capture preview row ────────────────────────────────────────────── */

function DashboardCaptureRow({ capture }: { capture: Capture }) {
  const date = new Date(capture.created_at).toLocaleString("en-US", {
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
    preview = c.notes.slice(0, 80) + (c.notes.length > 80 ? "…" : "");
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 rounded bg-card border border-warm">
      <Badge variant={capture.mode === "math" ? "accent" : "default"}>
        {capture.mode === "math" ? "Math" : "Note"}
      </Badge>
      <span className="flex-1 text-sand-400 text-sm truncate">{preview}</span>
      <span className="text-sand-600 text-xs shrink-0">{date}</span>
    </li>
  );
}
