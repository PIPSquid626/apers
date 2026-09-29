"use client";

import { useAdminData } from "@/lib/useAdminData";
import CategoryDonutChart from "@/components/admin/CategoryDonutChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AtRiskPage() {
  const { atRisk, categoryCounts, loading } = useAdminData();

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--admin-text)]">At-Risk Students</h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">Total score below 50/100 in at least one graded course.</p>

      <div className="mt-6">
        <CategoryDonutChart counts={categoryCounts} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>At-Risk Students (Poor category)</CardTitle>
          <CardDescription>{loading ? "Loading…" : `${atRisk.length} case(s) currently`}</CardDescription>
        </CardHeader>
        <CardContent>
          {atRisk.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">None currently.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--admin-border)]">
              {atRisk.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--admin-text)]">
                    {r.enrollment?.student?.full_name}
                    <span className="ml-2 text-[var(--admin-muted)]">{r.enrollment?.course?.title}</span>
                  </span>
                  <span className="font-mono text-[#A6432D]">{r.total_score}/100</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}