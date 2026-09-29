"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Users, BookOpen, AlertTriangle, TrendingUp, UserPlus, BookPlus, ClipboardList } from "lucide-react";
import { useAdminData } from "@/lib/useAdminData";
import StatCard from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_ORDER = ["Excellent", "Good", "Average", "Poor"] as const;
const CATEGORY_COLOR: Record<(typeof CATEGORY_ORDER)[number], string> = {
  Excellent: "bg-excellent",
  Good: "bg-good",
  Average: "bg-average",
  Poor: "bg-poor",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboardPage() {
  const { stats, atRisk, categoryCounts, avgScore, gradedCount, loading } = useAdminData();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", auth.user.id).single();
      setAdminName(profile?.full_name ?? "");
    })();
  }, []);

  const total = CATEGORY_ORDER.reduce((s, c) => s + (categoryCounts[c] ?? 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[var(--admin-text)]">
            {greeting()}{adminName ? `, ${adminName}` : ", Administrator"}
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Academic Performance Evaluation and Recommendation System
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/students"
            className="flex items-center gap-1.5 rounded-full border border-[var(--admin-border)] px-4 py-2 text-xs font-medium text-[var(--admin-text)] transition-colors hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)]"
          >
            <UserPlus size={14} /> Add Student
          </Link>
          <Link
            href="/admin/courses"
            className="flex items-center gap-1.5 rounded-full border border-[var(--admin-border)] px-4 py-2 text-xs font-medium text-[var(--admin-text)] transition-colors hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)]"
          >
            <BookPlus size={14} /> Add Course
          </Link>
          <Link
            href="/admin/enrollments"
            className="flex items-center gap-1.5 rounded-full bg-[var(--admin-accent)] px-4 py-2 text-xs font-bold text-[var(--admin-accent-contrast)]"
          >
            <ClipboardList size={14} /> Enroll Student
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Enrolled Students"
          value={loading ? "…" : stats.students}
          icon={Users}
          hint="Active across all departments"
        />
        <StatCard
          label="Active Courses"
          value={loading ? "…" : stats.courses}
          icon={BookOpen}
          hint="Currently offered this semester"
        />
        <StatCard
          label="Requiring Attention"
          value={loading ? "…" : atRisk.length}
          icon={AlertTriangle}
          tone="warning"
          hint={loading ? undefined : atRisk.length > 0 ? "Below the 40% pass threshold" : "No students currently at risk"}
        />
        <StatCard
          label="Institutional Average"
          value={loading ? "…" : gradedCount > 0 ? `${avgScore.toFixed(1)}%` : "—"}
          icon={TrendingUp}
          tone="accent"
          hint={loading ? undefined : `From ${gradedCount} graded assessment${gradedCount === 1 ? "" : "s"}`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Students Requiring Academic Attention</CardTitle>
            <CardDescription>Live tracking for evaluations under the remedial threshold</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            {loading ? (
              <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
            ) : atRisk.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">No students are currently below the pass threshold.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-[var(--admin-muted)]">
                      <th className="pb-2 pr-4 font-medium">Student</th>
                      <th className="pb-2 pr-4 font-medium">Course</th>
                      <th className="pb-2 pr-4 font-medium">Score</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atRisk.map((a: any, i: number) => (
                      <tr key={i} className="border-t" style={{ borderColor: "var(--admin-border)" }}>
                        <td className="py-2.5 pr-4">
                          <div className="font-medium text-[var(--admin-text)]">
                            {a.enrollment?.student?.full_name ?? "Unknown"}
                          </div>
                          {a.enrollment?.student?.identifier && (
                            <div className="text-xs text-[var(--admin-muted)]">{a.enrollment.student.identifier}</div>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-[var(--admin-text)]">
                          {a.enrollment?.course?.code}
                          <div className="text-xs text-[var(--admin-muted)]">{a.enrollment?.course?.title}</div>
                        </td>
                        <td className="py-2.5 pr-4 font-serif text-[var(--admin-text)]">{a.total_score}/100</td>
                        <td className="py-2.5">
                          <span className="rounded-full bg-poor/15 px-2.5 py-1 text-xs font-semibold text-poor">
                            Poor
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Category Distribution</CardTitle>
            <CardDescription>{total} graded assessment{total === 1 ? "" : "s"}</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            {total === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">No graded assessments yet.</p>
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--admin-surface-soft)" }}>
                  {CATEGORY_ORDER.map((cat) => {
                    const count = categoryCounts[cat] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={cat}
                        className={CATEGORY_COLOR[cat]}
                        style={{ width: `${(count / total) * 100}%` }}
                        title={`${cat}: ${count}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {CATEGORY_ORDER.map((cat) => {
                    const count = categoryCounts[cat] ?? 0;
                    const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
                    return (
                      <div key={cat} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${CATEGORY_COLOR[cat]}`} />
                          <span className="text-[var(--admin-text)]">{cat}</span>
                        </div>
                        <span className="text-[var(--admin-muted)]">
                          {count} · {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}