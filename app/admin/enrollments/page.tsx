"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAdminData } from "@/lib/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const inputClass =
  "rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/20";
const buttonClass =
  "rounded-full bg-[var(--admin-accent)] px-5 py-2 text-xs font-bold uppercase tracking-wide text-[var(--admin-accent-contrast)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";
const labelClass = "text-xs text-[var(--admin-muted)]";

export default function EnrollmentsPage() {
  const { students, courses, courseStats, loading, refresh } = useAdminData();

  const [enrollStudent, setEnrollStudent] = useState("");
  const [enrollCourse, setEnrollCourse] = useState("");
  const [enrollMessage, setEnrollMessage] = useState("");

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setEnrollMessage("");

    const { error } = await supabase.from("enrollments").insert({
      student_id: enrollStudent,
      course_id: enrollCourse,
    });

    if (error) {
      setEnrollMessage(`Error: ${error.message}`);
      return;
    }

    setEnrollMessage("Enrolled successfully!");
    setEnrollStudent("");
    setEnrollCourse("");
    refresh();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--admin-text)]">Enrollments</h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">Enroll a student into a course, and see enrollment counts per course.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Enroll a Student</CardTitle>
          <CardDescription>Links one student to one course</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEnroll} className="flex max-w-md flex-col gap-3">
            <label className={labelClass}>Student</label>
            <select className={inputClass} value={enrollStudent} onChange={(e) => setEnrollStudent(e.target.value)} required>
              <option value="">Select a student</option>
              {students.map((s: any) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.identifier})</option>
              ))}
            </select>
            <label className={labelClass}>Course</label>
            <select className={inputClass} value={enrollCourse} onChange={(e) => setEnrollCourse(e.target.value)} required>
              <option value="">Select a course</option>
              {courses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
            <button className={buttonClass} type="submit">Enroll</button>
            {enrollMessage && <p className="text-xs text-[var(--admin-muted)]">{enrollMessage}</p>}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Enrollment Counts</CardTitle>
          <CardDescription>{loading ? "Loading…" : `Across ${courseStats.length} course(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          {courseStats.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No enrollments yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--admin-border)]">
              {courseStats.map((c) => (
                <div key={c.code} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--admin-text)]">{c.code}</span>
                  <span className="text-[var(--admin-muted)]">{c.enrolled} enrolled</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}