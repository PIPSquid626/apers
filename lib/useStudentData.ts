"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { toGradePoint, classOfDegree, CATEGORY_TONE, CATEGORY_ORDER } from "@/lib/grading";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type StudentResult = {
  courseId: string;
  code: string;
  title: string;
  creditUnit: number;
  ca: number;
  exam: number;
  attendance: number;
  total: number;
  category: string | null;
};

export function useStudentData() {
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [department, setDepartment] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, { message: string; reason: string }>>({});
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setStudentId(auth.user.id);
    setEmail(auth.user.email ?? "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, identifier, department")
      .eq("id", auth.user.id)
      .single();
    setName(profile?.full_name ?? "");
    setIdentifier(profile?.identifier ?? "");
    setDepartment(profile?.department ?? "");

    const { data } = await supabase
      .from("enrollments")
      .select("course:courses(id, code, title, credit_unit), assessment:assessments(*)")
      .eq("student_id", auth.user.id);

    const enrolledCourseIds = (data ?? []).map((e: any) => e.course.id);

    const mappedResults: StudentResult[] = (data ?? []).map((e: any) => ({
      courseId: e.course.id,
      code: e.course.code,
      title: e.course.title,
      creditUnit: e.course.credit_unit ?? 3,
      ca: e.assessment?.ca_score ?? 0,
      exam: e.assessment?.exam_score ?? 0,
      attendance: e.assessment?.attendance_percent ?? 0,
      total: e.assessment?.total_score ?? 0,
      category: e.assessment?.category ?? null,
    }));
    setResults(mappedResults);

    const { data: allCourses } = await supabase.from("courses").select("*");
    const notEnrolled = (allCourses ?? []).filter((c: any) => !enrolledCourseIds.includes(c.id));
    setAvailableCourses(notEnrolled);

    const { data: recs } = await supabase
      .from("recommendations")
      .select("course_id, message, reason")
      .eq("student_id", auth.user.id);

    const recMap: Record<string, { message: string; reason: string }> = {};
    (recs ?? []).forEach((r: any) => {
      recMap[r.course_id] = { message: r.message, reason: r.reason };
    });
    setRecommendations(recMap);

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Derived stats shared by every /student/* page ----
  const gradedResults = results.filter((r) => r.category !== null);
  const totalQualityPoints = gradedResults.reduce((sum, r) => sum + toGradePoint(r.total) * r.creditUnit, 0);
  const totalCreditUnits = gradedResults.reduce((sum, r) => sum + r.creditUnit, 0);
  const gpaNum = totalCreditUnits > 0 ? totalQualityPoints / totalCreditUnits : 0;
  const gpa = totalCreditUnits > 0 ? gpaNum.toFixed(2) : "N/A";
  const gpaPct = Math.min(100, (gpaNum / 5) * 100);
  const degreeClass = totalCreditUnits > 0 ? classOfDegree(gpaNum) : null;

  const average =
    gradedResults.length > 0 ? gradedResults.reduce((sum, r) => sum + r.total, 0) / gradedResults.length : 0;
  const strengths = gradedResults.filter((r) => r.total >= average && r.total >= 60);
  const weaknesses = gradedResults.filter((r) => r.total < average || r.total < 50);

  const poorCourses = gradedResults.filter((r) => r.category === "Poor");
  const riskLevel = poorCourses.length === 0 ? "Low Risk" : poorCourses.length === 1 ? "Moderate Risk" : "High Risk";
  const riskTone =
    poorCourses.length === 0 ? CATEGORY_TONE.Good : poorCourses.length === 1 ? CATEGORY_TONE.Average : CATEGORY_TONE.Poor;

  const strongest = gradedResults.length > 0 ? gradedResults.reduce((a, b) => (b.total > a.total ? b : a)) : null;
  const needsAttention = gradedResults.length > 0 ? gradedResults.reduce((a, b) => (b.total < a.total ? b : a)) : null;

  const avgAttendance = results.length > 0 ? results.reduce((sum, r) => sum + r.attendance, 0) / results.length : 0;
  const totalCredits = results.reduce((sum, r) => sum + r.creditUnit, 0);

  const categoryCounts: Record<string, number> = {};
  for (const c of CATEGORY_ORDER) categoryCounts[c] = 0;
  for (const r of gradedResults) categoryCounts[r.category as string] = (categoryCounts[r.category as string] ?? 0) + 1;

  async function registerCourse(courseId: string) {
    const { error } = await supabase.from("enrollments").insert({ student_id: studentId, course_id: courseId });
    if (!error) await refresh();
    return error;
  }

  async function updateFullName(newName: string) {
    const { error } = await supabase.from("profiles").update({ full_name: newName }).eq("id", studentId);
    if (!error) await refresh();
    return error;
  }

  return {
    studentId, name, email, identifier, department,
    results, recommendations, availableCourses, loading, refresh,
    gradedResults, gpa, gpaNum, gpaPct, degreeClass, totalCreditUnits,
    strengths, weaknesses, poorCourses, riskLevel, riskTone,
    strongest, needsAttention, avgAttendance, totalCredits, categoryCounts,
    registerCourse, updateFullName,
  };
}