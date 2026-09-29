"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts";
import Nav from "@/components/Nav";
import { classify, toGradeLetter, CATEGORY_TONE, CATEGORY_ORDER } from "@/lib/grading";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Course = { id: string; code: string; title: string; semester: string; credit_unit: number | null };

type Row = {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  identifier: string;
  department: string;
  ca: string;
  exam: string;
  attendance: string;
  saved: { ca: number; exam: number; attendance: number; total: number; category: string | null } | null;
  saving: boolean;
  message: string;
};

type Issue = { factor: string; severity: "critical" | "moderate"; detail: string; advice: string };

// Builds a combined, explainable, course-specific recommendation from multiple rule checks.
// Deliberately rule-based (if-else), not AI-generated — matches the paperwork's Scope (§1.5),
// and keeps every recommendation traceable to a specific, statable rule for the "Why?" feature.
function buildRecommendation(
  ca: number,
  exam: number,
  attendance: number,
  courseTitle: string,
  studentAverage: number,
  courseTotal: number
) {
  const examPercent = (exam / 70) * 100;
  const caPercent = (ca / 30) * 100;

  const issues: Issue[] = [];

  if (examPercent < 30) {
    issues.push({
      factor: "Examination",
      severity: "critical",
      detail: `Examination score was ${exam}/70 (${examPercent.toFixed(0)}%) — critically low`,
      advice: `Book urgent one-on-one help from your ${courseTitle} lecturer and rebuild your understanding from the earliest topics in the course outline`,
    });
  } else if (examPercent < 50) {
    issues.push({
      factor: "Examination",
      severity: "moderate",
      detail: `Examination score was ${exam}/70 (${examPercent.toFixed(0)}%), below the 50% threshold`,
      advice: `Revise the core ${courseTitle} topics and work through past examination questions for this course specifically`,
    });
  }

  if (caPercent < 30) {
    issues.push({
      factor: "Continuous Assessment",
      severity: "critical",
      detail: `CA score was ${ca}/30 (${caPercent.toFixed(0)}%) — critically low`,
      advice: `Complete every outstanding ${courseTitle} assignment or quiz immediately, since low CA usually signals gaps in ongoing coursework, not just exam prep`,
    });
  } else if (caPercent < 50) {
    issues.push({
      factor: "Continuous Assessment",
      severity: "moderate",
      detail: `CA score was ${ca}/30 (${caPercent.toFixed(0)}%), below the 50% threshold`,
      advice: `Go through your ${courseTitle} assignments and quizzes again, and ask your lecturer about any recurring mistakes`,
    });
  }

  if (attendance < 50) {
    issues.push({
      factor: "Attendance",
      severity: "critical",
      detail: `Attendance was ${attendance}% — critically low`,
      advice: `Your ${courseTitle} attendance is the most urgent issue here — missing more than half the classes directly explains your other low scores in this course`,
    });
  } else if (attendance < 75) {
    issues.push({
      factor: "Attendance",
      severity: "moderate",
      detail: `Attendance was ${attendance}%, below the recommended 75%`,
      advice: `Attend more ${courseTitle} lectures going forward — this course's material builds week-on-week, so missed classes compound quickly`,
    });
  }

  const gapFromOwnAverage = studentAverage - courseTotal;
  const isRelativeWeakness = gapFromOwnAverage > 10;

  if (issues.length === 0) {
    return {
      message: `1. Explore advanced ${courseTitle} material beyond the syllabus. 2. Consider mentoring classmates who are struggling with this course.`,
      reason: `All factors met or exceeded expected thresholds (CA ${ca}/30, Exam ${exam}/70, Attendance ${attendance}%).`,
    };
  }

  issues.sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1));

  const message = issues.map((issue, i) => `${i + 1}. ${issue.advice}.`).join(" ");

  let reason = `In ${courseTitle}: ` + issues.map((i) => i.detail).join("; ") + ".";
  if (isRelativeWeakness) {
    reason += ` This is also notably weaker than your average performance across your other courses (${studentAverage.toFixed(0)}% vs ${courseTotal}% here), so addressing it should be a priority.`;
  }

  return { message, reason };
}

