"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  userName: string;
  role: string;
  // Only the admin dashboard passes these two — lecturer/student pages
  // don't, so the toggle button simply doesn't render for them.
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
};

export default function Nav({ userName, role, theme, onToggleTheme }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--admin-border, #1e3a52)",
        background: "var(--admin-bg, #0a1420)",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect width="48" height="48" rx="10" fill="#0A1420" />
          <path d="M24 10L36 17V31L24 38L12 31V17L24 10Z" stroke="#0EF2E0" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 18L30 21.5V28.5L24 32L18 28.5V21.5L24 18Z" fill="#0EF2E0" fillOpacity="0.15" stroke="#0EF2E0" strokeWidth="1.5" />
          <circle cx="24" cy="25" r="3" fill="#0EF2E0" />
          <path d="M24 10V18M36 31L30 28.5M12 31L18 28.5" stroke="#0EF2E0" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--admin-text, #eafcff)",
          }}
        >
          APERS
        </span>
        <span style={{ fontSize: 13, color: "var(--admin-muted, #b7c5d3)", textTransform: "capitalize" }}>
          {role} dashboard
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            aria-label="Toggle light and dark mode"
            style={{
              fontSize: 13,
              padding: "6px 14px",
              background: "transparent",
              border: "1px solid var(--admin-accent, #0ef2e0)",
              borderRadius: 999,
              cursor: "pointer",
              color: "var(--admin-accent, #0ef2e0)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        )}
        <span style={{ fontSize: 14, color: "var(--admin-text, #eafcff)" }}>{userName}</span>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: 13,
            padding: "6px 16px",
            background: "transparent",
            border: "1px solid var(--admin-accent, #0ef2e0)",
            borderRadius: 999,
            cursor: "pointer",
            color: "var(--admin-accent, #0ef2e0)",
            fontWeight: 600,
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}