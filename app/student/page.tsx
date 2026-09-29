"use client";

import { useState } from "react";
import { useStudentDataContext } from "@/lib/student-data-context";
import { classify, toGradeLetter, CATEGORY_TONE } from "@/lib/grading";

function ProgressBar({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-navySoft">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function StudentDashboardPage() {
  const {
    name, identifier, department, results, recommendations, totalCreditUnits, gpa,
    gradedResults, gpaPct, degreeClass, poorCourses, riskLevel, riskTone,
    strongest, needsAttention, avgAttendance, totalCredits, loading,
  } = useStudentDataContext();

  const [openWhy, setOpenWhy] = useState<Record<string, boolean>>({});
  const [openWhatIf, setOpenWhatIf] = useState<Record<string, boolean>>({});
  const [whatIfValues, setWhatIfValues] = useState<Record<string, { ca: number; exam: number; attendance: number }>>({});

  function toggleWhy(courseId: string) {
    setOpenWhy((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  }

  function toggleWhatIf(courseId: string) {
    setOpenWhatIf((prev) => {
      const next = { ...prev, [courseId]: !prev[courseId] };
      if (next[courseId] && !whatIfValues[courseId]) {
        const r = results.find((x) => x.courseId === courseId);
        if (r) setWhatIfValues((wi) => ({ ...wi, [courseId]: { ca: r.ca, exam: r.exam, attendance: r.attendance } }));
      }
      return next;
    });
  }

  function updateWhatIf(courseId: string, field: "ca" | "exam" | "attendance", value: number) {
    setWhatIfValues((prev) => ({ ...prev, [courseId]: { ...prev[courseId], [field]: value } }));
  }

  if (loading) return <p className="text-sm text-brand-muted">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold text-brand-text">Welcome, {name}</h1>
            {gradedResults.length > 0 && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskTone.bg} ${riskTone.text}`}>
                {poorCourses.length === 0 ? "Good Standing" : "Active Monitoring"}
              </span>
            )}
          </div>
          {(identifier || department) && (
            <p className="mt-1 text-sm text-brand-muted">
              {identifier}
              {identifier && department ? " · " : ""}
              {department}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-border bg-brand-navyLight p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">Current CGPA</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-brand-text">
            {gpa} <span className="text-sm font-normal text-brand-muted">/ 5.00</span>
          </div>
          {gradedResults.length > 0 && (
            <>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-navySoft">
                <div className="h-full rounded-full bg-good" style={{ width: `${gpaPct}%` }} />
              </div>
              <div className="mt-1 text-xs text-brand-muted">{degreeClass}</div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-navyLight p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">Risk Assessment</div>
          <div className={`mt-1 font-serif text-2xl font-semibold ${riskTone.text}`}>
            {poorCourses.length} Course{poorCourses.length === 1 ? "" : "s"}
          </div>
          <div className="mt-1 text-xs text-brand-muted">
            {poorCourses.length === 0 ? "No intervention needed" : `${riskLevel} — needs intervention`}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-navyLight p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">Overall Attendance</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-brand-text">{avgAttendance.toFixed(0)}%</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-navySoft">
            <div
              className={`h-full rounded-full ${avgAttendance < 75 ? "bg-average" : "bg-good"}`}
              style={{ width: `${Math.min(100, avgAttendance)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-brand-muted">{results.length} Enrolled</div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-navyLight p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">Subject Overview</div>
          {strongest && needsAttention ? (
            <div className="mt-1 space-y-0.5 text-sm">
              <div className="text-good">Strongest: {strongest.code}</div>
              <div className="text-poor">Needs Attention: {needsAttention.code}</div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-brand-muted">No graded courses yet</div>
          )}
          <div className="mt-1 text-xs text-brand-muted">
            {totalCredits} Credit Unit{totalCredits === 1 ? "" : "s"} · {results.length} Subject{results.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <h2 className="mb-3 font-serif text-lg font-semibold text-brand-text">Your Enrolled Courses</h2>
      <div className="flex flex-col gap-4">
        {results.map((r, i) => {
          const rec = recommendations[r.courseId];
          const isWhyOpen = openWhy[r.courseId];
          const isWhatIfOpen = openWhatIf[r.courseId];
          const wi = whatIfValues[r.courseId] ?? { ca: r.ca, exam: r.exam, attendance: r.attendance };

          const projectedTotal = wi.ca + wi.exam;
          const projectedCategory = classify(projectedTotal);

          const projectedGradedResults = gradedResults.map((g) =>
            g.courseId === r.courseId ? { ...g, total: projectedTotal } : g
          );
          // Recompute using the same credit-weighted formula as the hook
          const totalQP = projectedGradedResults.reduce((sum, g) => {
            const gp =
              g.total >= 70 ? 5 : g.total >= 60 ? 4 : g.total >= 50 ? 3 : g.total >= 45 ? 2 : g.total >= 40 ? 1 : 0;
            return sum + gp * g.creditUnit;
          }, 0);
          const projectedGpa = totalCreditUnits > 0 ? (totalQP / totalCreditUnits).toFixed(2) : "N/A";

          const tone = r.category ? CATEGORY_TONE[r.category] : CATEGORY_TONE.Average;
          const lowAttendance = r.category !== null && r.attendance < 75;

          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-brand-border bg-brand-navyLight">
              <div className="flex flex-wrap items-start justify-between gap-2 p-5 pb-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{r.code}</div>
                  <div className="font-serif text-lg font-semibold text-brand-text">{r.title}</div>
                </div>
                {r.category && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`}>
                    Category: {r.category}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 px-5 pb-4 sm:grid-cols-4">
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-brand-muted">
                    <span>CA Score</span>
                    <span className="font-semibold text-brand-text">{r.ca}/30</span>
                  </div>
                  <ProgressBar value={r.ca} max={30} tone={tone.bar} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-brand-muted">
                    <span>Examination</span>
                    <span className="font-semibold text-brand-text">{r.exam}/70</span>
                  </div>
                  <ProgressBar value={r.exam} max={70} tone={tone.bar} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-brand-muted">
                    <span>Attendance</span>
                    <span className="font-semibold text-brand-text">{r.attendance}%</span>
                  </div>
                  <ProgressBar value={r.attendance} max={100} tone={tone.bar} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-brand-muted">
                    <span>Total {r.category && `· Grade ${toGradeLetter(r.total)}`}</span>
                    <span className="font-semibold text-brand-text">{r.total}/100</span>
                  </div>
                  <ProgressBar value={r.total} max={100} tone={tone.bar} />
                </div>
              </div>

              {lowAttendance && (
                <div className="mx-5 mb-4 flex items-center justify-between rounded-lg bg-poor/15 px-3 py-2 text-xs text-poor">
                  <span>Attendance is below the recommended 75% threshold.</span>
                  <span className="font-semibold uppercase tracking-wide">Action needed</span>
                </div>
              )}

              {rec && (
                <div className="mx-5 mb-4 rounded-lg border border-brand-border bg-brand-navySoft p-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                    {r.category === "Poor" ? "Recommended Academic Remediation" : "Prescriptive Academic Guidance"}
                  </div>
                  <p className="text-sm text-brand-text">{rec.message}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 px-5 pb-5">
                {rec && (
                  <button
                    onClick={() => toggleWhy(r.courseId)}
                    className="rounded-full border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-text transition-colors hover:border-brand-teal"
                  >
                    {isWhyOpen ? "Hide reason" : "Why was I given this?"}
                  </button>
                )}
                <button
                  onClick={() => toggleWhatIf(r.courseId)}
                  className="rounded-full border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-text transition-colors hover:border-brand-teal"
                >
                  {isWhatIfOpen ? "Hide What-If Simulator" : "What if I scored differently?"}
                </button>
              </div>

              {isWhyOpen && rec && <p className="mx-5 mb-4 text-sm italic text-brand-muted">{rec.reason}</p>}

              {isWhatIfOpen && (
                <div className="mx-5 mb-5 rounded-lg border border-brand-border bg-brand-navySoft p-4">
                  <label className="mb-1 block text-xs text-brand-muted">CA: {wi.ca}/30</label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={wi.ca}
                    onChange={(e) => updateWhatIf(r.courseId, "ca", Number(e.target.value))}
                    className="w-full accent-brand-teal"
                  />

                  <label className="mb-1 mt-3 block text-xs text-brand-muted">Exam: {wi.exam}/70</label>
                  <input
                    type="range"
                    min={0}
                    max={70}
                    value={wi.exam}
                    onChange={(e) => updateWhatIf(r.courseId, "exam", Number(e.target.value))}
                    className="w-full accent-brand-teal"
                  />

                  <label className="mb-1 mt-3 block text-xs text-brand-muted">Attendance: {wi.attendance}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={wi.attendance}
                    onChange={(e) => updateWhatIf(r.courseId, "attendance", Number(e.target.value))}
                    className="w-full accent-brand-teal"
                  />

                  <div className="mt-4 rounded-lg bg-brand-navy p-3 text-sm">
                    <p className="text-brand-text">
                      Projected total: <strong>{projectedTotal}/100</strong> — Category:{" "}
                      <strong>{projectedCategory}</strong>
                    </p>
                    <p className="mt-1 text-brand-text">
                      Projected overall GPA: <strong>{projectedGpa}</strong>{" "}
                      <span className="text-xs text-brand-muted">(currently {gpa})</span>
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-brand-muted">
                    This is a hypothetical projection using the same evaluation formulas as your real results. It
                    does not change your actual saved scores.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}