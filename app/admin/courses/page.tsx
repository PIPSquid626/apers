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

export default function CoursesPage() {
  const { courses, loading, refresh } = useAdminData();

  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseSemester, setCourseSemester] = useState("First");
  const [courseMessage, setCourseMessage] = useState("");

  async function handleAddCourse(e: React.FormEvent) {
    e.preventDefault();
    setCourseMessage("");

    const { error } = await supabase.from("courses").insert({
      code: courseCode,
      title: courseTitle,
      semester: courseSemester,
    });

    if (error) {
      setCourseMessage(`Error: ${error.message}`);
      return;
    }

    setCourseMessage("Course added!");
    setCourseCode("");
    setCourseTitle("");
    refresh();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--admin-text)]">Courses</h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">Add new courses and view everything currently offered.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add Course</CardTitle>
          <CardDescription>Creates a new row in the courses table</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCourse} className="flex max-w-md flex-col gap-3">
            <label className={labelClass}>Course code (e.g. CSC410)</label>
            <input className={inputClass} type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required />
            <label className={labelClass}>Course title</label>
            <input className={inputClass} type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required />
            <label className={labelClass}>Semester</label>
            <select className={inputClass} value={courseSemester} onChange={(e) => setCourseSemester(e.target.value)}>
              <option value="First">First</option>
              <option value="Second">Second</option>
            </select>
            <button className={buttonClass} type="submit">Add Course</button>
            {courseMessage && <p className="text-xs text-[var(--admin-muted)]">{courseMessage}</p>}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>{loading ? "Loading…" : `${courses.length} course(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No courses yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--admin-border)]">
              {courses.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-[var(--admin-text)]">
                    {c.code}
                    <span className="ml-2 text-[var(--admin-muted)]">{c.title}</span>
                  </span>
                  <span className="text-[var(--admin-muted)]">{c.semester} · {c.credit_unit} units</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}