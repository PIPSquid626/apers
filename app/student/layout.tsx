"use client";

import Nav from "@/components/Nav";
import StudentTabs from "@/components/student/StudentTabs";
import { StudentDataProvider, useStudentDataContext } from "@/lib/student-data-context";
import { useTheme } from "@/lib/theme-context";

function StudentLayoutInner({ children }: { children: React.ReactNode }) {
  const { name } = useStudentDataContext();
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <Nav userName={name} role="student" theme={theme} onToggleTheme={toggleTheme} />
      <StudentTabs />
      <main className="min-h-screen w-full bg-brand-navy px-6 py-8 text-brand-text sm:px-10 lg:px-16">{children}</main>
    </>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentDataProvider>
      <StudentLayoutInner>{children}</StudentLayoutInner>
    </StudentDataProvider>
  );
}