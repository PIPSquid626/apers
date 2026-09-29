import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type Tone = "default" | "accent" | "warning";

export default function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = false,
  tone,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  /** @deprecated use `tone="accent"` instead — kept so existing call sites still work */
  accent?: boolean;
  tone?: Tone;
}) {
  const resolvedTone: Tone = tone ?? (accent ? "accent" : "default");

  const valueColor =
    resolvedTone === "accent" ? "text-[#0ef2e0]" : resolvedTone === "warning" ? "text-poor" : "text-brand-text";

  return (
    <Card className="flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-brand-muted">{label}</span>
        {Icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: resolvedTone === "warning" ? "rgba(166,67,45,0.15)" : "rgba(14,242,224,0.12)",
              color: resolvedTone === "warning" ? "#A6432D" : "#0ef2e0",
            }}
          >
            <Icon size={16} />
          </span>
        )}
      </div>
      <span className={`font-serif text-3xl font-semibold ${valueColor}`}>{value}</span>
      {hint && <span className="text-xs text-brand-muted">{hint}</span>}
    </Card>
  );
}