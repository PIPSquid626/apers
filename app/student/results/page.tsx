"use client";

import { FileDown, BarChart3 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useStudentDataContext } from "@/lib/student-data-context";
import { toGradeLetter, CATEGORY_TONE, CATEGORY_ORDER } from "@/lib/grading";
import { generateStudentReportPdf } from "@/lib/generateStudentReport";

export default function StudentResultsPage() {
  const {
    name, identifier, department, results, recommendations,
    gpa, gpaNum, totalCreditUnits, strengths, weaknesses, categoryCounts, loading,
  } = useStudentDataContext();

  const total = CATEGORY_ORDER.reduce((s, c) => s + (categoryCounts[c] ?? 0), 0);
  const chartData = CATEGORY_ORDER.filter((c) => categoryCounts[c] > 0).map((c) => ({
    name: c,
    value: categoryCounts[c],
  }));

  function handleDownload() {
    generateStudentReportPdf({ name, identifier, department, gpa, gpaNum, totalCreditUnits, strengths, weaknesses, results, recommendations });
  }

  if (loading) return <p className="text-sm text-ink/60">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Results</h1>
          <p className="mt-1 text-sm text-ink/60">Your full academic record for this session.</p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
        >
          <FileDown size={15} /> Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-hairline bg-white p-5">
          <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Course Results</h2>
          {results.length === 0 ? (
            <p className="text-sm text-ink/50">No courses on record yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-ink/40">
                    <th className="pb-2 pr-4 font-medium">Course</th>
                    <th className="pb-2 pr-4 font-medium">CA</th>
                    <th className="pb-2 pr-4 font-medium">Exam</th>
                    <th className="pb-2 pr-4 font-medium">Attendance</th>
                    <th className="pb-2 pr-4 font-medium">Total</th>
                    <th className="pb-2 font-medium">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const tone = r.category ? CATEGORY_TONE[r.category] : null;
                    return (
                      <tr key={r.courseId} className="border-t border-hairline">
                        <td className="py-2.5 pr-4">
                          <div className="font-medium text-ink">{r.code}</div>
                          <div className="text-xs text-ink/50">{r.title}</div>
                        </td>
                        <td className="py-2.5 pr-4 text-ink">{r.ca}/30</td>
                        <td className="py-2.5 pr-4 text-ink">{r.exam}/70</td>
                        <td className="py-2.5 pr-4 text-ink">{r.attendance}%</td>
                        <td className="py-2.5 pr-4 font-serif text-ink">
                          {r.total}/100{" "}
                          {r.category && <span className="text-xs text-ink/40">({toGradeLetter(r.total)})</span>}
                        </td>
                        <td className="py-2.5">
                          {tone ? (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`}>
                              {r.category}
                            </span>
                          ) : (
                            <span className="text-xs text-ink/40">Not yet graded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-hairline bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={18} className="text-ink" />
            <h2 className="font-serif text-lg font-semibold text-ink">Performance Breakdown</h2>
          </div>
          {total === 0 ? (
            <p className="py-10 text-center text-sm text-ink/50">No graded assessments yet.</p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-[160px] w-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={3}
                      cornerRadius={4}
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_TONE[entry.name].hex} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #DADAD5", borderRadius: 8, fontSize: 12, color: "#14213D" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex w-full flex-col gap-2">
                {chartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink/60">
                      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: CATEGORY_TONE[d.name].hex }} />
                      {d.name}
                    </span>
                    <span className="font-mono font-medium text-ink">
                      {d.value} · {Math.round((d.value / total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}