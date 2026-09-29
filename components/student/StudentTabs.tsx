"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle2, ClipboardList, FileBarChart2 } from "lucide-react";

const TABS = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Profile", href: "/student/profile", icon: UserCircle2 },
  { label: "Course Registration", href: "/student/courses", icon: ClipboardList },
  { label: "Results", href: "/student/results", icon: FileBarChart2 },
];

export default function StudentTabs() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/student") return pathname === "/student";
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <div className="border-b border-hairline bg-white">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active ? "border-ink text-ink" : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}