const CA_MAX = 30;
const EXAM_MAX = 70;

const cardStyle: React.CSSProperties = {
  background: "var(--admin-surface, #0f1c2b)",
  border: "1px solid var(--admin-border, #1e3a52)",
  borderRadius: 16,
  padding: 20,
};
const mutedStyle: React.CSSProperties = { color: "var(--admin-muted, #b7c5d3)", fontSize: 13 };
const inputStyle: React.CSSProperties = {
  width: 72,
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid var(--admin-border, #1e3a52)",
  background: "var(--admin-surface-soft, #14263a)",
  color: "var(--admin-text, #eafcff)",
  fontSize: 13,
};

export default function LecturerPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [lecturerId, setLecturerId] = useState("");
  const [lecturerName, setLecturerName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", auth.user.id)
        .single();

      if (profile?.role !== "lecturer" && profile?.role !== "admin") {
        router.replace("/");
        return;
      }

      setLecturerId(auth.user.id);
      setLecturerName(profile?.full_name ?? "");

      const { data: courseList, error } = await supabase
        .from("courses")
        .select("id, code, title, semester, credit_unit")
        .eq("lecturer_id", auth.user.id)
        .order("code");

      if (error) setPageError(error.message);
      setCourses((courseList ?? []) as Course[]);
      if (courseList && courseList.length > 0) setActiveCourseId(courseList[0].id);
      setReady(true);
    }
    init();
  }, [router]);

  const loadRoster = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setLoadingRows(true);
    setPageError("");

    const { data, error } = await supabase
      .from("enrollments")
      .select(
        "id, student:profiles(id, full_name, identifier, department), assessment:assessments(ca_score, exam_score, attendance_percent, total_score, category)"
      )
      .eq("course_id", courseId);

    if (error) {
      setPageError(error.message);
      setRows([]);
      setLoadingRows(false);
      return;
    }

    const mapped: Row[] = ((data ?? []) as any[])
      .map((e) => {
        const a = Array.isArray(e.assessment) ? e.assessment[0] : e.assessment;
        const storedTotal = a?.total_score ?? 0;
        return {
          enrollmentId: e.id,
          studentId: e.student?.id ?? "",
          studentName: e.student?.full_name ?? "Unknown",
          identifier: e.student?.identifier ?? "",
          department: e.student?.department ?? "",
          ca: a ? String(a.ca_score ?? "") : "",
          exam: a ? String(a.exam_score ?? "") : "",
          attendance: a ? String(a.attendance_percent ?? "") : "",
          saved: a
            ? {
                ca: a.ca_score ?? 0,
                exam: a.exam_score ?? 0,
                attendance: a.attendance_percent ?? 0,
                total: storedTotal,
                // Always derive the category from the total, so a stale value in the
                // database can never show the wrong grade on screen.
                category: a.total_score != null ? classify(storedTotal) : a.category ?? null,
              }
            : null,
          saving: false,
          message: "",
        };
      })
      .sort((x, y) => x.studentName.localeCompare(y.studentName));

    setRows(mapped);
    setLoadingRows(false);
  }, []);

  useEffect(() => {
    if (activeCourseId) loadRoster(activeCourseId);
  }, [activeCourseId, loadRoster]);

  function updateRow(enrollmentId: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, ...patch } : r)));
  }

  // Calculates the student's average total score across ALL their other graded courses
  async function getStudentAverage(studentId: string, excludingCourseId: string) {
    const { data } = await supabase
      .from("enrollments")
      .select("course_id, assessment:assessments(total_score, category)")
      .eq("student_id", studentId);

    const others = (data ?? []).filter(
      (e: any) =>
        e.course_id !== excludingCourseId &&
        (Array.isArray(e.assessment) ? e.assessment[0] : e.assessment)?.category
    );

    if (others.length === 0) return 0;

    const sum = others.reduce((acc: number, e: any) => {
      const a = Array.isArray(e.assessment) ? e.assessment[0] : e.assessment;
      return acc + (a?.total_score ?? 0);
    }, 0);
    return sum / others.length;
  }

  async function saveRow(row: Row) {
    const ca = Number(row.ca);
    const exam = Number(row.exam);
    const attendance = Number(row.attendance);

    if (row.ca === "" || row.exam === "" || row.attendance === "") {
      updateRow(row.enrollmentId, { message: "Fill in CA, exam and attendance." });
      return;
    }
    if ([ca, exam, attendance].some((n) => Number.isNaN(n))) {
      updateRow(row.enrollmentId, { message: "Scores must be numbers." });
      return;
    }
    if (ca < 0 || ca > CA_MAX) {
      updateRow(row.enrollmentId, { message: `CA must be between 0 and ${CA_MAX}.` });
      return;
    }
    if (exam < 0 || exam > EXAM_MAX) {
      updateRow(row.enrollmentId, { message: `Exam must be between 0 and ${EXAM_MAX}.` });
      return;
    }
    if (attendance < 0 || attendance > 100) {
      updateRow(row.enrollmentId, { message: "Attendance must be between 0 and 100." });
      return;
    }

    updateRow(row.enrollmentId, { saving: true, message: "" });

    // total_score is a DB-generated column on `assessments` — Postgres computes it
    // itself, so it must never be sent in the upsert payload. We select it back instead.
    const { data: savedRow, error } = await supabase
      .from("assessments")
      .upsert(
        {
          enrollment_id: row.enrollmentId,
          ca_score: ca,
          exam_score: exam,
          attendance_percent: attendance,
        },
        { onConflict: "enrollment_id" }
      )
      .select("ca_score, exam_score, attendance_percent, total_score, category")
      .single();

    if (error) {
      updateRow(row.enrollmentId, { saving: false, message: error.message });
      return;
    }

    // FIX: always work the category out from the fresh total. Before, a stale
    // category already stored in the database (e.g. "Excellent" from an earlier
    // save) was kept when the scores were changed to low ones.
    const total = savedRow.total_score;
    const category = classify(total);

    // If the database copy of the category is out of date, correct it.
    if (savedRow.category !== category) {
      const { error: catError } = await supabase
        .from("assessments")
        .update({ category })
        .eq("enrollment_id", row.enrollmentId);

      if (catError) {
        updateRow(row.enrollmentId, {
          saving: false,
          message: `Saved, but category could not be updated: ${catError.message}`,
          saved: { ca, exam, attendance, total, category },
        });
        return;
      }
    }

    // Generate and store the explainable, course-specific recommendation for this result
    const course = courses.find((c) => c.id === activeCourseId);
    const studentAverage = await getStudentAverage(row.studentId, activeCourseId);
    const { message: recMessage, reason } = buildRecommendation(
      ca,
      exam,
      attendance,
      course?.title ?? "this course",
      studentAverage,
      total
    );

    await supabase
      .from("recommendations")
      .delete()
      .eq("student_id", row.studentId)
      .eq("course_id", activeCourseId);

    const { error: recError } = await supabase.from("recommendations").insert({
      student_id: row.studentId,
      course_id: activeCourseId,
      message: recMessage,
      reason,
    });

    updateRow(row.enrollmentId, {
      saving: false,
      // Scores are saved either way; only mention the recommendation if it actually failed,
      // so a lecturer isn't told "Saved" while silently missing student-facing advice.
      message: recError ? `Saved, but recommendation failed: ${recError.message}` : "Saved",
      saved: { ca, exam, attendance, total, category },
    });
  }

  const stats = useMemo(() => {
    const graded = rows.filter((r) => r.saved && r.saved.category);
    const counts: Record<string, number> = {};
    for (const c of CATEGORY_ORDER) counts[c] = 0;
    for (const r of graded) counts[r.saved!.category as string] += 1;

    const n = graded.length;
    const avg = n ? graded.reduce((s, r) => s + r.saved!.total, 0) / n : 0;
    const avgAttendance = n ? graded.reduce((s, r) => s + r.saved!.attendance, 0) / n : 0;
    const passRate = n ? ((counts.Excellent + counts.Good + counts.Average) / n) * 100 : 0;
    const atRisk = graded.filter((r) => r.saved!.category === "Poor");
    const pieData = CATEGORY_ORDER.map((cat) => ({ name: cat, value: counts[cat] })).filter((d) => d.value > 0);
    return { n, avg, avgAttendance, passRate, counts, atRisk, pieData };
  }, [rows]);

  const activeCourse = courses.find((c) => c.id === activeCourseId);

  if (!ready) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--admin-bg, #0a1420)" }}>
        <p style={mutedStyle}>Loading your dashboard…</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--admin-bg, #0a1420)", color: "var(--admin-text, #eafcff)" }}>
      <Nav userName={lecturerName} role="lecturer" />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, marginBottom: 4 }}>
          Welcome, {lecturerName || "Lecturer"}
        </h1>
        <p style={{ ...mutedStyle, marginBottom: 24 }}>
          Enter scores for your students and keep an eye on how each class is doing.
        </p>

        {pageError && (
          <p style={{ color: CATEGORY_TONE.Poor.hex, fontSize: 13, marginBottom: 16 }}>Error: {pageError}</p>
        )}

        {courses.length === 0 ? (
          <div style={cardStyle}>
            <p>No courses are assigned to you yet.</p>
            <p style={{ ...mutedStyle, marginTop: 6 }}>
              Ask an admin to set your account as the lecturer on your courses.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {courses.map((c) => {
                const active = c.id === activeCourseId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCourseId(c.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid var(--admin-accent, #0ef2e0)",
                      background: active ? "var(--admin-accent, #0ef2e0)" : "transparent",
                      color: active ? "var(--admin-accent-contrast, #0a1420)" : "var(--admin-accent, #0ef2e0)",
                    }}
                  >
                    {c.code}
                  </button>
                );
              })}
            </div>

            {activeCourse && (
              <p style={{ ...mutedStyle, marginBottom: 16 }}>
                {activeCourse.code} — {activeCourse.title} · {activeCourse.semester} semester
                {activeCourse.credit_unit ? ` · ${activeCourse.credit_unit} units` : ""}
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <StatBox label="Enrolled" value={String(rows.length)} />
              <StatBox label="Graded" value={`${stats.n} / ${rows.length}`} />
              <StatBox label="Class average" value={stats.n ? stats.avg.toFixed(1) : "—"} />
              <StatBox label="Avg attendance" value={stats.n ? `${stats.avgAttendance.toFixed(0)}%` : "—"} />
              <StatBox label="Pass rate" value={stats.n ? `${stats.passRate.toFixed(0)}%` : "—"} />
            </div>

            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <p style={{ fontWeight: 600, marginBottom: 12 }}>Performance breakdown</p>
              {stats.n === 0 ? (
                <p style={mutedStyle}>No scores entered yet for this course.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
                  {/* Bars — precise counts and percentages per category */}
                  <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {CATEGORY_ORDER.map((cat) => {
                      const count = stats.counts[cat];
                      const pct = (count / stats.n) * 100;
                      return (
                        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                          <span style={{ width: 80 }}>{cat}</span>
                          <div style={{ flex: 1, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.06)" }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                borderRadius: 999,
                                background: CATEGORY_TONE[cat].hex,
                              }}
                            />
                          </div>
                          <span style={{ width: 70, textAlign: "right", ...mutedStyle }}>
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pie — same data, at-a-glance shape of the whole class */}
                  <div style={{ flex: "0 0 200px", display: "flex", justifyContent: "center" }}>
                    <PieChart width={200} height={180}>
                      <Pie
                        data={stats.pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {stats.pieData.map((entry) => (
                          <Cell key={entry.name} fill={CATEGORY_TONE[entry.name].hex} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [`${value} student${value === 1 ? "" : "s"}`, name]}
                        contentStyle={{
                          background: "var(--admin-surface, #0f1c2b)",
                          border: "1px solid var(--admin-border, #1e3a52)",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "var(--admin-text, #eafcff)",
                        }}
                      />
                    </PieChart>
                  </div>
                </div>
              )}
              {stats.atRisk.length > 0 && (
                <p style={{ marginTop: 14, fontSize: 13, color: CATEGORY_TONE.Poor.hex }}>
                  Needs attention: {stats.atRisk.map((r) => r.studentName).join(", ")}
                </p>
              )}
            </div>

            <div style={cardStyle}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Class list &amp; scores</p>
              <p style={{ ...mutedStyle, marginBottom: 14 }}>
                CA is out of {CA_MAX}, exam out of {EXAM_MAX}. Total, category and a personalized
                recommendation are worked out for you automatically when you save.
              </p>

              {loadingRows ? (
                <p style={mutedStyle}>Loading students…</p>
              ) : rows.length === 0 ? (
                <p style={mutedStyle}>No students are enrolled in this course yet.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "var(--admin-muted, #b7c5d3)" }}>
                        <th style={th}>Student</th>
                        <th style={th}>CA /{CA_MAX}</th>
                        <th style={th}>Exam /{EXAM_MAX}</th>
                        <th style={th}>Attend. %</th>
                        <th style={th}>Total</th>
                        <th style={th}>Grade</th>
                        <th style={th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.enrollmentId} style={{ borderTop: "1px solid var(--admin-border, #1e3a52)" }}>
                          <td style={td}>
                            <div style={{ fontWeight: 600 }}>{r.studentName}</div>
                            <div style={mutedStyle}>
                              {r.identifier}
                              {r.department ? ` · ${r.department}` : ""}
                            </div>
                          </td>
                          <td style={td}>
                            <input
                              type="number"
                              min={0}
                              max={CA_MAX}
                              value={r.ca}
                              onChange={(e) => updateRow(r.enrollmentId, { ca: e.target.value, message: "" })}
                              style={inputStyle}
                            />
                          </td>
                          <td style={td}>
                            <input
                              type="number"
                              min={0}
                              max={EXAM_MAX}
                              value={r.exam}
                              onChange={(e) => updateRow(r.enrollmentId, { exam: e.target.value, message: "" })}
                              style={inputStyle}
                            />
                          </td>
                          <td style={td}>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={r.attendance}
                              onChange={(e) => updateRow(r.enrollmentId, { attendance: e.target.value, message: "" })}
                              style={inputStyle}
                            />
                          </td>
                          <td style={td}>{r.saved ? r.saved.total : "—"}</td>
                          <td style={td}>
                            {r.saved && r.saved.category ? (
                              <span style={{ color: CATEGORY_TONE[r.saved.category]?.hex, fontWeight: 700 }}>
                                {toGradeLetter(r.saved.total)} · {r.saved.category}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={td}>
                            <button
                              onClick={() => saveRow(r)}
                              disabled={r.saving}
                              style={{
                                padding: "6px 16px",
                                borderRadius: 999,
                                border: "none",
                                background: "var(--admin-accent, #0ef2e0)",
                                color: "var(--admin-accent-contrast, #0a1420)",
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.4,
                                cursor: r.saving ? "default" : "pointer",
                                opacity: r.saving ? 0.5 : 1,
                              }}
                            >
                              {r.saving ? "Saving…" : "Save"}
                            </button>
                            {r.message && (
                              <div
                                style={{
                                  ...mutedStyle,
                                  marginTop: 4,
                                  fontSize: 11,
                                  color: r.message === "Saved" ? CATEGORY_TONE.Good.hex : CATEGORY_TONE.Poor.hex,
                                }}
                              >
                                {r.message}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 10px", fontWeight: 500, fontSize: 12 };
const td: React.CSSProperties = { padding: "10px", verticalAlign: "middle" };

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={cardStyle}>
      <p style={{ ...mutedStyle, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Source Serif 4', serif" }}>{value}</p>
    </div>
  );
}