"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const inputClass =
  "rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/20";
const buttonClass =
  "rounded-full bg-[var(--admin-accent)] px-5 py-2 text-xs font-bold uppercase tracking-wide text-[var(--admin-accent-contrast)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";
const labelClass = "text-xs text-[var(--admin-muted)]";

type Props = {
  // Add student
  fullName: string; setFullName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  identifier: string; setIdentifier: (v: string) => void;
  department: string; setDepartment: (v: string) => void;
  submitting: boolean; formMessage: string;
  handleAddStudent: (e: React.FormEvent) => void;

  // Enroll
  students: any[]; courses: any[];
  enrollStudent: string; setEnrollStudent: (v: string) => void;
  enrollCourse: string; setEnrollCourse: (v: string) => void;
  enrollMessage: string;
  handleEnroll: (e: React.FormEvent) => void;

  // Add course
  courseCode: string; setCourseCode: (v: string) => void;
  courseTitle: string; setCourseTitle: (v: string) => void;
  courseSemester: string; setCourseSemester: (v: string) => void;
  courseMessage: string;
  handleAddCourse: (e: React.FormEvent) => void;

  // Optional: let a parent (the sidebar) control which tab is open.
  activeTab?: "student" | "enroll" | "course";
  onTabChange?: (tab: "student" | "enroll" | "course") => void;
};

export default function ManagementPanel(p: Props) {
  const [internalTab, setInternalTab] = useState<"student" | "enroll" | "course">("student");
  const tab = p.activeTab ?? internalTab;
  const setTab = p.onTabChange ?? setInternalTab;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Records</CardTitle>
        <CardDescription>Add students, enroll them in courses, and add new courses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex w-fit overflow-hidden rounded-full border border-[var(--admin-accent)]">
          {[
            { id: "student", label: "Add Student" },
            { id: "enroll", label: "Enroll" },
            { id: "course", label: "Add Course" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id ? "bg-[var(--admin-accent)] text-[var(--admin-accent-contrast)]" : "text-[var(--admin-accent)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "student" && (
          <form onSubmit={p.handleAddStudent} className="flex max-w-md flex-col gap-3">
            <label className={labelClass}>Full name</label>
            <input className={inputClass} type="text" value={p.fullName} onChange={(e) => p.setFullName(e.target.value)} required />
            <label className={labelClass}>Email</label>
            <input className={inputClass} type="email" value={p.email} onChange={(e) => p.setEmail(e.target.value)} required />
            <label className={labelClass}>Password</label>
            <input className={inputClass} type="password" value={p.password} onChange={(e) => p.setPassword(e.target.value)} required />
            <label className={labelClass}>Identifier (e.g. CSC/20/005)</label>
            <input className={inputClass} type="text" value={p.identifier} onChange={(e) => p.setIdentifier(e.target.value)} required />
            <label className={labelClass}>Department</label>
            <input className={inputClass} type="text" value={p.department} onChange={(e) => p.setDepartment(e.target.value)} />
            <button className={buttonClass} type="submit" disabled={p.submitting}>
              {p.submitting ? "Adding..." : "Add Student"}
            </button>
            {p.formMessage && <p className="text-xs text-[var(--admin-muted)]">{p.formMessage}</p>}
          </form>
        )}

        {tab === "enroll" && (
          <form onSubmit={p.handleEnroll} className="flex max-w-md flex-col gap-3">
            <label className={labelClass}>Student</label>
            <select className={inputClass} value={p.enrollStudent} onChange={(e) => p.setEnrollStudent(e.target.value)} required>
              <option value="">Select a student</option>
              {p.students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.identifier})</option>
              ))}
            </select>
            <label className={labelClass}>Course</label>
            <select className={inputClass} value={p.enrollCourse} onChange={(e) => p.setEnrollCourse(e.target.value)} required>
              <option value="">Select a course</option>
              {p.courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
            <button className={buttonClass} type="submit">Enroll</button>
            {p.enrollMessage && <p className="text-xs text-[var(--admin-muted)]">{p.enrollMessage}</p>}
          </form>
        )}

        {tab === "course" && (
          <form onSubmit={p.handleAddCourse} className="flex max-w-md flex-col gap-3">
            <label className={labelClass}>Course code (e.g. CSC410)</label>
            <input className={inputClass} type="text" value={p.courseCode} onChange={(e) => p.setCourseCode(e.target.value)} required />
            <label className={labelClass}>Course title</label>
            <input className={inputClass} type="text" value={p.courseTitle} onChange={(e) => p.setCourseTitle(e.target.value)} required />
            <label className={labelClass}>Semester</label>
            <select className={inputClass} value={p.courseSemester} onChange={(e) => p.setCourseSemester(e.target.value)}>
              <option value="First">First</option>
              <option value="Second">Second</option>
            </select>
            <button className={buttonClass} type="submit">Add Course</button>
            {p.courseMessage && <p className="text-xs text-[var(--admin-muted)]">{p.courseMessage}</p>}
          </form>
        )}
      </CardContent>
    </Card>
  );
}