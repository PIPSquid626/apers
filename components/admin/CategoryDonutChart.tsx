"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Same palette as .category-badge / .category-* classes in globals.css
const CATEGORY_COLORS: Record<string, string> = {
  Excellent: "#B8860B",
  Good: "#2C5F8A",
  Average: "#C1793C",
  Poor: "#A6432D",
};

const ORDER = ["Excellent", "Good", "Average", "Poor"];

export default function CategoryDonutChart({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const data = ORDER.filter((k) => counts[k] > 0).map((k) => ({ name: k, value: counts[k] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Breakdown</CardTitle>
        <CardDescription>Graded assessments by category ({total} total)</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--admin-muted)]">No graded assessments yet.</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    cornerRadius={4}
                    stroke="var(--admin-surface)"
                    strokeWidth={3}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--admin-surface)",
                      border: "1px solid var(--admin-border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--admin-text)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {data.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[var(--admin-muted)]">
                    <span
                      className="h-2.5 w-2.5 rounded-[2px]"
                      style={{ backgroundColor: CATEGORY_COLORS[d.name] }}
                    />
                    {d.name}
                  </span>
                  <span className="font-mono font-medium text-[var(--admin-text)]">
                    {d.value} · {Math.round((d.value / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}