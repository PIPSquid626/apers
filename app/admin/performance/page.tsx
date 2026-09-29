"use client";

import { useAdminData } from "@/lib/useAdminData";
import HealthRadarChart from "@/components/admin/HealthRadarChart";
import DepartmentFlowChart from "@/components/admin/DepartmentFlowChart";
import CourseBarChart from "@/components/admin/CourseBarChart";

export default function PerformancePage() {
  const { healthMetrics, gradedCount, flowLinks, courseStats } = useAdminData();

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--admin-text)]">Performance</h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">Institutional health, department breakdown, and per-course scores.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HealthRadarChart metrics={healthMetrics} sampleSize={gradedCount} />
        <DepartmentFlowChart links={flowLinks} />
        <CourseBarChart courses={courseStats} />
      </div>
    </div>
  );
}