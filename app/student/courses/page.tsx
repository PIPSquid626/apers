"use client";

import { useState } from "react";
import { ClipboardList, BookOpen } from "lucide-react";
import { useStudentDataContext } from "@/lib/student-data-context";

export default function StudentCoursesPage() {
  const { results, availableCourses, registerCourse, loading } = useStudentDataContext();
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setMessage("");
    const error = await registerCourse(selected);
    setSubmitting(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }
    setMessage("Registered successfully!");
    setSelected("");
  }

  if (loading) return <p className="text-sm text-ink/60">Loading…</p>;

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-ink">Course Registration</h1>
      <p className="mt-1 text-sm text-ink/60">Register for available courses and review what you're currently enrolled in.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-hairline bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-ink" />
            <h2 className="font-serif text-lg font-semibold text-ink">Register a New Course</h2>
          </div>
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required
              className="rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">Select a course</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title} ({c.semester})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="w-fit rounded-lg bg-ink px-5 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Registering…" : "Register"}
            </button>
            {message && <p className="text-sm text-ink/60">{message}</p>}
            {availableCourses.length === 0 && (
              <p className="text-sm text-ink/50">You're already registered for all available courses.</p>
            )}
          </form>
        </div>

        <div className="rounded-2xl border border-hairline bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-ink" />
            <h2 className="font-serif text-lg font-semibold text-ink">Currently Registered ({results.length})</h2>
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-ink/50">You're not registered for any courses yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-hairline">
              {results.map((r) => (
                <div key={r.courseId} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-ink">{r.code}</span>
                    <span className="ml-2 text-ink/60">{r.title}</span>
                  </div>
                  <span className="text-xs text-ink/40">
                    {r.creditUnit} unit{r.creditUnit === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}