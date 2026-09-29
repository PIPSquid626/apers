import jsPDF from "jspdf";
import { toGradeLetter } from "@/lib/grading";
import type { StudentResult } from "@/lib/useStudentData";

const RGB = {
  ink: [20, 33, 61] as [number, number, number],
  excellent: [184, 134, 11] as [number, number, number],
  good: [44, 95, 138] as [number, number, number],
  average: [193, 121, 60] as [number, number, number],
  poor: [166, 67, 45] as [number, number, number],
  hairline: [218, 218, 213] as [number, number, number],
  paper: [247, 247, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  muted: [110, 110, 110] as [number, number, number],
};

function toneFor(category: string | null): [number, number, number] {
  if (category === "Excellent") return RGB.excellent;
  if (category === "Good") return RGB.good;
  if (category === "Average") return RGB.average;
  if (category === "Poor") return RGB.poor;
  return RGB.muted;
}

export function generateStudentReportPdf(input: {
  name: string;
  identifier: string;
  department: string;
  gpa: string;
  gpaNum: number;
  totalCreditUnits: number;
  strengths: StudentResult[];
  weaknesses: StudentResult[];
  results: StudentResult[];
  recommendations: Record<string, { message: string; reason: string }>;
}) {
  const { name, identifier, department, gpa, gpaNum, totalCreditUnits, strengths, weaknesses, results, recommendations } =
    input;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  function newPage() {
    doc.addPage();
    y = margin;
  }

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - 20) newPage();
  }

  // ---- Header band ----
  doc.setFillColor(...RGB.ink);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(...RGB.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("APERS", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Academic Performance Report", margin, 21);

  const generatedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedOn}`, pageWidth - margin, 14, { align: "right" });

  y = 40;

  // ---- Student info card ----
  doc.setDrawColor(...RGB.hairline);
  doc.setFillColor(...RGB.paper);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

  doc.setTextColor(...RGB.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(name || "Student", margin + 6, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...RGB.muted);
  const subline = [identifier, department].filter(Boolean).join("  ·  ");
  if (subline) doc.text(subline, margin + 6, y + 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...RGB.good);
  doc.text(`${gpa} / 5.00`, pageWidth - margin - 6, y + 11, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...RGB.muted);
  doc.text(totalCreditUnits > 0 ? `` : "Not yet graded", pageWidth - margin - 6, y + 17, { align: "right" });

  y += 34;

  // ---- Strengths / needs attention summary ----
  if (strengths.length > 0 || weaknesses.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...RGB.good);
    doc.text("Strong courses:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...RGB.ink);
    doc.text(strengths.length > 0 ? strengths.map((s) => s.title).join(", ") : "None yet", margin + 30, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...RGB.poor);
    doc.text("Needs attention:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...RGB.ink);
    doc.text(weaknesses.length > 0 ? weaknesses.map((w) => w.title).join(", ") : "None", margin + 32, y);
    y += 10;
  }

  // ---- Course cards ----
  results.forEach((r) => {
    const tone = toneFor(r.category);
    const rec = recommendations[r.courseId];

    let estHeight = 34;
    let recLines: string[] = [];
    if (rec) {
      recLines = doc.splitTextToSize(rec.message, contentWidth - 14);
      estHeight += recLines.length * 4.5 + 8;
    }
    ensureSpace(estHeight);

    const cardTop = y;

    doc.setFillColor(...tone);
    doc.rect(margin, cardTop, 2.5, estHeight - 4, "F");

    doc.setDrawColor(...RGB.hairline);
    doc.roundedRect(margin, cardTop, contentWidth, estHeight - 4, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...RGB.ink);
    doc.text(`${r.code} — ${r.title}`, margin + 8, cardTop + 8);

    if (r.category) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const label = r.category;
      const badgeWidth = doc.getTextWidth(label) + 8;
      const badgeX = margin + contentWidth - badgeWidth - 4;
      doc.setFillColor(...tone);
      doc.roundedRect(badgeX, cardTop + 3.5, badgeWidth, 6.5, 3, 3, "F");
      doc.setTextColor(...RGB.white);
      doc.text(label, badgeX + badgeWidth / 2, cardTop + 8, { align: "center" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...RGB.muted);
    const scoreY = cardTop + 15;
    const cols = [
      { label: "CA", value: `${r.ca}/30` },
      { label: "Exam", value: `${r.exam}/70` },
      { label: "Attendance", value: `${r.attendance}%` },
      { label: "Total", value: `${r.total}/100${r.category ? ` (${toGradeLetter(r.total)})` : ""}` },
    ];
    const colWidth = contentWidth / cols.length;
    cols.forEach((c, idx) => {
      const cx = margin + 8 + idx * colWidth;
      doc.setTextColor(...RGB.muted);
      doc.setFontSize(7.5);
      doc.text(c.label.toUpperCase(), cx, scoreY);
      doc.setTextColor(...RGB.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(c.value, cx, scoreY + 5);
      doc.setFont("helvetica", "normal");
    });

    if (rec) {
      const recTop = cardTop + 24;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...RGB.muted);
      doc.text(
        r.category === "Poor" ? "RECOMMENDED ACADEMIC REMEDIATION" : "PRESCRIPTIVE ACADEMIC GUIDANCE",
        margin + 8,
        recTop
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...RGB.ink);
      doc.text(recLines, margin + 8, recTop + 5);
    }

    y = cardTop + estHeight;
  });

  // ---- Footer with page numbers ----
const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RGB.hairline);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...RGB.muted);
    doc.text("Academic Performance Evaluation and Recommendation System", margin, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  doc.save(`${name.replace(/\s+/g, "_")}_academic_report.pdf`);
}
