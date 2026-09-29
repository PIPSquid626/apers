"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type HealthMetrics = {
  avgCa: number; // average ca_score, already scaled to /100 by caller
  avgExam: number;
  avgAttendance: number;
  passRate: number; // % of graded assessments that are Excellent or Good
};

export default function HealthRadarChart({ metrics, sampleSize }: { metrics: HealthMetrics; sampleSize: number }) {
  const data = [
    { metric: "Avg CA", value: metrics.avgCa },
    { metric: "Avg Exam", value: metrics.avgExam },
    { metric: "Attendance", value: metrics.avgAttendance },
    { metric: "Pass Rate", value: metrics.passRate },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Institutional Health</CardTitle>
        <CardDescription>
          {sampleSize > 0 ? `Averaged across ${sampleSize} graded assessments` : "No graded assessments yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto h-[240px] w-full max-w-xs">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="75%">
              <PolarGrid stroke="var(--admin-grid)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--admin-muted)", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => `${Math.round(v)}%`}
                contentStyle={{
                  background: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--admin-text)",
                }}
              />
              <Radar
                dataKey="value"
                stroke="var(--admin-accent)"
                fill="var(--admin-accent)"
                fillOpacity={0.25}
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--admin-surface)", stroke: "var(--admin-accent)", strokeWidth: 2 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}