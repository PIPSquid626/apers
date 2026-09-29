"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import type { HealthMetrics } from "@/components/admin/HealthRadarChart";
import type { FlowLink } from "@/components/admin/DepartmentFlowChart";
import type { CourseStat } from "@/components/admin/CourseBarChart";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_ORDER = ["Excellent", "Good", "Average", "Poor"];

export function useAdminData() {
  const [stats, setStats] = useState({ students: 0, courses: 0 });
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    avgCa: 0,
    avgExam: 0,
    avgAttendance: 0,
    passRate: 0,
  });
  const [avgScore, setAvgScore] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [flowLinks, setFlowLinks] = useState<FlowLink[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    const { count: courseCount } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    setStats({ students: studentCount ?? 0, courses: courseCount ?? 0 });

    const { data: fullAssessments } = await supabase
      .from("assessments")
      .select(
        "category, total_score, ca_score, exam_score, attendance_percent, enrollment:enrollments(student:profiles(full_name, department, identifier), course:courses(code, title))"
      );

    const graded = ((fullAssessments ?? []) as any[]).filter((a: any) => a.category);
    setAtRisk(graded.filter((a: any) => a.category === "Poor"));

    const counts: Record<string, number> = {};
    for (const c of CATEGORY_ORDER) counts[c] = 0;
    for (const a of graded) counts[a.category] = (counts[a.category] ?? 0) + 1;
    setCategoryCounts(counts);
    setGradedCount(graded.length);

    if (graded.length > 0) {
      const avgCa = (graded.reduce((s: number, a: any) => s + (a.ca_score ?? 0), 0) / graded.length / 30) * 100;
      const avgExam = (graded.reduce((s: number, a: any) => s + (a.exam_score ?? 0), 0) / graded.length / 70) * 100;
      const avgAttendance = graded.reduce((s: number, a: any) => s + (a.attendance_percent ?? 0), 0) / graded.length;
      const passRate =
        (graded.filter((a: any) => a.category === "Excellent" || a.category === "Good").length / graded.length) * 100;
      setHealthMetrics({ avgCa, avgExam, avgAttendance, passRate });

      const totalAvg = graded.reduce((s: number, a: any) => s + (a.total_score ?? 0), 0) / graded.length;
      setAvgScore(totalAvg);
    } else {
      setHealthMetrics({ avgCa: 0, avgExam: 0, avgAttendance: 0, passRate: 0 });
      setAvgScore(0);
    }

    const flowMap: Record<string, number> = {};
    for (const a of graded) {
      const dept = a.enrollment?.student?.department || "Unassigned";
      const key = `${dept}__${a.category}`;
      flowMap[key] = (flowMap[key] ?? 0) + 1;
    }
    setFlowLinks(
      Object.entries(flowMap).map(([key, count]) => {
        const [dept, category] = key.split("__");
        return { department: dept, category, count };
      })
    );

    const { data: allEnrollments } = await supabase.from("enrollments").select("course:courses(code, title)");

    const enrolledCounts: Record<string, number> = {};
    for (const e of allEnrollments ?? []) {
      const code = (e as any).course?.code;
      if (!code) continue;
      enrolledCounts[code] = (enrolledCounts[code] ?? 0) + 1;
    }

    const scoreSums: Record<string, { sum: number; n: number }> = {};
    for (const a of graded) {
      const code = a.enrollment?.course?.code;
      if (!code) continue;
      if (!scoreSums[code]) scoreSums[code] = { sum: 0, n: 0 };
      scoreSums[code].sum += a.total_score ?? 0;
      scoreSums[code].n += 1;
    }

    const codes = Array.from(new Set([...Object.keys(enrolledCounts), ...Object.keys(scoreSums)]));
    setCourseStats(
      codes.map((code) => ({
        code,
        enrolled: enrolledCounts[code] ?? 0,
        avgScore: scoreSums[code] ? Math.round(scoreSums[code].sum / scoreSums[code].n) : null,
      }))
    );

    const { data: courseList } = await supabase.from("courses").select("*");
    setCourses(courseList ?? []);

    const { data: studentList } = await supabase.from("profiles").select("*").eq("role", "student");
    setStudents(studentList ?? []);

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    atRisk,
    categoryCounts,
    healthMetrics,
    avgScore,
    gradedCount,
    flowLinks,
    courseStats,
    courses,
    students,
    loading,
    refresh,
  };
}