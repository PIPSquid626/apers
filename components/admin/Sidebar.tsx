"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LogOut,
  type LucideIcon,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

const GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Overview",
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/admin" }],
  },
  {
    heading: "Academics",
    items: [
      { label: "Students", icon: Users, href: "/admin/students" },
      { label: "Courses", icon: BookOpen, href: "/admin/courses" },
      { label: "Enrollments", icon: ClipboardList, href: "/admin/enrollments" },
    ],
  },
  {
    heading: "Insights",
    items: [
      { label: "Performance", icon: BarChart3, href: "/admin/performance" },
      { label: "At-Risk Students", icon: AlertTriangle, href: "/admin/at-risk" },
    ],
  },
  {
    heading: "System",
    items: [{ label: "Settings", icon: SettingsIcon, href: "/admin/settings" }],
  },
];

export default function Sidebar({
  adminName,
  theme,
  onToggleTheme,
}: {
  adminName: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <aside
      className="flex h-screen w-60 shrink-0 flex-col border-r"
      style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)" }}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect width="48" height="48" rx="10" fill="#0A1420" />
          <path d="M24 10L36 17V31L24 38L12 31V17L24 10Z" stroke="#0EF2E0" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 18L30 21.5V28.5L24 32L18 28.5V21.5L24 18Z" fill="#0EF2E0" fillOpacity="0.15" stroke="#0EF2E0" strokeWidth="1.5" />
          <circle cx="24" cy="25" r="3" fill="#0EF2E0" />
          <path d="M24 10V18M36 31L30 28.5M12 31L18 28.5" stroke="#0EF2E0" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div>
          <div className="font-serif text-base font-bold leading-none" style={{ color: "var(--admin-text)" }}>
            APERS
          </div>
          <div className="text-[11px]" style={{ color: "var(--admin-muted)" }}>
            Admin Portal
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        {GROUPS.map((group) => (
          <div key={group.heading} className="mb-4">
            <div
              className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--admin-muted)" }}
            >
              {group.heading}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors"
                  style={{
                    background: active ? "var(--admin-accent)" : "transparent",
                    color: active ? "var(--admin-accent-contrast)" : "var(--admin-text)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t px-3 py-4" style={{ borderColor: "var(--admin-border)" }}>
        <div className="mb-3 px-2 text-sm" style={{ color: "var(--admin-text)" }}>
          {adminName || "Admin"}
        </div>
        <button
          onClick={onToggleTheme}
          className="mb-2 flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm font-medium"
          style={{ borderColor: "var(--admin-accent)", color: "var(--admin-accent)" }}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium"
          style={{ color: "var(--admin-muted)" }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}