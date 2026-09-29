"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type CourseStat = { code: string; enrolled: number; avgScore: number | null };

export default function CourseBarChart({ courses }: { courses: CourseStat[] }) {
  const [view, setView] = useState<"enrolled" | "avgScore">("enrolled");

  const data = courses.map((c) => ({
    code: c.code,
    value: view === "enrolled" ? c.enrolled : c.avgScore ?? 0,
  }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <div>
          <CardTitle>{view === "enrolled" ? "Students per Course" : "Average Score per Course"}</CardTitle>
          <CardDescription>
            {view === "enrolled" ? "Enrollment count, from your enrollments table" : "Average total_score of graded assessments"}
          </CardDescription>
        </div>
        <div className="flex overflow-hidden rounded-full border border-[var(--admin-accent)]">
          <button
            onClick={() => setView("enrolled")}
            className={`px-3 py-1 text-[11px] font-medium transition-colors ${
              view === "enrolled" ? "bg-[var(--admin-accent)] text-[var(--admin-accent-contrast)]" : "text-[var(--admin-accent)]"
            }`}
          >
            Enrollment
          </button>
          <button
            onClick={() => setView("avgScore")}
            className={`px-3 py-1 text-[11px] font-medium transition-colors ${
              view === "avgScore" ? "bg-[var(--admin-accent)] text-[var(--admin-accent-contrast)]" : "text-[var(--admin-accent)]"
            }`}
          >
            Avg Score
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--admin-muted)]">No courses yet.</p>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} stroke="var(--admin-grid)" />
                <XAxis dataKey="code" tick={{ fill: "var(--admin-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--admin-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--admin-accent)", opacity: 0.08 }}
                  contentStyle={{
                    background: "var(--admin-surface)",
                    border: "1px solid var(--admin-border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--admin-text)",
                  }}
                />
                <Bar dataKey="value" fill="var(--admin-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}