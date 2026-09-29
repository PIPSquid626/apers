"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useStudentData } from "@/lib/useStudentData";

type StudentDataValue = ReturnType<typeof useStudentData>;

const StudentDataContext = createContext<StudentDataValue | null>(null);

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const data = useStudentData();
  return <StudentDataContext.Provider value={data}>{children}</StudentDataContext.Provider>;
}

export function useStudentDataContext() {
  const ctx = useContext(StudentDataContext);
  if (!ctx) throw new Error("useStudentDataContext must be used inside <StudentDataProvider>");
  return ctx;
}