"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_COLORS: Record<string, string> = {
  Excellent: "#B8860B",
  Good: "#2C5F8A",
  Average: "#C1793C",
  Poor: "#A6432D",
};
const ORDER = ["Excellent", "Good", "Average", "Poor"];

export type FlowLink = { department: string; category: string; count: number };

const WIDTH = 560;
const HEIGHT = 280;
const NODE_W = 12;
const COL_LEFT = 90;
const COL_RIGHT = WIDTH - 90;

export default function DepartmentFlowChart({ links }: { links: FlowLink[] }) {
  const [hoverDept, setHoverDept] = useState<string | null>(null);
  const [hoverLink, setHoverLink] = useState<number | null>(null);

  const { departments, categories, nodePos, paths, total } = useMemo(() => {
    const departments = Array.from(new Set(links.map((l) => l.department))).sort();
    const categories = ORDER.filter((c) => links.some((l) => l.category === c));
    const total = links.reduce((s, l) => s + l.count, 0) || 1;

    const deptTotals = Object.fromEntries(departments.map((d) => [d, links.filter((l) => l.department === d).reduce((s, l) => s + l.count, 0)]));
    const catTotals = Object.fromEntries(categories.map((c) => [c, links.filter((l) => l.category === c).reduce((s, l) => s + l.count, 0)]));

    const gap = 10;
    const usableH = HEIGHT - gap * Math.max(departments.length - 1, 0);
    let y = 0;
    const deptY: Record<string, { y0: number; y1: number }> = {};
    for (const d of departments) {
      const h = Math.max((deptTotals[d] / total) * usableH, 6);
      deptY[d] = { y0: y, y1: y + h };
      y += h + gap;
    }

    const usableH2 = HEIGHT - gap * Math.max(categories.length - 1, 0);
    let y2 = 0;
    const catY: Record<string, { y0: number; y1: number }> = {};
    for (const c of categories) {
      const h = Math.max((catTotals[c] / total) * usableH2, 6);
      catY[c] = { y0: y2, y1: y2 + h };
      y2 += h + gap;
    }

    // running offsets for stacking multiple links into same node
    const deptOffset: Record<string, number> = Object.fromEntries(departments.map((d) => [d, deptY[d].y0]));
    const catOffset: Record<string, number> = Object.fromEntries(categories.map((c) => [c, catY[c].y0]));

    const paths = links
      .filter((l) => l.count > 0)
      .map((l) => {
        const h = Math.max((l.count / total) * usableH, 2);
        const sy0 = deptOffset[l.department];
        const sy1 = sy0 + h;
        deptOffset[l.department] += h;

        const h2 = Math.max((l.count / total) * usableH2, 2);
        const ty0 = catOffset[l.category];
        const ty1 = ty0 + h2;
        catOffset[l.category] += h2;

        const x0 = COL_LEFT + NODE_W;
        const x1 = COL_RIGHT - NODE_W;
        const xm = (x0 + x1) / 2;
        const path = `M${x0},${sy0} C${xm},${sy0} ${xm},${ty0} ${x1},${ty0} L${x1},${ty1} C${xm},${ty1} ${xm},${sy1} ${x0},${sy1} Z`;

        return { ...l, path, color: CATEGORY_COLORS[l.category] };
      });

    return { departments, categories, nodePos: { deptY, catY }, paths, total };
  }, [links]);

  if (links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department → Performance Flow</CardTitle>
          <CardDescription>No graded assessments yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-10 text-center text-sm text-[var(--admin-muted)]">Nothing to show yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department → Performance Flow</CardTitle>
        <CardDescription>Where each department's graded students land, by category</CardDescription>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Department to performance category flow">
          {paths.map((p, i) => {
            let opacity = 0.45; // resting state
            if (hoverLink !== null) {
              opacity = hoverLink === i ? 0.9 : 0.08;
            } else if (hoverDept) {
              opacity = hoverDept === p.department ? 0.65 : 0.08;
            }
            return (
              <path
                key={i}
                d={p.path}
                fill={p.color}
                opacity={opacity}
                style={{ cursor: "pointer", transition: "opacity 120ms ease" }}
                onMouseEnter={() => setHoverLink(i)}
                onMouseLeave={() => setHoverLink(null)}
              >
                <title>{`${p.department} → ${p.category}: ${p.count}`}</title>
              </path>
            );
          })}

          {departments.map((d) => {
            const pos = nodePos.deptY[d];
            return (
              <g key={d} onMouseEnter={() => setHoverDept(d)} onMouseLeave={() => setHoverDept(null)} style={{ cursor: "default" }}>
                <rect x={COL_LEFT} y={pos.y0} width={NODE_W} height={pos.y1 - pos.y0} fill="var(--admin-accent)" rx={2} />
                <text x={COL_LEFT - 8} y={(pos.y0 + pos.y1) / 2} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--admin-text)">
                  {d}
                </text>
              </g>
            );
          })}

          {categories.map((c) => {
            const pos = nodePos.catY[c];
            return (
              <g key={c}>
                <rect x={COL_RIGHT - NODE_W} y={pos.y0} width={NODE_W} height={pos.y1 - pos.y0} fill={CATEGORY_COLORS[c]} rx={2} />
                <text x={COL_RIGHT + 8} y={(pos.y0 + pos.y1) / 2} textAnchor="start" dominantBaseline="middle" fontSize={11} fill="var(--admin-text)">
                  {c}
                </text>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}